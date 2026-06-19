// Aqarati — Organization Service
// Create org, invite members, role management

use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug)]
pub struct OrganizationData {
    pub id: Uuid,
    pub name: String,
    pub owner_user_id: Uuid,
    pub status: String,
    pub logo_url: Option<String>,
    pub created_at: String,
}

#[derive(Debug)]
pub struct OrgMember {
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub status: String,
    pub full_name: Option<String>,
}

pub struct OrganizationService;

impl OrganizationService {
    /// Create a new organization
    pub async fn create(
        pool: &DbPool,
        name: &str,
        owner_user_id: Uuid,
    ) -> Result<OrganizationData, String> {
        let id = Uuid::new_v4();
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO organizations (id, name, owner_user_id) VALUES ($1, $2, $3)"
                )
                .bind(id)
                .bind(name)
                .bind(owner_user_id)
                .execute(p)
                .await
                .map_err(|e| format!("Org create: {}", e))?;

                // Add owner as member with 'owner' role
                sqlx::query(
                    "INSERT INTO organization_members (organization_id, user_id, role, status) VALUES ($1, $2, 'owner', 'active')"
                )
                .bind(id)
                .bind(owner_user_id)
                .execute(p)
                .await
                .map_err(|e| format!("Owner add: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO organizations (id, name, owner_user_id) VALUES (?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(name)
                .bind(owner_user_id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Org create: {}", e))?;

                sqlx::query(
                    "INSERT INTO organization_members (organization_id, user_id, role, status) VALUES (?, ?, 'owner', 'active')"
                )
                .bind(id.to_string())
                .bind(owner_user_id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Owner add: {}", e))?;
            }
        }

        Ok(OrganizationData {
            id,
            name: name.to_string(),
            owner_user_id,
            status: "active".to_string(),
            logo_url: None,
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    /// Get organizations for a user
    pub async fn list_for_user(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<Vec<OrganizationData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT o.id, o.name, o.owner_user_id, o.status, o.logo_url, o.created_at, om.role \
                     FROM organizations o \
                     JOIN organization_members om ON o.id = om.organization_id \
                     WHERE om.user_id = $1 AND om.status = 'active'"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Org list: {}", e))?;

                Ok(rows.into_iter().map(|row| OrganizationData {
                    id: row.try_get("id").unwrap_or_default(),
                    name: row.try_get("name").unwrap_or_default(),
                    owner_user_id: row.try_get("owner_user_id").unwrap_or_default(),
                    status: row.try_get("status").unwrap_or_default(),
                    logo_url: row.try_get("logo_url").ok(),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT o.id, o.name, o.owner_user_id, o.status, o.logo_url, o.created_at, om.role \
                     FROM organizations o \
                     JOIN organization_members om ON o.id = om.organization_id \
                     WHERE om.user_id = ? AND om.status = 'active'"
                )
                .bind(user_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| format!("Org list: {}", e))?;

                Ok(rows.into_iter().map(|row| OrganizationData {
                    id: row.try_get::<String, _>("id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    name: row.try_get("name").unwrap_or_default(),
                    owner_user_id: row.try_get::<String, _>("owner_user_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    status: row.try_get("status").unwrap_or_default(),
                    logo_url: row.try_get("logo_url").ok(),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
        }
    }

    /// Invite a user to an organization
    pub async fn invite_member(
        pool: &DbPool,
        organization_id: Uuid,
        inviter_id: Uuid,
        invited_user_id: Uuid,
        role: &str,
    ) -> Result<bool, String> {
        // Verify inviter has permission (must be owner or manager)
        Self::require_role(pool, organization_id, inviter_id, &["owner", "manager"]).await?;

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO organization_members (organization_id, user_id, role, status, invited_by) \
                     VALUES ($1, $2, CAST($3 AS org_role), 'invited', $4) \
                     ON CONFLICT (organization_id, user_id) DO UPDATE SET status = 'invited', role = CAST($3 AS org_role)"
                )
                .bind(organization_id)
                .bind(invited_user_id)
                .bind(role)
                .bind(inviter_id)
                .execute(p)
                .await
                .map_err(|e| format!("Invite member: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO organization_members (organization_id, user_id, role, status, invited_by) \
                     VALUES (?, ?, ?, 'invited', ?) \
                     ON DUPLICATE KEY UPDATE status = 'invited', role = ?"
                )
                .bind(organization_id.to_string())
                .bind(invited_user_id.to_string())
                .bind(role)
                .bind(inviter_id.to_string())
                .bind(role)
                .execute(p)
                .await
                .map_err(|e| format!("Invite member: {}", e))?;
            }
        }

        Ok(true)
    }

    /// Update member role
    pub async fn update_member_role(
        pool: &DbPool,
        organization_id: Uuid,
        requester_id: Uuid,
        target_user_id: Uuid,
        new_role: &str,
    ) -> Result<bool, String> {
        // Only owner can change roles
        Self::require_role(pool, organization_id, requester_id, &["owner"]).await?;

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "UPDATE organization_members SET role = CAST($1 AS org_role) WHERE organization_id = $2 AND user_id = $3"
                )
                .bind(new_role)
                .bind(organization_id)
                .bind(target_user_id)
                .execute(p)
                .await
                .map_err(|e| format!("Role update: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?"
                )
                .bind(new_role)
                .bind(organization_id.to_string())
                .bind(target_user_id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Role update: {}", e))?;
            }
        }

        Ok(true)
    }

    /// Remove a member from organization
    pub async fn remove_member(
        pool: &DbPool,
        organization_id: Uuid,
        requester_id: Uuid,
        target_user_id: Uuid,
    ) -> Result<bool, String> {
        Self::require_role(pool, organization_id, requester_id, &["owner", "manager"]).await?;

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND role != 'owner'"
                )
                .bind(organization_id)
                .bind(target_user_id)
                .execute(p)
                .await
                .map_err(|e| format!("Remove member: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "DELETE FROM organization_members WHERE organization_id = ? AND user_id = ? AND role != 'owner'"
                )
                .bind(organization_id.to_string())
                .bind(target_user_id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Remove member: {}", e))?;
            }
        }

        Ok(true)
    }

    /// Get organization members
    pub async fn get_members(
        pool: &DbPool,
        organization_id: Uuid,
    ) -> Result<Vec<OrgMember>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT om.organization_id, om.user_id, om.role::text, om.status, up.full_name \
                     FROM organization_members om \
                     JOIN user_profiles up ON om.user_id = up.user_id \
                     WHERE om.organization_id = $1 AND om.status = 'active'"
                )
                .bind(organization_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Members: {}", e))?;

                Ok(rows.into_iter().map(|row| OrgMember {
                    organization_id: row.try_get("organization_id").unwrap_or_default(),
                    user_id: row.try_get("user_id").unwrap_or_default(),
                    role: row.try_get("role").unwrap_or_default(),
                    status: row.try_get("status").unwrap_or_default(),
                    full_name: row.try_get("full_name").ok(),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT om.organization_id, om.user_id, om.role, om.status, up.full_name \
                     FROM organization_members om \
                     JOIN user_profiles up ON om.user_id = up.user_id \
                     WHERE om.organization_id = ? AND om.status = 'active'"
                )
                .bind(organization_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| format!("Members: {}", e))?;

                Ok(rows.into_iter().map(|row| OrgMember {
                    organization_id: row.try_get::<String, _>("organization_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    user_id: row.try_get::<String, _>("user_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    role: row.try_get("role").unwrap_or_default(),
                    status: row.try_get("status").unwrap_or_default(),
                    full_name: row.try_get("full_name").ok(),
                }).collect())
            }
        }
    }

    /// Get organization member count
    pub async fn get_member_count(pool: &DbPool, organization_id: Uuid) -> Result<i32, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT COUNT(*)::int as cnt FROM organization_members WHERE organization_id = $1 AND status = 'active'"
                )
                .bind(organization_id)
                .fetch_one(p)
                .await
                .map_err(|e| format!("Count: {}", e))?;
                Ok(row.try_get("cnt").unwrap_or(0))
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT COUNT(*) as cnt FROM organization_members WHERE organization_id = ? AND status = 'active'"
                )
                .bind(organization_id.to_string())
                .fetch_one(p)
                .await
                .map_err(|e| format!("Count: {}", e))?;
                Ok(row.try_get::<i64, _>("cnt").unwrap_or(0) as i32)
            }
        }
    }

    /// Get organization property count
    pub async fn get_property_count(pool: &DbPool, organization_id: Uuid) -> Result<i32, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT COUNT(*)::int as cnt FROM properties WHERE organization_id = $1 AND deleted_at IS NULL"
                )
                .bind(organization_id)
                .fetch_one(p)
                .await
                .map_err(|e| format!("Prop count: {}", e))?;
                Ok(row.try_get("cnt").unwrap_or(0))
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT COUNT(*) as cnt FROM properties WHERE organization_id = ? AND deleted_at IS NULL"
                )
                .bind(organization_id.to_string())
                .fetch_one(p)
                .await
                .map_err(|e| format!("Prop count: {}", e))?;
                Ok(row.try_get::<i64, _>("cnt").unwrap_or(0) as i32)
            }
        }
    }

    /// Verify user has required role in org
    async fn require_role(
        pool: &DbPool,
        org_id: Uuid,
        user_id: Uuid,
        allowed_roles: &[&str],
    ) -> Result<(), String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT role::text FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = 'active'"
                )
                .bind(org_id)
                .bind(user_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Role check: {}", e))?;

                let row = row.ok_or("Not a member of this organization")?;
                let role: String = row.try_get("role").unwrap_or_default();
                if !allowed_roles.contains(&role.as_str()) {
                    return Err("Insufficient permissions".to_string());
                }
                Ok(())
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND status = 'active'"
                )
                .bind(org_id.to_string())
                .bind(user_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Role check: {}", e))?;

                let row = row.ok_or("Not a member of this organization")?;
                let role: String = row.try_get("role").unwrap_or_default();
                if !allowed_roles.contains(&role.as_str()) {
                    return Err("Insufficient permissions".to_string());
                }
                Ok(())
            }
        }
    }
}

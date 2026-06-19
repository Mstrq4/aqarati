// Aqarati — RBAC Service
// Role-based access control: permission checking, role lookup, guards

use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug, Clone)]
pub struct UserPermission {
    pub permission_name: String,
    pub granted: bool,
}

pub struct RbacService;

impl RbacService {
    /// Get all permissions for a user
    pub async fn get_user_permissions(pool: &DbPool, user_id: Uuid) -> Result<Vec<String>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT DISTINCT p.name \
                     FROM permissions p \
                     JOIN role_permissions rp ON p.id = rp.permission_id \
                     JOIN user_roles ur ON rp.role_id = ur.role_id \
                     WHERE ur.user_id = $1"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Permission query failed: {}", e))?;

                Ok(rows.iter().map(|r| r.get::<String, _>("name")).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]), // MySQL path — stub
        }
    }

    /// Check if user has a specific permission
    pub async fn has_permission(pool: &DbPool, user_id: Uuid, permission: &str) -> Result<bool, String> {
        let permissions = Self::get_user_permissions(pool, user_id).await?;
        Ok(permissions.iter().any(|p| p == permission))
    }

    /// Check if user has admin access (any admin.* permission)
    pub async fn is_admin(pool: &DbPool, user_id: Uuid) -> Result<bool, String> {
        let permissions = Self::get_user_permissions(pool, user_id).await?;
        Ok(permissions.iter().any(|p| p.starts_with("admin.")))
    }

    /// Get user's roles
    pub async fn get_user_roles(pool: &DbPool, user_id: Uuid) -> Result<Vec<String>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT r.name FROM roles r \
                     JOIN user_roles ur ON r.id = ur.role_id \
                     WHERE ur.user_id = $1"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Role query failed: {}", e))?;

                Ok(rows.iter().map(|r| r.get::<String, _>("name")).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]),
        }
    }

    /// Guard: require a specific permission, return error if not granted
    pub async fn require_permission(pool: &DbPool, user_id: Uuid, permission: &str) -> Result<(), String> {
        if !Self::has_permission(pool, user_id, permission).await? {
            return Err(format!("Forbidden: missing permission '{}'", permission));
        }
        Ok(())
    }

    /// Guard: require admin access
    pub async fn require_admin(pool: &DbPool, user_id: Uuid) -> Result<(), String> {
        if !Self::is_admin(pool, user_id).await? {
            return Err("Forbidden: admin access required".to_string());
        }
        Ok(())
    }

    /// Assign role to user
    pub async fn assign_role(
        pool: &DbPool,
        user_id: Uuid,
        role_name: &str,
        assigned_by: Option<Uuid>,
    ) -> Result<(), String> {
        match pool {
            DbPool::Postgres(p) => {
                let role_id: Option<Uuid> = sqlx::query_scalar(
                    "SELECT id FROM roles WHERE name = $1"
                )
                .bind(role_name)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Role lookup failed: {}", e))?;

                let role_id = role_id.ok_or_else(|| format!("Role not found: {}", role_name))?;

                sqlx::query(
                    "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING"
                )
                .bind(user_id)
                .bind(role_id)
                .bind(assigned_by)
                .execute(p)
                .await
                .map_err(|e| format!("Role assignment failed: {}", e))?;

                Ok(())
            }
            DbPool::Mysql(_) => Ok(()),
        }
    }
}

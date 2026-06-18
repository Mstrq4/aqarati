// Aqarati — Contacts Service
// CRUD for contacts

use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

pub struct ContactData {
    pub id: Uuid,
    pub owner_user_id: Uuid,
    pub organization_id: Option<Uuid>,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub contact_type: String,
    pub notes: Option<String>,
    pub created_at: String,
}

pub struct ContactsService;

impl ContactsService {
    pub async fn create(
        pool: &DbPool,
        owner_user_id: Uuid,
        name: &str,
        phone: Option<&str>,
        email: Option<&str>,
        contact_type: &str,
        notes: Option<&str>,
        organization_id: Option<Uuid>,
    ) -> Result<ContactData, String> {
        let id = Uuid::new_v4();
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO contacts (id, owner_user_id, organization_id, name, phone, email, type, notes) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
                )
                .bind(id)
                .bind(owner_user_id)
                .bind(organization_id)
                .bind(name)
                .bind(phone)
                .bind(email)
                .bind(contact_type)
                .bind(notes)
                .execute(p)
                .await
                .map_err(|e| format!("Contact create: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO contacts (id, owner_user_id, organization_id, name, phone, email, type, notes) \
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(owner_user_id.to_string())
                .bind(organization_id.map(|o| o.to_string()))
                .bind(name)
                .bind(phone)
                .bind(email)
                .bind(contact_type)
                .bind(notes)
                .execute(p)
                .await
                .map_err(|e| format!("Contact create: {}", e))?;
            }
        }

        Ok(ContactData {
            id,
            owner_user_id,
            organization_id,
            name: name.to_string(),
            phone: phone.map(|s| s.to_string()),
            email: email.map(|s| s.to_string()),
            contact_type: contact_type.to_string(),
            notes: notes.map(|s| s.to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    pub async fn list_for_user(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<Vec<ContactData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, owner_user_id, organization_id, name, phone, email, type, notes, created_at \
                     FROM contacts WHERE owner_user_id = $1 ORDER BY created_at DESC"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Contacts list: {}", e))?;

                Ok(rows.into_iter().map(|row| ContactData {
                    id: row.try_get("id").unwrap_or_default(),
                    owner_user_id: row.try_get("owner_user_id").unwrap_or_default(),
                    organization_id: row.try_get("organization_id").ok().flatten(),
                    name: row.try_get("name").unwrap_or_default(),
                    phone: row.try_get("phone").ok(),
                    email: row.try_get("email").ok(),
                    contact_type: row.try_get("type").unwrap_or_else(|_| "source".to_string()),
                    notes: row.try_get("notes").ok(),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, owner_user_id, organization_id, name, phone, email, type, notes, created_at \
                     FROM contacts WHERE owner_user_id = ? ORDER BY created_at DESC"
                )
                .bind(user_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| format!("Contacts list: {}", e))?;

                Ok(rows.into_iter().map(|row| ContactData {
                    id: row.try_get::<String, _>("id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    owner_user_id: row.try_get::<String, _>("owner_user_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    organization_id: row.try_get::<String, _>("organization_id").ok().map(|s| Uuid::parse_str(&s).unwrap_or_default()),
                    name: row.try_get("name").unwrap_or_default(),
                    phone: row.try_get("phone").ok(),
                    email: row.try_get("email").ok(),
                    contact_type: row.try_get("type").unwrap_or_else(|_| "source".to_string()),
                    notes: row.try_get("notes").ok(),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
        }
    }

    pub async fn get_by_id(
        pool: &DbPool,
        id: Uuid,
        requester_id: Uuid,
    ) -> Result<Option<ContactData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT id, owner_user_id, organization_id, name, phone, email, type, notes, created_at \
                     FROM contacts WHERE id = $1 AND owner_user_id = $2"
                )
                .bind(id)
                .bind(requester_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Contact get: {}", e))?;

                Ok(row.map(|row| ContactData {
                    id: row.try_get("id").unwrap_or_default(),
                    owner_user_id: row.try_get("owner_user_id").unwrap_or_default(),
                    organization_id: row.try_get("organization_id").ok().flatten(),
                    name: row.try_get("name").unwrap_or_default(),
                    phone: row.try_get("phone").ok(),
                    email: row.try_get("email").ok(),
                    contact_type: row.try_get("type").unwrap_or_else(|_| "source".to_string()),
                    notes: row.try_get("notes").ok(),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }))
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT id, owner_user_id, organization_id, name, phone, email, type, notes, created_at \
                     FROM contacts WHERE id = ? AND owner_user_id = ?"
                )
                .bind(id.to_string())
                .bind(requester_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Contact get: {}", e))?;

                Ok(row.map(|row| ContactData {
                    id: row.try_get::<String, _>("id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    owner_user_id: row.try_get::<String, _>("owner_user_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    organization_id: row.try_get::<String, _>("organization_id").ok().map(|s| Uuid::parse_str(&s).unwrap_or_default()),
                    name: row.try_get("name").unwrap_or_default(),
                    phone: row.try_get("phone").ok(),
                    email: row.try_get("email").ok(),
                    contact_type: row.try_get("type").unwrap_or_else(|_| "source".to_string()),
                    notes: row.try_get("notes").ok(),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }))
            }
        }
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        requester_id: Uuid,
        name: Option<&str>,
        phone: Option<&str>,
        email: Option<&str>,
        contact_type: Option<&str>,
        notes: Option<&str>,
    ) -> Result<bool, String> {
        // Verify ownership
        let existing = Self::get_by_id(pool, id, requester_id).await?
            .ok_or("Contact not found")?;
        if existing.owner_user_id != requester_id {
            return Err("Access denied".to_string());
        }

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "UPDATE contacts SET name = COALESCE($1, name), phone = COALESCE($2, phone), \
                     email = COALESCE($3, email), type = COALESCE($4, type), notes = COALESCE($5, notes), \
                     updated_at = NOW() WHERE id = $6"
                )
                .bind(name)
                .bind(phone)
                .bind(email)
                .bind(contact_type)
                .bind(notes)
                .bind(id)
                .execute(p)
                .await
                .map_err(|e| format!("Contact update: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "UPDATE contacts SET name = COALESCE(?, name), phone = COALESCE(?, phone), \
                     email = COALESCE(?, email), type = COALESCE(?, type), notes = COALESCE(?, notes) \
                     WHERE id = ?"
                )
                .bind(name)
                .bind(phone)
                .bind(email)
                .bind(contact_type)
                .bind(notes)
                .bind(id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Contact update: {}", e))?;
            }
        }
        Ok(true)
    }

    pub async fn delete(pool: &DbPool, id: Uuid, requester_id: Uuid) -> Result<bool, String> {
        match pool {
            DbPool::Postgres(p) => {
                let r = sqlx::query(
                    "DELETE FROM contacts WHERE id = $1 AND owner_user_id = $2"
                )
                .bind(id)
                .bind(requester_id)
                .execute(p)
                .await
                .map_err(|e| format!("Contact delete: {}", e))?;
                Ok(r.rows_affected() > 0)
            }
            DbPool::Mysql(p) => {
                let r = sqlx::query(
                    "DELETE FROM contacts WHERE id = ? AND owner_user_id = ?"
                )
                .bind(id.to_string())
                .bind(requester_id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Contact delete: {}", e))?;
                Ok(r.rows_affected() > 0)
            }
        }
    }
}

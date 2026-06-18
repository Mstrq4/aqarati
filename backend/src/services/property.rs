// Aqarati — Property Service
// CRUD for properties with authorization checks

use chrono::Utc;
use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug, Clone)]
pub struct PropertyData {
    pub id: Uuid,
    pub owner_user_id: Uuid,
    pub organization_id: Option<Uuid>,
    pub visibility: String,
    pub purpose: String,
    pub property_type: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub completeness_score: i32,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
    pub deleted_at: Option<chrono::DateTime<Utc>>,
    // Location
    pub city: Option<String>,
    pub district: Option<String>,
    pub region: Option<String>,
    pub address_text: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    // Details
    pub area_sqm: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub street_width: Option<f64>,
    pub age_years: Option<i32>,
    pub floor_number: Option<i32>,
    pub furnished: Option<bool>,
    // Price
    pub price_amount: Option<f64>,
    pub currency: Option<String>,
    pub negotiable: bool,
    // Media
    pub main_image_url: Option<String>,
}

pub struct PropertyService;

impl PropertyService {
    /// Create a new property
    pub async fn create(
        pool: &DbPool,
        owner_user_id: Uuid,
        title: &str,
        property_type: &str,
        purpose: &str,
        description: Option<&str>,
        city: Option<&str>,
        district: Option<&str>,
        area_sqm: Option<f64>,
        bedrooms: Option<i32>,
        bathrooms: Option<i32>,
        price_amount: Option<f64>,
        visibility: Option<&str>,
        organization_id: Option<Uuid>,
        owner_phone: &str,
    ) -> Result<PropertyData, String> {
        let id = Uuid::new_v4();
        let vis = visibility.unwrap_or("private");

        if title.trim().is_empty() {
            return Err("Title is required".to_string());
        }
        if owner_phone.trim().is_empty() {
            return Err("Owner phone is mandatory".to_string());
        }

        match pool {
            DbPool::Postgres(p) => {
                let mut tx = p.begin().await.map_err(|e| format!("Tx begin: {}", e))?;

                sqlx::query(
                    "INSERT INTO properties (id, owner_user_id, organization_id, visibility, purpose, property_type, title, description, status, completeness_score) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', 20)"
                )
                .bind(id)
                .bind(owner_user_id)
                .bind(organization_id)
                .bind(vis)
                .bind(purpose)
                .bind(property_type)
                .bind(title)
                .bind(description)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Property insert: {}", e))?;

                sqlx::query(
                    "INSERT INTO property_locations (property_id, city, district) VALUES ($1, $2, $3)"
                )
                .bind(id)
                .bind(city)
                .bind(district)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Location insert: {}", e))?;

                sqlx::query(
                    "INSERT INTO property_details (property_id, area_sqm, bedrooms, bathrooms) VALUES ($1, $2, $3, $4)"
                )
                .bind(id)
                .bind(area_sqm)
                .bind(bedrooms)
                .bind(bathrooms)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Details insert: {}", e))?;

                if let Some(price) = price_amount {
                    sqlx::query(
                        "INSERT INTO property_prices (property_id, price_amount) VALUES ($1, $2)"
                    )
                    .bind(id)
                    .bind(price)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Price insert: {}", e))?;
                }

                tx.commit().await.map_err(|e| format!("Tx commit: {}", e))?;
            }
            DbPool::Mysql(p) => {
                let mut tx = p.begin().await.map_err(|e| format!("Tx begin: {}", e))?;

                sqlx::query(
                    "INSERT INTO properties (id, owner_user_id, organization_id, visibility, purpose, property_type, title, description, status, completeness_score) \
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 20)"
                )
                .bind(id.to_string())
                .bind(owner_user_id.to_string())
                .bind(organization_id.map(|o| o.to_string()))
                .bind(vis)
                .bind(purpose)
                .bind(property_type)
                .bind(title)
                .bind(description)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Property insert: {}", e))?;

                sqlx::query(
                    "INSERT INTO property_locations (property_id, city, district) VALUES (?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(city)
                .bind(district)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Location insert: {}", e))?;

                sqlx::query(
                    "INSERT INTO property_details (property_id, area_sqm, bedrooms, bathrooms) VALUES (?, ?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(area_sqm)
                .bind(bedrooms)
                .bind(bathrooms)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Details insert: {}", e))?;

                if let Some(price) = price_amount {
                    sqlx::query(
                        "INSERT INTO property_prices (property_id, price_amount) VALUES (?, ?)"
                    )
                    .bind(id.to_string())
                    .bind(price)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Price insert: {}", e))?;
                }

                tx.commit().await.map_err(|e| format!("Tx commit: {}", e))?;
            }
        }

        Self::get_by_id(pool, id, Some(owner_user_id)).await
    }

    /// Get a property by ID (with optional owner check)
    pub async fn get_by_id(
        pool: &DbPool,
        id: Uuid,
        requester_user_id: Option<Uuid>,
    ) -> Result<PropertyData, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.id = $1 AND p.deleted_at IS NULL"
                )
                .bind(id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Property query: {}", e))?
                .ok_or_else(|| "Property not found".to_string())?;

                let owner_user_id: Uuid = row.try_get("owner_user_id").map_err(|e| format!("owner parse: {}", e))?;

                if let Some(requester) = requester_user_id {
                    if requester != owner_user_id {
                        let visibility: String = row.try_get("visibility").unwrap_or_else(|_| "private".to_string());
                        if visibility == "private" {
                            let org_id: Option<Uuid> = row.try_get("organization_id").ok().flatten();
                            if let Some(oid) = org_id {
                                let is_member = Self::is_org_member(pool, requester, oid).await?;
                                if !is_member {
                                    return Err("Access denied: not the property owner".to_string());
                                }
                            } else {
                                return Err("Access denied: not the property owner".to_string());
                            }
                        }
                    }
                }

                Self::row_to_property_pg(&row)
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.id = ? AND p.deleted_at IS NULL"
                )
                .bind(id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Property query: {}", e))?
                .ok_or_else(|| "Property not found".to_string())?;

                let owner_user_id: Uuid = row.try_get("owner_user_id").map_err(|e| format!("owner parse: {}", e))?;

                if let Some(requester) = requester_user_id {
                    if requester != owner_user_id {
                        let visibility: String = row.try_get("visibility").unwrap_or_else(|_| "private".to_string());
                        if visibility == "private" {
                            let org_id: Option<Uuid> = row.try_get("organization_id").ok().flatten();
                            if let Some(oid) = org_id {
                                let is_member = Self::is_org_member(pool, requester, oid).await?;
                                if !is_member {
                                    return Err("Access denied: not the property owner".to_string());
                                }
                            } else {
                                return Err("Access denied: not the property owner".to_string());
                            }
                        }
                    }
                }

                Self::row_to_property_mysql(&row)
            }
        }
    }

    /// List properties for a user
    pub async fn list_by_user(
        pool: &DbPool,
        user_id: Uuid,
        limit: i32,
        offset: i32,
    ) -> Result<Vec<PropertyData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable, \
                     (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.owner_user_id = $1 AND p.deleted_at IS NULL \
                     ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
                )
                .bind(user_id)
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("List query: {}", e))?;

                rows.iter().map(|r| Self::row_to_property_pg(r)).collect()
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable, \
                     (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.owner_user_id = ? AND p.deleted_at IS NULL \
                     ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(user_id.to_string())
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("List query: {}", e))?;

                rows.iter().map(|r| Self::row_to_property_mysql(r)).collect()
            }
        }
    }

    /// List properties for an organization
    pub async fn list_by_org(
        pool: &DbPool,
        organization_id: Uuid,
        requester_id: Uuid,
        limit: i32,
        offset: i32,
    ) -> Result<Vec<PropertyData>, String> {
        if !Self::is_org_member(pool, requester_id, organization_id).await? {
            return Err("Access denied: not an organization member".to_string());
        }

        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable, \
                     (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.organization_id = $1 AND p.deleted_at IS NULL \
                     ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
                )
                .bind(organization_id)
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Org list: {}", e))?;

                rows.iter().map(|r| Self::row_to_property_pg(r)).collect()
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable, \
                     (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.organization_id = ? AND p.deleted_at IS NULL \
                     ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(organization_id.to_string())
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Org list: {}", e))?;

                rows.iter().map(|r| Self::row_to_property_mysql(r)).collect()
            }
        }
    }

    /// Update a property
    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        requester_id: Uuid,
        title: Option<&str>,
        property_type: Option<&str>,
        purpose: Option<&str>,
        description: Option<&str>,
        city: Option<&str>,
        status: Option<&str>,
        visibility: Option<&str>,
        area_sqm: Option<f64>,
        bedrooms: Option<i32>,
        bathrooms: Option<i32>,
        price_amount: Option<f64>,
    ) -> Result<PropertyData, String> {
        let existing = Self::get_by_id(pool, id, Some(requester_id)).await?;
        if existing.owner_user_id != requester_id {
            return Err("Access denied: not the property owner".to_string());
        }

        match pool {
            DbPool::Postgres(p) => {
                let mut tx = p.begin().await.map_err(|e| format!("Tx begin: {}", e))?;

                if title.is_some() || property_type.is_some() || purpose.is_some() || description.is_some() || status.is_some() || visibility.is_some() {
                    sqlx::query(
                        "UPDATE properties SET title = COALESCE($1, title), property_type = COALESCE($2, property_type), purpose = COALESCE($3, purpose), description = COALESCE($4, description), status = COALESCE($5, status), visibility = COALESCE($6, visibility), updated_at = NOW() WHERE id = $7"
                    )
                    .bind(title)
                    .bind(property_type)
                    .bind(purpose)
                    .bind(description)
                    .bind(status)
                    .bind(visibility)
                    .bind(id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Property update: {}", e))?;
                }

                if city.is_some() {
                    sqlx::query("UPDATE property_locations SET city = $1 WHERE property_id = $2")
                        .bind(city)
                        .bind(id)
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| format!("Location update: {}", e))?;
                }

                if area_sqm.is_some() || bedrooms.is_some() || bathrooms.is_some() {
                    sqlx::query(
                        "UPDATE property_details SET area_sqm = COALESCE($1, area_sqm), bedrooms = COALESCE($2, bedrooms), bathrooms = COALESCE($3, bathrooms) WHERE property_id = $4"
                    )
                    .bind(area_sqm)
                    .bind(bedrooms)
                    .bind(bathrooms)
                    .bind(id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Details update: {}", e))?;
                }

                if let Some(price) = price_amount {
                    sqlx::query("UPDATE property_prices SET valid_until = NOW() WHERE property_id = $1 AND valid_until IS NULL")
                        .bind(id)
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| format!("Price deactivate: {}", e))?;

                    sqlx::query("INSERT INTO property_prices (property_id, price_amount) VALUES ($1, $2)")
                        .bind(id)
                        .bind(price)
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| format!("Price insert: {}", e))?;
                }

                tx.commit().await.map_err(|e| format!("Tx commit: {}", e))?;
            }
            DbPool::Mysql(p) => {
                let mut tx = p.begin().await.map_err(|e| format!("Tx begin: {}", e))?;

                if title.is_some() || property_type.is_some() || purpose.is_some() || description.is_some() || status.is_some() || visibility.is_some() {
                    sqlx::query(
                        "UPDATE properties SET title = COALESCE(?, title), property_type = COALESCE(?, property_type), purpose = COALESCE(?, purpose), description = COALESCE(?, description), status = COALESCE(?, status), visibility = COALESCE(?, visibility), updated_at = NOW() WHERE id = ?"
                    )
                    .bind(title)
                    .bind(property_type)
                    .bind(purpose)
                    .bind(description)
                    .bind(status)
                    .bind(visibility)
                    .bind(id.to_string())
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Property update: {}", e))?;
                }

                if city.is_some() {
                    sqlx::query("UPDATE property_locations SET city = ? WHERE property_id = ?")
                        .bind(city)
                        .bind(id.to_string())
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| format!("Location update: {}", e))?;
                }

                if area_sqm.is_some() || bedrooms.is_some() || bathrooms.is_some() {
                    sqlx::query(
                        "UPDATE property_details SET area_sqm = COALESCE(?, area_sqm), bedrooms = COALESCE(?, bedrooms), bathrooms = COALESCE(?, bathrooms) WHERE property_id = ?"
                    )
                    .bind(area_sqm)
                    .bind(bedrooms)
                    .bind(bathrooms)
                    .bind(id.to_string())
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Details update: {}", e))?;
                }

                if let Some(price) = price_amount {
                    sqlx::query("UPDATE property_prices SET valid_until = NOW() WHERE property_id = ? AND valid_until IS NULL")
                        .bind(id.to_string())
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| format!("Price deactivate: {}", e))?;

                    sqlx::query("INSERT INTO property_prices (property_id, price_amount) VALUES (?, ?)")
                        .bind(id.to_string())
                        .bind(price)
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| format!("Price insert: {}", e))?;
                }

                tx.commit().await.map_err(|e| format!("Tx commit: {}", e))?;
            }
        }

        Self::get_by_id(pool, id, Some(requester_id)).await
    }

    /// Soft-delete a property
    pub async fn delete(pool: &DbPool, id: Uuid, requester_id: Uuid) -> Result<bool, String> {
        let existing = Self::get_by_id(pool, id, Some(requester_id)).await?;
        if existing.owner_user_id != requester_id {
            return Err("Access denied: not the property owner".to_string());
        }

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query("UPDATE properties SET deleted_at = NOW(), status = 'archived' WHERE id = $1")
                    .bind(id)
                    .execute(p)
                    .await
                    .map_err(|e| format!("Delete: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query("UPDATE properties SET deleted_at = NOW(), status = 'archived' WHERE id = ?")
                    .bind(id.to_string())
                    .execute(p)
                    .await
                    .map_err(|e| format!("Delete: {}", e))?;
            }
        }
        Ok(true)
    }

    /// Check if user is member of organization
    async fn is_org_member(pool: &DbPool, user_id: Uuid, org_id: Uuid) -> Result<bool, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = 'active'"
                )
                .bind(org_id)
                .bind(user_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Member check: {}", e))?;
                Ok(row.is_some())
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ? AND status = 'active'"
                )
                .bind(org_id.to_string())
                .bind(user_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Member check: {}", e))?;
                Ok(row.is_some())
            }
        }
    }

    /// List all properties (admin only)
    pub async fn list_all(
        pool: &DbPool,
        limit: i32,
        offset: i32,
    ) -> Result<Vec<PropertyData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable, \
                     (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.deleted_at IS NULL \
                     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
                )
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Admin list: {}", e))?;

                rows.iter().map(|r| Self::row_to_property_pg(r)).collect()
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT p.*, pl.city, pl.district, pl.region, pl.address_text, pl.lat, pl.lng, \
                     pd.area_sqm, pd.bedrooms, pd.bathrooms, pd.street_width, pd.age_years, pd.floor_number, pd.furnished, \
                     pp.price_amount, pp.currency, pp.negotiable, \
                     (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount, currency, negotiable FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.deleted_at IS NULL \
                     ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Admin list: {}", e))?;

                rows.iter().map(|r| Self::row_to_property_mysql(r)).collect()
            }
        }
    }

    /// Convert a Postgres row to PropertyData
    fn row_to_property_pg(row: &sqlx::postgres::PgRow) -> Result<PropertyData, String> {
        Ok(PropertyData {
            id: row.try_get("id").map_err(|e| format!("id: {}", e))?,
            owner_user_id: row.try_get("owner_user_id").map_err(|e| format!("owner: {}", e))?,
            organization_id: row.try_get("organization_id").ok().flatten(),
            visibility: row.try_get("visibility").unwrap_or_else(|_| "private".to_string()),
            purpose: row.try_get("purpose").unwrap_or_else(|_| "sale".to_string()),
            property_type: row.try_get("property_type").unwrap_or_else(|_| "other".to_string()),
            title: row.try_get("title").unwrap_or_default(),
            description: row.try_get("description").ok(),
            status: row.try_get("status").unwrap_or_else(|_| "draft".to_string()),
            completeness_score: row.try_get("completeness_score").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| Utc::now()),
            deleted_at: row.try_get("deleted_at").ok().flatten(),
            city: row.try_get("city").ok(),
            district: row.try_get("district").ok(),
            region: row.try_get("region").ok(),
            address_text: row.try_get("address_text").ok(),
            lat: row.try_get("lat").ok(),
            lng: row.try_get("lng").ok(),
            area_sqm: row.try_get("area_sqm").ok(),
            bedrooms: row.try_get("bedrooms").ok(),
            bathrooms: row.try_get("bathrooms").ok(),
            street_width: row.try_get("street_width").ok(),
            age_years: row.try_get("age_years").ok(),
            floor_number: row.try_get("floor_number").ok(),
            furnished: row.try_get("furnished").ok(),
            price_amount: row.try_get("price_amount").ok(),
            currency: row.try_get("currency").ok(),
            negotiable: row.try_get("negotiable").unwrap_or(false),
            main_image_url: row.try_get("main_image_url").ok(),
        })
    }

    /// Convert a MySQL row to PropertyData
    fn row_to_property_mysql(row: &sqlx::mysql::MySqlRow) -> Result<PropertyData, String> {
        Ok(PropertyData {
            id: row.try_get("id").map_err(|e| format!("id: {}", e))?,
            owner_user_id: row.try_get("owner_user_id").map_err(|e| format!("owner: {}", e))?,
            organization_id: row.try_get("organization_id").ok().flatten(),
            visibility: row.try_get("visibility").unwrap_or_else(|_| "private".to_string()),
            purpose: row.try_get("purpose").unwrap_or_else(|_| "sale".to_string()),
            property_type: row.try_get("property_type").unwrap_or_else(|_| "other".to_string()),
            title: row.try_get("title").unwrap_or_default(),
            description: row.try_get("description").ok(),
            status: row.try_get("status").unwrap_or_else(|_| "draft".to_string()),
            completeness_score: row.try_get("completeness_score").unwrap_or(0),
            created_at: row.try_get("created_at").unwrap_or_else(|_| Utc::now()),
            updated_at: row.try_get("updated_at").unwrap_or_else(|_| Utc::now()),
            deleted_at: row.try_get("deleted_at").ok().flatten(),
            city: row.try_get("city").ok(),
            district: row.try_get("district").ok(),
            region: row.try_get("region").ok(),
            address_text: row.try_get("address_text").ok(),
            lat: row.try_get("lat").ok(),
            lng: row.try_get("lng").ok(),
            area_sqm: row.try_get("area_sqm").ok(),
            bedrooms: row.try_get("bedrooms").ok(),
            bathrooms: row.try_get("bathrooms").ok(),
            street_width: row.try_get("street_width").ok(),
            age_years: row.try_get("age_years").ok(),
            floor_number: row.try_get("floor_number").ok(),
            furnished: row.try_get("furnished").ok(),
            price_amount: row.try_get("price_amount").ok(),
            currency: row.try_get("currency").ok(),
            negotiable: row.try_get("negotiable").unwrap_or(false),
            main_image_url: row.try_get("main_image_url").ok(),
        })
    }
}

// Aqarati — Search Service
// Full-text search, filters, saved searches

use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug, Clone)]
pub struct SearchResult {
    pub id: Uuid,
    pub title: String,
    pub property_type: String,
    pub purpose: String,
    pub price_amount: Option<f64>,
    pub city: Option<String>,
    pub district: Option<String>,
    pub area_sqm: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub status: String,
    pub main_image_url: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone)]
pub struct SavedSearch {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub filters: String,
    pub notify: bool,
    pub created_at: String,
}

#[derive(Debug)]
pub struct SearchFilters {
    pub query: Option<String>,
    pub city: Option<String>,
    pub property_type: Option<Vec<String>>,
    pub purpose: Option<Vec<String>>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub min_area: Option<f64>,
    pub max_area: Option<f64>,
    pub bedrooms: Option<i32>,
}

pub struct SearchService;

impl SearchService {
    /// Search properties with full-text search and filters
    pub async fn search(
        pool: &DbPool,
        filters: SearchFilters,
        limit: i32,
        offset: i32,
    ) -> Result<Vec<SearchResult>, String> {
        let query_str = filters.query.as_deref().unwrap_or("");
        let city = filters.city.as_deref().unwrap_or("");

        match pool {
            DbPool::Postgres(p) => {
                let rows = if !query_str.is_empty() {
                    sqlx::query(
                        "SELECT p.id, p.title, p.property_type, p.purpose, p.status, p.created_at, \
                         pp.price_amount, pl.city, pl.district, pd.area_sqm, pd.bedrooms, pd.bathrooms, \
                         (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                         FROM properties p \
                         LEFT JOIN property_locations pl ON p.id = pl.property_id \
                         LEFT JOIN property_details pd ON p.id = pd.property_id \
                         LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                         WHERE p.deleted_at IS NULL AND p.visibility = 'public' \
                         AND (p.title ILIKE $1 OR p.description ILIKE $1 OR pl.city ILIKE $2) \
                         ORDER BY p.created_at DESC LIMIT $3 OFFSET $4"
                    )
                    .bind(format!("%{}%", query_str))
                    .bind(format!("%{}%", if city.is_empty() { query_str } else { city }))
                    .bind(limit)
                    .bind(offset)
                    .fetch_all(p)
                    .await
                    .map_err(|e| format!("Search: {}", e))?
                } else {
                    sqlx::query(
                        "SELECT p.id, p.title, p.property_type, p.purpose, p.status, p.created_at, \
                         pp.price_amount, pl.city, pl.district, pd.area_sqm, pd.bedrooms, pd.bathrooms, \
                         (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                         FROM properties p \
                         LEFT JOIN property_locations pl ON p.id = pl.property_id \
                         LEFT JOIN property_details pd ON p.id = pd.property_id \
                         LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                         WHERE p.deleted_at IS NULL AND p.visibility = 'public' \
                         ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
                    )
                    .bind(limit)
                    .bind(offset)
                    .fetch_all(p)
                    .await
                    .map_err(|e| format!("Search: {}", e))?
                };

                let mut results = Vec::new();
                for row in rows {
                    let created_at: String = row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339())
                        .unwrap_or_default();
                    results.push(SearchResult {
                        id: row.try_get("id").unwrap_or_default(),
                        title: row.try_get("title").unwrap_or_default(),
                        property_type: row.try_get("property_type").unwrap_or_default(),
                        purpose: row.try_get("purpose").unwrap_or_default(),
                        price_amount: row.try_get("price_amount").ok(),
                        city: row.try_get("city").ok(),
                        district: row.try_get("district").ok(),
                        area_sqm: row.try_get("area_sqm").ok(),
                        bedrooms: row.try_get("bedrooms").ok(),
                        bathrooms: row.try_get("bathrooms").ok(),
                        status: row.try_get("status").unwrap_or_default(),
                        main_image_url: row.try_get("main_image_url").ok(),
                        created_at,
                    });
                }
                Ok(results)
            }
            DbPool::Mysql(p) => {
                let rows = if !query_str.is_empty() {
                    sqlx::query(
                        "SELECT p.id, p.title, p.property_type, p.purpose, p.status, p.created_at, \
                         pp.price_amount, pl.city, pl.district, pd.area_sqm, pd.bedrooms, pd.bathrooms, \
                         (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                         FROM properties p \
                         LEFT JOIN property_locations pl ON p.id = pl.property_id \
                         LEFT JOIN property_details pd ON p.id = pd.property_id \
                         LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                         WHERE p.deleted_at IS NULL AND p.visibility = 'public' \
                         AND (p.title LIKE ? OR p.description LIKE ? OR pl.city LIKE ?) \
                         ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
                    )
                    .bind(format!("%{}%", query_str))
                    .bind(format!("%{}%", query_str))
                    .bind(format!("%{}%", if city.is_empty() { query_str } else { city }))
                    .bind(limit)
                    .bind(offset)
                    .fetch_all(p)
                    .await
                    .map_err(|e| format!("Search: {}", e))?
                } else {
                    sqlx::query(
                        "SELECT p.id, p.title, p.property_type, p.purpose, p.status, p.created_at, \
                         pp.price_amount, pl.city, pl.district, pd.area_sqm, pd.bedrooms, pd.bathrooms, \
                         (SELECT pm.thumbnail_key FROM property_media pm WHERE pm.property_id = p.id AND pm.is_primary = true LIMIT 1) as main_image_url \
                         FROM properties p \
                         LEFT JOIN property_locations pl ON p.id = pl.property_id \
                         LEFT JOIN property_details pd ON p.id = pd.property_id \
                         LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                         WHERE p.deleted_at IS NULL AND p.visibility = 'public' \
                         ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
                    )
                    .bind(limit)
                    .bind(offset)
                    .fetch_all(p)
                    .await
                    .map_err(|e| format!("Search: {}", e))?
                };

                let mut results = Vec::new();
                for row in rows {
                    let created_at: String = row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339())
                        .unwrap_or_default();
                    results.push(SearchResult {
                        id: row.try_get("id").unwrap_or_default(),
                        title: row.try_get("title").unwrap_or_default(),
                        property_type: row.try_get("property_type").unwrap_or_default(),
                        purpose: row.try_get("purpose").unwrap_or_default(),
                        price_amount: row.try_get("price_amount").ok(),
                        city: row.try_get("city").ok(),
                        district: row.try_get("district").ok(),
                        area_sqm: row.try_get("area_sqm").ok(),
                        bedrooms: row.try_get("bedrooms").ok(),
                        bathrooms: row.try_get("bathrooms").ok(),
                        status: row.try_get("status").unwrap_or_default(),
                        main_image_url: row.try_get("main_image_url").ok(),
                        created_at,
                    });
                }
                Ok(results)
            }
        }
    }

    /// Save a search
    pub async fn save_search(
        pool: &DbPool,
        user_id: Uuid,
        name: &str,
        filters: &str,
        notify: bool,
    ) -> Result<SavedSearch, String> {
        let id = Uuid::new_v4();
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO saved_searches (id, user_id, name, filters, notify) VALUES ($1, $2, $3, $4, $5)"
                )
                .bind(id)
                .bind(user_id)
                .bind(name)
                .bind(filters)
                .bind(notify)
                .execute(p)
                .await
                .map_err(|e| format!("Save search: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO saved_searches (id, user_id, name, filters, notify) VALUES (?, ?, ?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(user_id.to_string())
                .bind(name)
                .bind(filters)
                .bind(notify)
                .execute(p)
                .await
                .map_err(|e| format!("Save search: {}", e))?;
            }
        }

        Ok(SavedSearch {
            id,
            user_id,
            name: name.to_string(),
            filters: filters.to_string(),
            notify,
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    /// Get saved searches for a user
    pub async fn get_saved_searches(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<Vec<SavedSearch>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, user_id, name, filters, notify, created_at \
                     FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Saved searches: {}", e))?;

                Ok(rows.into_iter().map(|row| SavedSearch {
                    id: row.try_get("id").unwrap_or_default(),
                    user_id: row.try_get("user_id").unwrap_or_default(),
                    name: row.try_get("name").unwrap_or_default(),
                    filters: row.try_get("filters").unwrap_or_default(),
                    notify: row.try_get("notify").unwrap_or(false),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, user_id, name, filters, notify, created_at \
                     FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC"
                )
                .bind(user_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| format!("Saved searches: {}", e))?;

                Ok(rows.into_iter().map(|row| SavedSearch {
                    id: row.try_get("id").unwrap_or_default(),
                    user_id: row.try_get("user_id").unwrap_or_default(),
                    name: row.try_get("name").unwrap_or_default(),
                    filters: row.try_get("filters").unwrap_or_default(),
                    notify: row.try_get::<i8, _>("notify").map(|v| v != 0).unwrap_or(false),
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
        }
    }

    /// Delete a saved search
    pub async fn delete_saved_search(pool: &DbPool, id: Uuid, user_id: Uuid) -> Result<bool, String> {
        match pool {
            DbPool::Postgres(p) => {
                let r = sqlx::query("DELETE FROM saved_searches WHERE id = $1 AND user_id = $2")
                    .bind(id)
                    .bind(user_id)
                    .execute(p)
                    .await
                    .map_err(|e| format!("Delete search: {}", e))?;
                Ok(r.rows_affected() > 0)
            }
            DbPool::Mysql(p) => {
                let r = sqlx::query("DELETE FROM saved_searches WHERE id = ? AND user_id = ?")
                    .bind(id.to_string())
                    .bind(user_id.to_string())
                    .execute(p)
                    .await
                    .map_err(|e| format!("Delete search: {}", e))?;
                Ok(r.rows_affected() > 0)
            }
        }
    }
}

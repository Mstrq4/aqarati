// Aqarati — Payment Provider Service
// CRUD for payment_providers table

use sqlx::Row;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentProviderRecord {
    pub id: Uuid,
    pub provider_key: String,
    pub display_name: String,
    pub is_enabled: bool,
    pub supported_methods: Vec<String>,
    pub config: serde_json::Value,
}

pub struct PaymentProviderService;

impl PaymentProviderService {
    /// List all payment providers
    pub async fn list_all(pool: &DbPool) -> Result<Vec<PaymentProviderRecord>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, provider_key, display_name, is_enabled, supported_methods, config \
                     FROM payment_providers \
                     ORDER BY provider_key"
                )
                .fetch_all(p)
                .await
                .map_err(|e| format!("List payment providers failed: {}", e))?;

                Ok(rows
                    .iter()
                    .map(|r| {
                        let id: Uuid = r.try_get("id").unwrap_or_default();
                        let provider_key: String =
                            r.try_get("provider_key").unwrap_or_default();
                        let display_name: String =
                            r.try_get("display_name").unwrap_or_default();
                        let is_enabled: bool =
                            r.try_get("is_enabled").unwrap_or(false);
                        let supported_methods: serde_json::Value =
                            r.try_get("supported_methods").unwrap_or(serde_json::Value::Array(vec![]));
                        let config: serde_json::Value =
                            r.try_get("config").unwrap_or(serde_json::json!({}));
                        PaymentProviderRecord {
                            id,
                            provider_key,
                            display_name,
                            is_enabled,
                            supported_methods: supported_methods
                                .as_array()
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect()
                                })
                                .unwrap_or_default(),
                            config,
                        }
                    })
                    .collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, provider_key, display_name, is_enabled, supported_methods, config \
                     FROM payment_providers \
                     ORDER BY provider_key"
                )
                .fetch_all(p)
                .await
                .map_err(|e| format!("List payment providers failed: {}", e))?;

                Ok(rows
                    .iter()
                    .map(|r| {
                        let raw_id: String = r.try_get("id").unwrap_or_default();
                        let id = Uuid::parse_str(&raw_id).unwrap_or_default();
                        let provider_key: String =
                            r.try_get("provider_key").unwrap_or_default();
                        let display_name: String =
                            r.try_get("display_name").unwrap_or_default();
                        let is_enabled: bool =
                            r.try_get("is_enabled").unwrap_or(false);
                        let supported_methods: serde_json::Value =
                            r.try_get("supported_methods").unwrap_or(serde_json::Value::Array(vec![]));
                        let config: serde_json::Value =
                            r.try_get("config").unwrap_or(serde_json::json!({}));
                        PaymentProviderRecord {
                            id,
                            provider_key,
                            display_name,
                            is_enabled,
                            supported_methods: supported_methods
                                .as_array()
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect()
                                })
                                .unwrap_or_default(),
                            config,
                        }
                    })
                    .collect())
            }
        }
    }

    /// Toggle provider enabled/disabled
    pub async fn toggle(pool: &DbPool, provider_key: &str, enabled: bool) -> Result<bool, String> {
        match pool {
            DbPool::Postgres(p) => {
                let result = sqlx::query(
                    "UPDATE payment_providers SET is_enabled = $1, updated_at = NOW() \
                     WHERE provider_key = $2"
                )
                .bind(enabled)
                .bind(provider_key)
                .execute(p)
                .await
                .map_err(|e| format!("Toggle provider failed: {}", e))?;
                Ok(result.rows_affected() > 0)
            }
            DbPool::Mysql(p) => {
                let result = sqlx::query(
                    "UPDATE payment_providers SET is_enabled = ?, updated_at = NOW() \
                     WHERE provider_key = ?"
                )
                .bind(enabled)
                .bind(provider_key)
                .execute(p)
                .await
                .map_err(|e| format!("Toggle provider failed: {}", e))?;
                Ok(result.rows_affected() > 0)
            }
        }
    }
}

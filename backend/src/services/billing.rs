// Aqarati — Billing Service
// Subscriptions, plans, payment records

use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug)]
pub struct PlanData {
    pub id: Uuid,
    pub name: String,
    pub tier: String,
    pub description: Option<String>,
    pub price_monthly_sar: f64,
    pub price_yearly_sar: f64,
    pub max_properties: i32,
    pub max_images_per_property: i32,
    pub max_organization_members: i32,
    pub max_saved_searches: i32,
    pub ai_enabled: bool,
    pub export_enabled: bool,
    pub features: Vec<String>,
    pub is_active: bool,
}

#[derive(Debug)]
pub struct SubscriptionData {
    pub id: Uuid,
    pub user_id: Uuid,
    pub organization_id: Option<Uuid>,
    pub plan_id: Uuid,
    pub plan_name: String,
    pub tier: String,
    pub status: String,
    pub current_period_start: String,
    pub current_period_end: String,
}

#[derive(Debug)]
pub struct PaymentData {
    pub id: Uuid,
    pub subscription_id: Uuid,
    pub amount_sar: f64,
    pub provider: String,
    pub status: String,
    pub created_at: String,
}

pub struct BillingService;

impl BillingService {
    /// Get all active plans
    pub async fn get_plans(pool: &DbPool) -> Result<Vec<PlanData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, name, tier::text, description, price_monthly_sar, price_yearly_sar, \
                     max_properties, max_images_per_property, max_organization_members, max_saved_searches, \
                     ai_enabled, export_enabled, features::text, is_active \
                     FROM plans WHERE is_active = true ORDER BY price_monthly_sar"
                )
                .fetch_all(p)
                .await
                .map_err(|e| format!("Plans: {}", e))?;

                Ok(rows.into_iter().map(|row| {
                    let features_str: String = row.try_get("features").unwrap_or_else(|_| "[]".to_string());
                    let features: Vec<String> = serde_json::from_str(&features_str).unwrap_or_default();
                    PlanData {
                        id: row.try_get("id").unwrap_or_default(),
                        name: row.try_get("name").unwrap_or_default(),
                        tier: row.try_get("tier").unwrap_or_default(),
                        description: row.try_get("description").ok(),
                        price_monthly_sar: row.try_get::<f64, _>("price_monthly_sar").unwrap_or(0.0),
                        price_yearly_sar: row.try_get::<f64, _>("price_yearly_sar").unwrap_or(0.0),
                        max_properties: row.try_get("max_properties").unwrap_or(10),
                        max_images_per_property: row.try_get("max_images_per_property").unwrap_or(5),
                        max_organization_members: row.try_get("max_organization_members").unwrap_or(0),
                        max_saved_searches: row.try_get("max_saved_searches").unwrap_or(3),
                        ai_enabled: row.try_get("ai_enabled").unwrap_or(false),
                        export_enabled: row.try_get("export_enabled").unwrap_or(false),
                        features,
                        is_active: row.try_get("is_active").unwrap_or(true),
                    }
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, name, tier, description, price_monthly_sar, price_yearly_sar, \
                     max_properties, max_images_per_property, max_organization_members, max_saved_searches, \
                     ai_enabled, export_enabled, features, is_active \
                     FROM plans WHERE is_active = 1 ORDER BY price_monthly_sar"
                )
                .fetch_all(p)
                .await
                .map_err(|e| format!("Plans: {}", e))?;

                Ok(rows.into_iter().map(|row| {
                    let features_val: serde_json::Value = row.try_get("features").unwrap_or(serde_json::Value::Array(vec![]));
                    let features: Vec<String> = features_val.as_array()
                        .map(|a| a.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                        .unwrap_or_default();
                    PlanData {
                        id: row.try_get::<String, _>("id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                        name: row.try_get("name").unwrap_or_default(),
                        tier: row.try_get("tier").unwrap_or_default(),
                        description: row.try_get("description").ok(),
                        price_monthly_sar: row.try_get::<f64, _>("price_monthly_sar").unwrap_or(0.0),
                        price_yearly_sar: row.try_get::<f64, _>("price_yearly_sar").unwrap_or(0.0),
                        max_properties: row.try_get::<i32, _>("max_properties").unwrap_or(10),
                        max_images_per_property: row.try_get::<i32, _>("max_images_per_property").unwrap_or(5),
                        max_organization_members: row.try_get::<i32, _>("max_organization_members").unwrap_or(0),
                        max_saved_searches: row.try_get::<i32, _>("max_saved_searches").unwrap_or(3),
                        ai_enabled: row.try_get::<i8, _>("ai_enabled").map(|v| v != 0).unwrap_or(false),
                        export_enabled: row.try_get::<i8, _>("export_enabled").map(|v| v != 0).unwrap_or(false),
                        features,
                        is_active: row.try_get::<i8, _>("is_active").map(|v| v != 0).unwrap_or(true),
                    }
                }).collect())
            }
        }
    }

    /// Get user's subscription
    pub async fn get_subscription(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<Option<SubscriptionData>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT s.id, s.user_id, s.organization_id, s.plan_id, s.status::text, \
                     s.current_period_start, s.current_period_end, \
                     p.name as plan_name, p.tier::text as tier \
                     FROM subscriptions s \
                     JOIN plans p ON s.plan_id = p.id \
                     WHERE s.user_id = $1 AND s.status IN ('active', 'trial') \
                     ORDER BY s.current_period_end DESC LIMIT 1"
                )
                .bind(user_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Subscription: {}", e))?;

                Ok(row.map(|r| SubscriptionData {
                    id: r.try_get("id").unwrap_or_default(),
                    user_id: r.try_get("user_id").unwrap_or_default(),
                    organization_id: r.try_get("organization_id").ok().flatten(),
                    plan_id: r.try_get("plan_id").unwrap_or_default(),
                    plan_name: r.try_get("plan_name").unwrap_or_default(),
                    tier: r.try_get("tier").unwrap_or_default(),
                    status: r.try_get("status").unwrap_or_default(),
                    current_period_start: r.try_get::<chrono::DateTime<chrono::Utc>, _>("current_period_start")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                    current_period_end: r.try_get::<chrono::DateTime<chrono::Utc>, _>("current_period_end")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }))
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT s.id, s.user_id, s.organization_id, s.plan_id, s.status, \
                     s.current_period_start, s.current_period_end, \
                     p.name as plan_name, p.tier \
                     FROM subscriptions s \
                     JOIN plans p ON s.plan_id = p.id \
                     WHERE s.user_id = ? AND s.status IN ('active', 'trial') \
                     ORDER BY s.current_period_end DESC LIMIT 1"
                )
                .bind(user_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Subscription: {}", e))?;

                Ok(row.map(|r| SubscriptionData {
                    id: r.try_get::<String, _>("id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    user_id: r.try_get::<String, _>("user_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    organization_id: r.try_get::<String, _>("organization_id").ok().map(|s| Uuid::parse_str(&s).unwrap_or_default()),
                    plan_id: r.try_get::<String, _>("plan_id").map(|s| Uuid::parse_str(&s).unwrap_or_default()).unwrap_or_default(),
                    plan_name: r.try_get("plan_name").unwrap_or_default(),
                    tier: r.try_get("tier").unwrap_or_default(),
                    status: r.try_get("status").unwrap_or_default(),
                    current_period_start: r.try_get::<chrono::DateTime<chrono::Utc>, _>("current_period_start")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                    current_period_end: r.try_get::<chrono::DateTime<chrono::Utc>, _>("current_period_end")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }))
            }
        }
    }

    /// Subscribe user to a plan
    pub async fn subscribe(
        pool: &DbPool,
        user_id: Uuid,
        plan_id: Uuid,
    ) -> Result<SubscriptionData, String> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let period_end = now + chrono::Duration::days(30);

        // Get plan details
        let (plan_name, tier): (String, String) = match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query("SELECT name, tier::text FROM plans WHERE id = $1 AND is_active = true")
                    .bind(plan_id)
                    .fetch_optional(p)
                    .await
                    .map_err(|e| format!("Plan lookup: {e}"))?
                    .ok_or("Plan not found or inactive")?;
                let name: String = row.try_get("name").unwrap_or_default();
                let tier: String = row.try_get("tier").unwrap_or_default();
                (name, tier)
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query("SELECT name, tier FROM plans WHERE id = ? AND is_active = 1")
                    .bind(plan_id.to_string())
                    .fetch_optional(p)
                    .await
                    .map_err(|e| format!("Plan lookup: {e}"))?
                    .ok_or("Plan not found or inactive")?;
                let name: String = row.try_get("name").unwrap_or_default();
                let tier: String = row.try_get("tier").unwrap_or_default();
                (name, tier)
            }
        };

        // Cancel existing active subscriptions
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query("UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE user_id = $1 AND status IN ('active', 'trial')")
                    .bind(user_id)
                    .execute(p)
                    .await
                    .map_err(|e| format!("Cancel old subs: {}", e))?;

                sqlx::query(
                    "INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end) \
                     VALUES ($1, $2, $3, 'active', $4, $5)"
                )
                .bind(id)
                .bind(user_id)
                .bind(plan_id)
                .bind(now)
                .bind(period_end)
                .execute(p)
                .await
                .map_err(|e| format!("Subscribe: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query("UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE user_id = ? AND status IN ('active', 'trial')")
                    .bind(user_id.to_string())
                    .execute(p)
                    .await
                    .map_err(|e| format!("Cancel old subs: {}", e))?;

                sqlx::query(
                    "INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end) \
                     VALUES (?, ?, ?, 'active', ?, ?)"
                )
                .bind(id.to_string())
                .bind(user_id.to_string())
                .bind(plan_id.to_string())
                .bind(now)
                .bind(period_end)
                .execute(p)
                .await
                .map_err(|e| format!("Subscribe: {}", e))?;
            }
        }

        Ok(SubscriptionData {
            id,
            user_id,
            organization_id: None,
            plan_id,
            plan_name,
            tier,
            status: "active".to_string(),
            current_period_start: now.to_rfc3339(),
            current_period_end: period_end.to_rfc3339(),
        })
    }

    /// Cancel subscription
    pub async fn cancel_subscription(pool: &DbPool, user_id: Uuid) -> Result<bool, String> {
        match pool {
            DbPool::Postgres(p) => {
                let r = sqlx::query(
                    "UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE user_id = $1 AND status IN ('active', 'trial')"
                )
                .bind(user_id)
                .execute(p)
                .await
                .map_err(|e| format!("Cancel: {}", e))?;
                Ok(r.rows_affected() > 0)
            }
            DbPool::Mysql(p) => {
                let r = sqlx::query(
                    "UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() WHERE user_id = ? AND status IN ('active', 'trial')"
                )
                .bind(user_id.to_string())
                .execute(p)
                .await
                .map_err(|e| format!("Cancel: {}", e))?;
                Ok(r.rows_affected() > 0)
            }
        }
    }

    /// Record a payment
    pub async fn record_payment(
        pool: &DbPool,
        subscription_id: Uuid,
        amount_sar: f64,
        provider: &str,
        provider_reference: Option<&str>,
    ) -> Result<PaymentData, String> {
        let id = Uuid::new_v4();
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO payments (id, subscription_id, amount_sar, provider, provider_reference, status) \
                     VALUES ($1, $2, $3, $4, $5, 'completed')"
                )
                .bind(id)
                .bind(subscription_id)
                .bind(amount_sar)
                .bind(provider)
                .bind(provider_reference)
                .execute(p)
                .await
                .map_err(|e| format!("Payment: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO payments (id, subscription_id, amount_sar, provider, provider_reference, status) \
                     VALUES (?, ?, ?, ?, ?, 'completed')"
                )
                .bind(id.to_string())
                .bind(subscription_id.to_string())
                .bind(amount_sar)
                .bind(provider)
                .bind(provider_reference)
                .execute(p)
                .await
                .map_err(|e| format!("Payment: {}", e))?;
            }
        }

        Ok(PaymentData {
            id,
            subscription_id,
            amount_sar,
            provider: provider.to_string(),
            status: "completed".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}

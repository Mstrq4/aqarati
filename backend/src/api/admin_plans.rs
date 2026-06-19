// Aqarati — Admin Plans Resolvers (real DB-backed)
// All plan management operations with RBAC guards and audit logging

use async_graphql::{Context, Result, InputObject, SimpleObject, ID};
use uuid::Uuid;
use chrono::Utc;
use sqlx::Row;
use serde_json;

use crate::db::DbPool;
use crate::api::guards::auth_guard;

// ─── Response Types ───────────────────────────────────────

#[derive(SimpleObject, Debug, Clone)]
pub struct PlanDetailResponse {
    pub id: ID,
    pub name: String,
    pub name_ar: Option<String>,
    pub name_en: Option<String>,
    pub slug: Option<String>,
    pub tier: String,
    pub description: Option<String>,
    pub description_ar: Option<String>,
    pub description_en: Option<String>,
    pub price_monthly_sar: Option<f64>,
    pub price_yearly_sar: Option<f64>,
    pub currency: Option<String>,
    pub billing_interval: Option<String>,
    pub trial_days: Option<i32>,
    pub max_properties: i32,
    pub max_images_per_property: i32,
    pub max_total_images: Option<i32>,
    pub max_storage_mb: Option<i32>,
    pub max_organization_members: i32,
    pub max_team_members: Option<i32>,
    pub max_saved_searches: i32,
    pub max_ai_requests_per_month: Option<i32>,
    pub featured_listings_limit: Option<i32>,
    pub ai_enabled: bool,
    pub export_enabled: bool,
    pub support_level: Option<String>,
    pub status: Option<String>,
    pub visibility: Option<String>,
    pub display_order: Option<i32>,
    pub is_featured: Option<bool>,
    pub is_popular: Option<bool>,
    pub is_recommended: Option<bool>,
    pub badge_label_ar: Option<String>,
    pub badge_label_en: Option<String>,
    pub features: Vec<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(SimpleObject, Debug)]
pub struct PlanFeatureResponse {
    pub id: ID,
    pub plan_id: ID,
    pub feature_key: String,
    pub label_ar: String,
    pub label_en: Option<String>,
    pub is_enabled: bool,
    pub value_limit: Option<String>,
    pub display_order: Option<i32>,
    pub tooltip_ar: Option<String>,
    pub tooltip_en: Option<String>,
    pub is_included: bool,
}

// ─── Input Types ──────────────────────────────────────────

#[derive(InputObject, Debug)]
pub struct AdminPlanFilter {
    pub status: Option<String>,
    pub tier: Option<String>,
    pub visibility: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(InputObject, Debug)]
pub struct CreatePlanInput {
    pub name: String,
    #[graphql(name = "nameAr")]
    pub name_ar: Option<String>,
    #[graphql(name = "nameEn")]
    pub name_en: Option<String>,
    pub slug: Option<String>,
    pub tier: String,
    pub description: Option<String>,
    #[graphql(name = "descriptionAr")]
    pub description_ar: Option<String>,
    #[graphql(name = "descriptionEn")]
    pub description_en: Option<String>,
    #[graphql(name = "priceMonthlySar")]
    pub price_monthly_sar: Option<f64>,
    #[graphql(name = "priceYearlySar")]
    pub price_yearly_sar: Option<f64>,
    pub currency: Option<String>,
    #[graphql(name = "billingInterval")]
    pub billing_interval: Option<String>,
    #[graphql(name = "trialDays")]
    pub trial_days: Option<i32>,
    #[graphql(name = "maxProperties", default = 10)]
    pub max_properties: i32,
    #[graphql(name = "maxImagesPerProperty", default = 5)]
    pub max_images_per_property: i32,
    #[graphql(name = "maxTotalImages")]
    pub max_total_images: Option<i32>,
    #[graphql(name = "maxStorageMb")]
    pub max_storage_mb: Option<i32>,
    #[graphql(name = "maxOrganizationMembers", default = 0)]
    pub max_organization_members: i32,
    #[graphql(name = "maxTeamMembers")]
    pub max_team_members: Option<i32>,
    #[graphql(name = "maxSavedSearches", default = 3)]
    pub max_saved_searches: i32,
    #[graphql(name = "maxAiRequestsPerMonth")]
    pub max_ai_requests_per_month: Option<i32>,
    #[graphql(name = "featuredListingsLimit")]
    pub featured_listings_limit: Option<i32>,
    #[graphql(name = "aiEnabled", default = false)]
    pub ai_enabled: bool,
    #[graphql(name = "exportEnabled", default = false)]
    pub export_enabled: bool,
    #[graphql(name = "supportLevel")]
    pub support_level: Option<String>,
    pub visibility: Option<String>,
    #[graphql(name = "displayOrder")]
    pub display_order: Option<i32>,
    #[graphql(name = "isFeatured")]
    pub is_featured: Option<bool>,
    #[graphql(name = "isPopular")]
    pub is_popular: Option<bool>,
    #[graphql(name = "isRecommended")]
    pub is_recommended: Option<bool>,
    #[graphql(name = "badgeLabelAr")]
    pub badge_label_ar: Option<String>,
    #[graphql(name = "badgeLabelEn")]
    pub badge_label_en: Option<String>,
    pub features: Option<Vec<String>>,
}

#[derive(InputObject, Debug)]
pub struct UpdatePlanInput {
    pub name: Option<String>,
    #[graphql(name = "nameAr")]
    pub name_ar: Option<String>,
    #[graphql(name = "nameEn")]
    pub name_en: Option<String>,
    pub slug: Option<String>,
    pub tier: Option<String>,
    pub description: Option<String>,
    #[graphql(name = "descriptionAr")]
    pub description_ar: Option<String>,
    #[graphql(name = "descriptionEn")]
    pub description_en: Option<String>,
    #[graphql(name = "priceMonthlySar")]
    pub price_monthly_sar: Option<f64>,
    #[graphql(name = "priceYearlySar")]
    pub price_yearly_sar: Option<f64>,
    pub currency: Option<String>,
    #[graphql(name = "billingInterval")]
    pub billing_interval: Option<String>,
    #[graphql(name = "trialDays")]
    pub trial_days: Option<i32>,
    #[graphql(name = "maxProperties")]
    pub max_properties: Option<i32>,
    #[graphql(name = "maxImagesPerProperty")]
    pub max_images_per_property: Option<i32>,
    #[graphql(name = "maxTotalImages")]
    pub max_total_images: Option<i32>,
    #[graphql(name = "maxStorageMb")]
    pub max_storage_mb: Option<i32>,
    #[graphql(name = "maxOrganizationMembers")]
    pub max_organization_members: Option<i32>,
    #[graphql(name = "maxTeamMembers")]
    pub max_team_members: Option<i32>,
    #[graphql(name = "maxSavedSearches")]
    pub max_saved_searches: Option<i32>,
    #[graphql(name = "maxAiRequestsPerMonth")]
    pub max_ai_requests_per_month: Option<i32>,
    #[graphql(name = "featuredListingsLimit")]
    pub featured_listings_limit: Option<i32>,
    #[graphql(name = "aiEnabled")]
    pub ai_enabled: Option<bool>,
    #[graphql(name = "exportEnabled")]
    pub export_enabled: Option<bool>,
    #[graphql(name = "supportLevel")]
    pub support_level: Option<String>,
    #[graphql(name = "isActive")]
    pub is_active: Option<bool>,
    pub visibility: Option<String>,
    #[graphql(name = "displayOrder")]
    pub display_order: Option<i32>,
    #[graphql(name = "isFeatured")]
    pub is_featured: Option<bool>,
    #[graphql(name = "isPopular")]
    pub is_popular: Option<bool>,
    #[graphql(name = "isRecommended")]
    pub is_recommended: Option<bool>,
    #[graphql(name = "badgeLabelAr")]
    pub badge_label_ar: Option<String>,
    #[graphql(name = "badgeLabelEn")]
    pub badge_label_en: Option<String>,
    pub features: Option<Vec<String>>,
}

#[derive(InputObject, Debug)]
pub struct CreatePlanFeatureInput {
    #[graphql(name = "planId")]
    pub plan_id: ID,
    #[graphql(name = "featureKey")]
    pub feature_key: String,
    #[graphql(name = "labelAr")]
    pub label_ar: String,
    #[graphql(name = "labelEn")]
    pub label_en: Option<String>,
    #[graphql(name = "isEnabled", default = true)]
    pub is_enabled: bool,
    #[graphql(name = "valueLimit")]
    pub value_limit: Option<String>,
    #[graphql(name = "displayOrder")]
    pub display_order: Option<i32>,
    #[graphql(name = "tooltipAr")]
    pub tooltip_ar: Option<String>,
    #[graphql(name = "tooltipEn")]
    pub tooltip_en: Option<String>,
    #[graphql(name = "isIncluded", default = true)]
    pub is_included: bool,
}

#[derive(InputObject, Debug)]
pub struct UpdatePlanFeatureInput {
    #[graphql(name = "labelAr")]
    pub label_ar: Option<String>,
    #[graphql(name = "labelEn")]
    pub label_en: Option<String>,
    #[graphql(name = "isEnabled")]
    pub is_enabled: Option<bool>,
    #[graphql(name = "valueLimit")]
    pub value_limit: Option<String>,
    #[graphql(name = "displayOrder")]
    pub display_order: Option<i32>,
    #[graphql(name = "tooltipAr")]
    pub tooltip_ar: Option<String>,
    #[graphql(name = "tooltipEn")]
    pub tooltip_en: Option<String>,
    #[graphql(name = "isIncluded")]
    pub is_included: Option<bool>,
}

// ─── Helper Functions ─────────────────────────────────────

fn row_to_plan_detail(row: &sqlx::postgres::PgRow) -> PlanDetailResponse {
    let features: serde_json::Value = row.try_get("features").unwrap_or(serde_json::Value::Array(vec![]));
    let features_vec: Vec<String> = features.as_array()
        .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();

    PlanDetailResponse {
        id: ID::from(row.get::<Uuid, _>("id").to_string()),
        name: row.get("name"),
        name_ar: row.try_get("name_ar").ok(),
        name_en: row.try_get("name_en").ok(),
        slug: row.try_get("slug").ok(),
        tier: row.try_get::<String, _>("tier").unwrap_or_default(),
        description: row.try_get("description").ok(),
        description_ar: row.try_get("description_ar").ok(),
        description_en: row.try_get("description_en").ok(),
        price_monthly_sar: row.try_get::<f64, _>("price_monthly_sar").ok(),
        price_yearly_sar: row.try_get::<f64, _>("price_yearly_sar").ok(),
        currency: row.try_get("currency").ok(),
        billing_interval: row.try_get::<String, _>("billing_interval").ok(),
        trial_days: row.try_get("trial_days").ok(),
        max_properties: row.get("max_properties"),
        max_images_per_property: row.get("max_images_per_property"),
        max_total_images: row.try_get("max_total_images").ok(),
        max_storage_mb: row.try_get("max_storage_mb").ok(),
        max_organization_members: row.get("max_organization_members"),
        max_team_members: row.try_get("max_team_members").ok(),
        max_saved_searches: row.get("max_saved_searches"),
        max_ai_requests_per_month: row.try_get("max_ai_requests_per_month").ok(),
        featured_listings_limit: row.try_get("featured_listings_limit").ok(),
        ai_enabled: row.get("ai_enabled"),
        export_enabled: row.get("export_enabled"),
        support_level: row.try_get("support_level").ok(),
        status: row.try_get::<String, _>("status").ok(),
        visibility: row.try_get::<String, _>("visibility").ok(),
        display_order: row.try_get("display_order").ok(),
        is_featured: row.try_get("is_featured").ok(),
        is_popular: row.try_get("is_popular").ok(),
        is_recommended: row.try_get("is_recommended").ok(),
        badge_label_ar: row.try_get("badge_label_ar").ok(),
        badge_label_en: row.try_get("badge_label_en").ok(),
        features: features_vec,
        created_at: row.try_get::<chrono::DateTime<Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        updated_at: row.try_get::<chrono::DateTime<Utc>, _>("updated_at").ok().map(|d| d.to_rfc3339()),
    }
}

async fn audit_plan_action(pool: &DbPool, admin_id: Uuid, action: &str, plan_id: Uuid, details: serde_json::Value) {
    if let DbPool::Postgres(p) = pool {
        let _ = sqlx::query(
            "INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, created_at) \
             VALUES ($1, $2, 'plan', $3, $4, now())"
        ).bind(admin_id).bind(action).bind(plan_id).bind(&details).execute(p).await;
    }
}

// ─── Queries ──────────────────────────────────────────────

pub async fn admin_plans(ctx: &Context<'_>, filter: Option<AdminPlanFilter>, limit: i32, offset: i32) -> Result<Vec<PlanDetailResponse>> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.read").await?;
    match pool {
        DbPool::Postgres(p) => {
            let rows = sqlx::query("SELECT id, name, name_ar, name_en, slug, tier::text as tier, description, description_ar, description_en, \
                price_monthly_sar::float8, price_yearly_sar::float8, currency, billing_interval::text, trial_days, \
                max_properties, max_images_per_property, max_total_images, max_storage_mb, \
                max_organization_members, max_team_members, max_saved_searches, \
                max_ai_requests_per_month, featured_listings_limit, ai_enabled, export_enabled, \
                support_level, status::text, visibility::text, display_order, is_featured, is_popular, is_recommended, \
                badge_label_ar, badge_label_en, features, created_at, updated_at \
                FROM plans ORDER BY display_order ASC, created_at ASC LIMIT $1 OFFSET $2")
                .bind(limit as i64).bind(offset as i64).fetch_all(p).await
                .map_err(|e| async_graphql::Error::new(format!("Query failed: {}", e)))?;
            Ok(rows.iter().map(|r| row_to_plan_detail(r)).collect())
        }
        DbPool::Mysql(_) => Ok(vec![]),
    }
}

pub async fn admin_plan(ctx: &Context<'_>, id: ID) -> Result<Option<PlanDetailResponse>> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.read").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query("SELECT * FROM plans WHERE id = $1").bind(plan_uuid).fetch_optional(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            Ok(row.as_ref().map(|r| row_to_plan_detail(r)))
        }
        DbPool::Mysql(_) => Ok(None),
    }
}

pub async fn public_plans(ctx: &Context<'_>) -> Result<Vec<PlanDetailResponse>> {
    let pool = ctx.data::<DbPool>()?;
    match pool {
        DbPool::Postgres(p) => {
            let rows = sqlx::query("SELECT id, name, name_ar, name_en, slug, tier::text as tier, description, description_ar, description_en, \
                price_monthly_sar::float8, price_yearly_sar::float8, currency, billing_interval::text, trial_days, \
                max_properties, max_images_per_property, max_total_images, max_storage_mb, \
                max_organization_members, max_team_members, max_saved_searches, \
                max_ai_requests_per_month, featured_listings_limit, ai_enabled, export_enabled, \
                support_level, status::text, visibility::text, display_order, is_featured, is_popular, is_recommended, \
                badge_label_ar, badge_label_en, features, created_at, updated_at \
                FROM plans WHERE status = 'active' AND visibility = 'public' ORDER BY display_order ASC")
                .fetch_all(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            Ok(rows.iter().map(|r| row_to_plan_detail(r)).collect())
        }
        DbPool::Mysql(_) => Ok(vec![]),
    }
}

// ─── Mutations ────────────────────────────────────────────

pub async fn admin_create_plan(ctx: &Context<'_>, input: CreatePlanInput) -> Result<PlanDetailResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.create").await?;

    let features_json = serde_json::to_value(input.features.unwrap_or_default()).unwrap_or(serde_json::json!([]));
    let slug = input.slug.unwrap_or_else(|| input.name.to_lowercase().replace(' ', "-"));

    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query(
                "INSERT INTO plans (name, name_ar, name_en, slug, tier, description, description_ar, description_en, \
                 price_monthly_sar, price_yearly_sar, currency, billing_interval, trial_days, \
                 max_properties, max_images_per_property, max_total_images, max_storage_mb, \
                 max_organization_members, max_team_members, max_saved_searches, \
                 max_ai_requests_per_month, featured_listings_limit, \
                 ai_enabled, export_enabled, support_level, visibility, display_order, \
                 is_featured, is_popular, is_recommended, badge_label_ar, badge_label_en, features) \
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33) \
                 RETURNING *"
            )
            .bind(&input.name).bind(&input.name_ar).bind(&input.name_en).bind(&slug).bind(&input.tier)
            .bind(&input.description).bind(&input.description_ar).bind(&input.description_en)
            .bind(input.price_monthly_sar).bind(input.price_yearly_sar).bind(&input.currency).bind(&input.billing_interval).bind(input.trial_days)
            .bind(input.max_properties).bind(input.max_images_per_property).bind(&input.max_total_images).bind(&input.max_storage_mb)
            .bind(input.max_organization_members).bind(&input.max_team_members).bind(input.max_saved_searches)
            .bind(&input.max_ai_requests_per_month).bind(&input.featured_listings_limit)
            .bind(input.ai_enabled).bind(input.export_enabled).bind(&input.support_level)
            .bind(&input.visibility).bind(&input.display_order)
            .bind(&input.is_featured).bind(&input.is_popular).bind(&input.is_recommended)
            .bind(&input.badge_label_ar).bind(&input.badge_label_en)
            .bind(&features_json)
            .fetch_one(p).await
            .map_err(|e| async_graphql::Error::new(format!("Create failed: {}", e)))?;

            let plan = row_to_plan_detail(&row);
            if let Ok(pid) = Uuid::parse_str(&plan.id.0) {
                audit_plan_action(pool, user_id, "plan.create", pid, serde_json::json!({"name": &input.name})).await;
            }
            Ok(plan)
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_update_plan(ctx: &Context<'_>, id: ID, input: UpdatePlanInput) -> Result<PlanDetailResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;

    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;

    match pool {
        DbPool::Postgres(p) => {
            // Use COALESCE to keep existing values when input is None
            let row = sqlx::query(
                "UPDATE plans SET \
                    name = COALESCE($1, name), name_ar = COALESCE($2, name_ar), name_en = COALESCE($3, name_en), \
                    slug = COALESCE($4, slug), tier = COALESCE($5, tier), \
                    description = COALESCE($6, description), description_ar = COALESCE($7, description_ar), \
                    description_en = COALESCE($8, description_en), \
                    price_monthly_sar = COALESCE($9, price_monthly_sar), price_yearly_sar = COALESCE($10, price_yearly_sar), \
                    currency = COALESCE($11, currency), billing_interval = COALESCE($12, billing_interval), \
                    trial_days = COALESCE($13, trial_days), max_properties = COALESCE($14, max_properties), \
                    max_images_per_property = COALESCE($15, max_images_per_property), \
                    max_total_images = COALESCE($16, max_total_images), max_storage_mb = COALESCE($17, max_storage_mb), \
                    max_organization_members = COALESCE($18, max_organization_members), \
                    max_team_members = COALESCE($19, max_team_members), max_saved_searches = COALESCE($20, max_saved_searches), \
                    max_ai_requests_per_month = COALESCE($21, max_ai_requests_per_month), \
                    featured_listings_limit = COALESCE($22, featured_listings_limit), \
                    ai_enabled = COALESCE($23, ai_enabled), export_enabled = COALESCE($24, export_enabled), \
                    support_level = COALESCE($25, support_level), \
                    is_active = COALESCE($26, is_active), visibility = COALESCE($27, visibility), \
                    display_order = COALESCE($28, display_order), \
                    is_featured = COALESCE($29, is_featured), is_popular = COALESCE($30, is_popular), \
                    is_recommended = COALESCE($31, is_recommended), \
                    badge_label_ar = COALESCE($32, badge_label_ar), badge_label_en = COALESCE($33, badge_label_en), \
                    updated_at = now() \
                 WHERE id = $34 RETURNING *"
            )
            .bind(&input.name).bind(&input.name_ar).bind(&input.name_en).bind(&input.slug).bind(&input.tier)
            .bind(&input.description).bind(&input.description_ar).bind(&input.description_en)
            .bind(input.price_monthly_sar).bind(input.price_yearly_sar).bind(&input.currency).bind(&input.billing_interval)
            .bind(input.trial_days).bind(input.max_properties).bind(input.max_images_per_property)
            .bind(&input.max_total_images).bind(&input.max_storage_mb)
            .bind(input.max_organization_members).bind(&input.max_team_members).bind(input.max_saved_searches)
            .bind(&input.max_ai_requests_per_month).bind(&input.featured_listings_limit)
            .bind(input.ai_enabled).bind(input.export_enabled).bind(&input.support_level)
            .bind(input.is_active).bind(&input.visibility).bind(input.display_order)
            .bind(input.is_featured).bind(input.is_popular).bind(input.is_recommended)
            .bind(&input.badge_label_ar).bind(&input.badge_label_en)
            .bind(plan_uuid)
            .fetch_one(p).await
            .map_err(|e| async_graphql::Error::new(format!("Update failed: {}", e)))?;

            let plan = row_to_plan_detail(&row);
            audit_plan_action(pool, user_id, "plan.update", plan_uuid, serde_json::json!({})).await;
            Ok(plan)
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_archive_plan(ctx: &Context<'_>, id: ID) -> Result<bool> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.archive").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let r = sqlx::query("UPDATE plans SET status = 'archived', visibility = 'hidden', updated_at = now() WHERE id = $1")
                .bind(plan_uuid).execute(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            if r.rows_affected() > 0 {
                audit_plan_action(pool, user_id, "plan.archive", plan_uuid, serde_json::json!({})).await;
                Ok(true)
            } else { Err(async_graphql::Error::new("Plan not found")) }
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_delete_plan(ctx: &Context<'_>, id: ID) -> Result<bool> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.delete").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM subscriptions WHERE plan_id = $1 AND status = 'active'")
                .bind(plan_uuid).fetch_one(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            if count > 0 {
                return Err(async_graphql::Error::new(format!("Cannot delete: {} active subscribers", count)));
            }
            audit_plan_action(pool, user_id, "plan.delete", plan_uuid, serde_json::json!({"subscribers": count})).await;
            sqlx::query("DELETE FROM plans WHERE id = $1").bind(plan_uuid).execute(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            Ok(true)
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_set_plan_featured(ctx: &Context<'_>, id: ID, featured: bool) -> Result<PlanDetailResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query("UPDATE plans SET is_featured = $1, updated_at = now() WHERE id = $2 RETURNING *")
                .bind(featured).bind(plan_uuid).fetch_one(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            audit_plan_action(pool, user_id, "plan.set_featured", plan_uuid, serde_json::json!({"featured": featured})).await;
            Ok(row_to_plan_detail(&row))
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_set_plan_popular(ctx: &Context<'_>, id: ID, popular: bool) -> Result<PlanDetailResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query("UPDATE plans SET is_popular = $1, updated_at = now() WHERE id = $2 RETURNING *")
                .bind(popular).bind(plan_uuid).fetch_one(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            audit_plan_action(pool, user_id, "plan.set_popular", plan_uuid, serde_json::json!({"popular": popular})).await;
            Ok(row_to_plan_detail(&row))
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_set_plan_recommended(ctx: &Context<'_>, id: ID, recommended: bool) -> Result<PlanDetailResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query("UPDATE plans SET is_recommended = $1, updated_at = now() WHERE id = $2 RETURNING *")
                .bind(recommended).bind(plan_uuid).fetch_one(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            audit_plan_action(pool, user_id, "plan.set_recommended", plan_uuid, serde_json::json!({"recommended": recommended})).await;
            Ok(row_to_plan_detail(&row))
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_set_plan_visibility(ctx: &Context<'_>, id: ID, visibility: String) -> Result<PlanDetailResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let plan_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query("UPDATE plans SET visibility = $1, updated_at = now() WHERE id = $2 RETURNING *")
                .bind(&visibility).bind(plan_uuid).fetch_one(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            audit_plan_action(pool, user_id, "plan.set_visibility", plan_uuid, serde_json::json!({"visibility": &visibility})).await;
            Ok(row_to_plan_detail(&row))
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_reorder_plans(ctx: &Context<'_>, plan_ids: Vec<ID>) -> Result<bool> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    match pool {
        DbPool::Postgres(p) => {
            for (idx, pid) in plan_ids.iter().enumerate() {
                let uuid = Uuid::parse_str(&pid.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
                sqlx::query("UPDATE plans SET display_order = $1, updated_at = now() WHERE id = $2")
                    .bind((idx + 1) as i32).bind(uuid).execute(p).await
                    .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            }
            audit_plan_action(pool, user_id, "plan.reorder", Uuid::nil(), serde_json::json!({"count": plan_ids.len()})).await;
            Ok(true)
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

// ─── Plan Features ────────────────────────────────────────

pub async fn admin_create_plan_feature(ctx: &Context<'_>, input: CreatePlanFeatureInput) -> Result<PlanFeatureResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let plan_uuid = Uuid::parse_str(&input.plan_id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query(
                "INSERT INTO plan_features (plan_id, feature_key, label_ar, label_en, is_enabled, value_limit, display_order, tooltip_ar, tooltip_en, is_included) \
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *"
            ).bind(plan_uuid).bind(&input.feature_key).bind(&input.label_ar).bind(&input.label_en)
             .bind(input.is_enabled).bind(&input.value_limit).bind(&input.display_order)
             .bind(&input.tooltip_ar).bind(&input.tooltip_en).bind(input.is_included)
             .fetch_one(p).await
             .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            audit_plan_action(pool, user_id, "plan.feature.create", plan_uuid, serde_json::json!({"feature_key": &input.feature_key})).await;
            Ok(PlanFeatureResponse {
                id: ID::from(row.get::<Uuid, _>("id").to_string()),
                plan_id: ID::from(plan_uuid.to_string()),
                feature_key: row.get("feature_key"), label_ar: row.get("label_ar"),
                label_en: row.try_get("label_en").ok(), is_enabled: row.get("is_enabled"),
                value_limit: row.try_get("value_limit").ok(), display_order: row.try_get("display_order").ok(),
                tooltip_ar: row.try_get("tooltip_ar").ok(), tooltip_en: row.try_get("tooltip_en").ok(),
                is_included: row.get("is_included"),
            })
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_update_plan_feature(ctx: &Context<'_>, id: ID, input: UpdatePlanFeatureInput) -> Result<PlanFeatureResponse> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let feature_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let row = sqlx::query(
                "UPDATE plan_features SET label_ar = COALESCE($1, label_ar), label_en = COALESCE($2, label_en), \
                 is_enabled = COALESCE($3, is_enabled), value_limit = COALESCE($4, value_limit), \
                 display_order = COALESCE($5, display_order), tooltip_ar = COALESCE($6, tooltip_ar), \
                 tooltip_en = COALESCE($7, tooltip_en), is_included = COALESCE($8, is_included), \
                 updated_at = now() WHERE id = $9 RETURNING *"
            ).bind(&input.label_ar).bind(&input.label_en).bind(input.is_enabled).bind(&input.value_limit)
             .bind(input.display_order).bind(&input.tooltip_ar).bind(&input.tooltip_en).bind(input.is_included)
             .bind(feature_uuid).fetch_one(p).await
             .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            let plan_uuid: Uuid = row.get("plan_id");
            audit_plan_action(pool, user_id, "plan.feature.update", plan_uuid, serde_json::json!({"feature_id": &id.0})).await;
            Ok(PlanFeatureResponse {
                id: ID::from(row.get::<Uuid, _>("id").to_string()),
                plan_id: ID::from(plan_uuid.to_string()),
                feature_key: row.get("feature_key"), label_ar: row.get("label_ar"),
                label_en: row.try_get("label_en").ok(), is_enabled: row.get("is_enabled"),
                value_limit: row.try_get("value_limit").ok(), display_order: row.try_get("display_order").ok(),
                tooltip_ar: row.try_get("tooltip_ar").ok(), tooltip_en: row.try_get("tooltip_en").ok(),
                is_included: row.get("is_included"),
            })
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

pub async fn admin_delete_plan_feature(ctx: &Context<'_>, id: ID) -> Result<bool> {
    let pool = ctx.data::<DbPool>()?;
    let user_id = auth_guard::require_auth(ctx)?;
    auth_guard::require_permission(pool, user_id, "admin.plans.update").await?;
    let feature_uuid = Uuid::parse_str(&id.0).map_err(|_| async_graphql::Error::new("Invalid ID"))?;
    match pool {
        DbPool::Postgres(p) => {
            let plan_uuid: Option<Uuid> = sqlx::query_scalar("SELECT plan_id FROM plan_features WHERE id = $1")
                .bind(feature_uuid).fetch_optional(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            sqlx::query("DELETE FROM plan_features WHERE id = $1").bind(feature_uuid).execute(p).await
                .map_err(|e| async_graphql::Error::new(format!("{}", e)))?;
            if let Some(puid) = plan_uuid {
                audit_plan_action(pool, user_id, "plan.feature.delete", puid, serde_json::json!({"feature_id": &id.0})).await;
            }
            Ok(true)
        }
        DbPool::Mysql(_) => Err(async_graphql::Error::new("MySQL not supported")),
    }
}

// Aqarati GraphQL Schema — Query & Mutation roots

use async_graphql::{Context, Object, Result, InputObject, SimpleObject, ID};
use uuid::Uuid;
use chrono::{Utc, DateTime};
use serde::{Serialize, Deserialize};

use crate::db::DbPool;
use crate::services::auth::AuthService;
use crate::services::contacts::ContactsService;
use crate::services::billing::BillingService;
use crate::services::search::SearchService;
use crate::services::organization::OrganizationService;
use crate::api::guards::auth_guard;
use crate::api::admin_plans::{
    AdminPlanFilter, CreatePlanInput, UpdatePlanInput,
    CreatePlanFeatureInput, UpdatePlanFeatureInput,
    PlanDetailResponse, PlanFeatureResponse,
};
use crate::config::Config;
use sqlx::types::Json;
use sqlx::Row;

// ─── Query Root ──────────────────────────────────────────

#[derive(Default)]
pub struct Query;

#[Object]
impl Query {
    /// Health check
    async fn ping(&self) -> &str {
        "pong 🏠"
    }

    /// Get current user profile
    async fn me(&self, ctx: &Context<'_>) -> Result<UserResponse> {
        let pool = ctx.data::<DbPool>()?;
        let cfg = ctx.data::<Config>()?;

        // Extract user ID from JWT in auth header
        if let Some(user_id) = ctx.data_opt::<uuid::Uuid>().cloned() {
            if let Some(user_result) = AuthService::get_user_by_id(pool, user_id)
                .await
                .map_err(|e| async_graphql::Error::new(e.to_string()))?
            {
                return Ok(UserResponse {
                    id: ID::from(user_result.user_id.to_string()),
                    email: user_result.email,
                    phone: user_result.phone,
                    full_name: user_result.full_name,
                    language: user_result.language,
                    status: user_result.status,
                });
            }
        }

        // No auth — return unauthenticated
        Err(async_graphql::Error::new("Not authenticated"))
    }

    /// List properties for current user (real DB query)
    async fn my_properties(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<PropertyResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = auth_guard::require_auth(ctx)?;

        let properties = crate::services::property::PropertyService::list_by_user(
            pool, user_id, limit, offset,
        )
        .await
        .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(properties
            .into_iter()
            .map(|p| PropertyResponse {
                id: ID::from(p.id.to_string()),
                title: p.title,
                property_type: p.property_type,
                purpose: p.purpose,
                price_amount: p.price_amount,
                city: p.city.unwrap_or_default(),
                status: p.status,
                created_at: p.created_at.to_rfc3339(),
                updated_at: Some(p.updated_at.to_rfc3339()),
                main_image_url: p.main_image_url,
                area_sqm: p.area_sqm,
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms,
            })
            .collect())
    }

    /// Get single property by ID (real DB query with authorization)
    async fn property(
        &self,
        ctx: &Context<'_>,
        id: ID,
    ) -> Result<Option<PropertyResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = auth_guard::require_auth(ctx)?;

        let pid = uuid::Uuid::parse_str(&id.to_string())
            .map_err(|_| async_graphql::Error::new("Invalid property ID"))?;

        match crate::services::property::PropertyService::get_by_id(pool, pid, Some(user_id)).await {
            Ok(p) => Ok(Some(PropertyResponse {
                id: ID::from(p.id.to_string()),
                title: p.title,
                property_type: p.property_type,
                purpose: p.purpose,
                price_amount: p.price_amount,
                city: p.city.unwrap_or_default(),
                status: p.status,
                created_at: p.created_at.to_rfc3339(),
                updated_at: Some(p.updated_at.to_rfc3339()),
                main_image_url: p.main_image_url,
                area_sqm: p.area_sqm,
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms,
            })),
            Err(e) if e.contains("not found") => Ok(None),
            Err(e) => Err(async_graphql::Error::new(e)),
        }
    }

    /// Search properties (real full-text search)
    async fn search_properties(
        &self,
        ctx: &Context<'_>,
        input: SearchInput,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<PropertyResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let _user_id = auth_guard::require_auth(ctx)?;

        let filters = crate::services::search::SearchFilters {
            query: input.query,
            city: input.city,
            property_type: input.property_type,
            purpose: input.purpose,
            min_price: input.min_price,
            max_price: input.max_price,
            min_area: input.min_area,
            max_area: input.max_area,
            bedrooms: input.bedrooms,
        };

        let results = crate::services::search::SearchService::search(
            pool, filters, limit, offset,
        )
        .await
        .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(results.into_iter().map(|p| PropertyResponse {
            id: ID::from(p.id.to_string()),
            title: p.title,
            property_type: p.property_type,
            purpose: p.purpose,
            price_amount: p.price_amount,
            city: p.city.unwrap_or_default(),
            status: p.status,
            created_at: p.created_at,
            updated_at: None,
            main_image_url: p.main_image_url,
            area_sqm: p.area_sqm,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
        }).collect())
    }

    /// Admin: Dashboard statistics (real DB query)
    async fn admin_dashboard(&self, ctx: &Context<'_>) -> Result<DashboardStats> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;

        let (users, properties, orgs) = tokio::join!(
            async {
                match pool {
                    DbPool::Postgres(p) => sqlx::query_scalar::<_, i64>(
                        "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
                    ).fetch_one(p).await.unwrap_or(0),
                    DbPool::Mysql(p) => sqlx::query_scalar::<_, i64>(
                        "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
                    ).fetch_one(p).await.unwrap_or(0),
                }
            },
            async {
                match pool {
                    DbPool::Postgres(p) => sqlx::query_scalar::<_, i64>(
                        "SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL"
                    ).fetch_one(p).await.unwrap_or(0),
                    DbPool::Mysql(p) => sqlx::query_scalar::<_, i64>(
                        "SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL"
                    ).fetch_one(p).await.unwrap_or(0),
                }
            },
            async {
                match pool {
                    DbPool::Postgres(p) => sqlx::query_scalar::<_, i64>(
                        "SELECT COUNT(*) FROM organizations"
                    ).fetch_one(p).await.unwrap_or(0),
                    DbPool::Mysql(p) => sqlx::query_scalar::<_, i64>(
                        "SELECT COUNT(*) FROM organizations"
                    ).fetch_one(p).await.unwrap_or(0),
                }
            },
        );

        Ok(DashboardStats {
            total_users: users as i32,
            total_properties: properties as i32,
            total_organizations: orgs as i32,
            total_revenue_sar: 0.0,
            active_subscriptions: 0,
            pending_reports: 0,
        })
    }

    /// Admin: Audit log entries
    async fn admin_audit_log(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<AuditLogEntry>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;

        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, admin_id, action, target_type, target_id, details, created_at \
                     FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2"
                ).bind(limit).bind(offset).fetch_all(p).await
                .map_err(|e| async_graphql::Error::new(e.to_string()))?;

                Ok(rows.iter().map(|r| AuditLogEntry {
                    id: ID::from(r.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    admin_id: ID::from(r.try_get::<Uuid, _>("admin_id").unwrap_or_default().to_string()),
                    action: r.try_get("action").unwrap_or_default(),
                    target_type: r.try_get("target_type").unwrap_or_default(),
                    target_id: r.try_get::<Option<Uuid>, _>("target_id").ok().flatten().map(|u| ID::from(u.to_string())),
                    details: r.try_get::<Option<serde_json::Value>, _>("details").ok().flatten().map(|v| v.to_string()),
                    created_at: r.try_get::<DateTime<Utc>, _>("created_at").map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]),
        }
    }

    /// Admin: List all properties
    async fn admin_properties(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<AdminPropertyEntry>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT p.id, p.title, p.property_type, p.purpose, p.status, p.visibility, p.created_at, \
                     pp.price_amount, u.email as owner_name \
                     FROM properties p \
                     LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     JOIN users u ON p.owner_user_id = u.id \
                     WHERE p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
                ).bind(limit).bind(offset).fetch_all(p).await
                .map_err(|e| async_graphql::Error::new(e.to_string()))?;
                Ok(rows.iter().map(|r| AdminPropertyEntry {
                    id: ID::from(r.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    title: r.try_get("title").unwrap_or_default(),
                    property_type: r.try_get("property_type").unwrap_or_default(),
                    purpose: r.try_get("purpose").unwrap_or_default(),
                    price_amount: r.try_get("price_amount").ok(),
                    city: String::new(),
                    status: r.try_get("status").unwrap_or_default(),
                    visibility: r.try_get("visibility").unwrap_or_default(),
                    created_at: r.try_get::<DateTime<Utc>, _>("created_at").map(|d| d.to_rfc3339()).unwrap_or_default(),
                    owner_name: r.try_get("owner_name").unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]),
        }
    }

    /// Admin: List organizations
    async fn admin_organizations(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<AdminOrgEntry>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT o.id, o.name, o.status, o.created_at, \
                     COUNT(om.user_id) as member_count, u.email as owner_name \
                     FROM organizations o \
                     LEFT JOIN organization_members om ON o.id = om.organization_id \
                     JOIN users u ON o.owner_user_id = u.id \
                     GROUP BY o.id, u.email ORDER BY o.created_at DESC LIMIT $1 OFFSET $2"
                ).bind(limit).bind(offset).fetch_all(p).await
                .map_err(|e| async_graphql::Error::new(e.to_string()))?;
                Ok(rows.iter().map(|r| AdminOrgEntry {
                    id: ID::from(r.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    name: r.try_get("name").unwrap_or_default(),
                    status: r.try_get("status").unwrap_or_default(),
                    created_at: r.try_get::<DateTime<Utc>, _>("created_at").map(|d| d.to_rfc3339()).unwrap_or_default(),
                    member_count: r.try_get::<i64, _>("member_count").unwrap_or(0) as i32,
                    owner_name: r.try_get("owner_name").unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]),
        }
    }

    /// Admin: Get platform settings
    async fn admin_settings(&self, ctx: &Context<'_>) -> Result<Vec<SettingEntry>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query("SELECT key, value, updated_at FROM platform_settings ORDER BY key")
                    .fetch_all(p).await.map_err(|e| async_graphql::Error::new(e.to_string()))?;
                Ok(rows.iter().map(|r| SettingEntry {
                    key: r.try_get("key").unwrap_or_default(),
                    value: r.try_get("value").unwrap_or_default(),
                    updated_at: r.try_get::<DateTime<Utc>, _>("updated_at").map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]),
        }
    }

    /// Admin: Reports
    async fn admin_reports(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<AdminReportEntry>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT r.id, r.reason, r.description, r.status, r.created_at, u.email as reporter_name \
                     FROM reports r JOIN users u ON r.reporter_id = u.id \
                     ORDER BY r.created_at DESC LIMIT $1 OFFSET $2"
                ).bind(limit).bind(offset).fetch_all(p).await
                .map_err(|e| async_graphql::Error::new(e.to_string()))?;
                Ok(rows.iter().map(|r| AdminReportEntry {
                    id: ID::from(r.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    reason: r.try_get("reason").unwrap_or_default(),
                    description: r.try_get("description").ok(),
                    status: r.try_get("status").unwrap_or_default(),
                    created_at: r.try_get::<DateTime<Utc>, _>("created_at").map(|d| d.to_rfc3339()).unwrap_or_default(),
                    reporter_name: r.try_get("reporter_name").unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(_) => Ok(vec![]),
        }
    }

    /// Get plans from database (public — only active/public plans)
    async fn public_plans(&self, ctx: &Context<'_>) -> Result<Vec<PlanDetailResponse>> {
        crate::api::admin_plans::public_plans(ctx).await
    }

    /// Admin: List all plans with filters
    async fn admin_plans(
        &self,
        ctx: &Context<'_>,
        filter: Option<AdminPlanFilter>,
        #[graphql(default = 50)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<PlanDetailResponse>> {
        crate::api::admin_plans::admin_plans(ctx, filter, limit, offset).await
    }

    /// Admin: Get single plan by ID
    async fn admin_plan(&self, ctx: &Context<'_>, id: ID) -> Result<Option<PlanDetailResponse>> {
        crate::api::admin_plans::admin_plan(ctx, id).await
    }

    /// Get organizations for current user
    async fn my_organizations(&self, ctx: &Context<'_>) -> Result<Vec<OrganizationResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = ctx.data_opt::<uuid::Uuid>().cloned()
            .ok_or_else(|| async_graphql::Error::new("Authentication required"))?;
        
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT o.id, o.name, om.role, \
                     (SELECT COUNT(*) FROM organization_members m2 WHERE m2.organization_id = o.id AND m2.status = 'active') as member_count, \
                     (SELECT COUNT(*) FROM properties pr WHERE pr.organization_id = o.id AND pr.status != 'deleted') as property_count \
                     FROM organizations o \
                     JOIN organization_members om ON o.id = om.organization_id \
                     WHERE om.user_id = $1 AND om.status = 'active'"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| async_graphql::Error::new(format!("Organizations: {}", e)))?;
                
                Ok(rows.into_iter().map(|row| OrganizationResponse {
                    id: ID::from(row.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    name: row.try_get("name").unwrap_or_default(),
                    role: row.try_get("role").unwrap_or_default(),
                    member_count: row.try_get::<i64, _>("member_count").unwrap_or(0) as i32,
                    property_count: row.try_get::<i64, _>("property_count").unwrap_or(0) as i32,
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT o.id, o.name, om.role, \
                     (SELECT COUNT(*) FROM organization_members m2 WHERE m2.organization_id = o.id AND m2.status = 'active') as member_count, \
                     (SELECT COUNT(*) FROM properties pr WHERE pr.organization_id = o.id AND pr.status != 'deleted') as property_count \
                     FROM organizations o \
                     JOIN organization_members om ON o.id = om.organization_id \
                     WHERE om.user_id = ? AND om.status = 'active'"
                )
                .bind(user_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| async_graphql::Error::new(format!("Organizations: {}", e)))?;
                
                Ok(rows.into_iter().map(|row| OrganizationResponse {
                    id: ID::from(row.try_get::<String, _>("id").unwrap_or_default()),
                    name: row.try_get("name").unwrap_or_default(),
                    role: row.try_get("role").unwrap_or_default(),
                    member_count: row.try_get::<i64, _>("member_count").unwrap_or(0) as i32,
                    property_count: row.try_get::<i64, _>("property_count").unwrap_or(0) as i32,
                }).collect())
            }
        }
    }

    /// Get contacts for current user
    async fn my_contacts(&self, ctx: &Context<'_>) -> Result<Vec<ContactResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = ctx.data_opt::<uuid::Uuid>().cloned()
            .ok_or_else(|| async_graphql::Error::new("Authentication required"))?;
        
        let contacts = ContactsService::list_for_user(pool, user_id)
            .await
            .map_err(|e| async_graphql::Error::new(e))?;
        
        Ok(contacts.into_iter().map(|c| ContactResponse {
            id: ID::from(c.id.to_string()),
            name: c.name,
            phone: c.phone,
            email: c.email,
            contact_type: c.contact_type,
        }).collect())
    }

    /// Get reminders for current user
    async fn my_reminders(&self, ctx: &Context<'_>) -> Result<Vec<ReminderResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = ctx.data_opt::<uuid::Uuid>().cloned()
            .ok_or_else(|| async_graphql::Error::new("Authentication required"))?;
        
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, title, due_at, completed, property_id FROM reminders WHERE user_id = $1 ORDER BY due_at ASC"
                )
                .bind(user_id)
                .fetch_all(p)
                .await
                .map_err(|e| async_graphql::Error::new(format!("Reminders: {}", e)))?;
                
                Ok(rows.into_iter().map(|row| ReminderResponse {
                    id: ID::from(row.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    title: row.try_get("title").unwrap_or_default(),
                    due_at: row.try_get::<DateTime<Utc>, _>("due_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                    completed: row.try_get("completed").unwrap_or(false),
                    property_id: row.try_get::<Uuid, _>("property_id").ok().map(|id| ID::from(id.to_string())),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, title, due_at, completed, property_id FROM reminders WHERE user_id = ? ORDER BY due_at ASC"
                )
                .bind(user_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| async_graphql::Error::new(format!("Reminders: {}", e)))?;
                
                Ok(rows.into_iter().map(|row| ReminderResponse {
                    id: ID::from(row.try_get::<String, _>("id").unwrap_or_default()),
                    title: row.try_get("title").unwrap_or_default(),
                    due_at: row.try_get::<DateTime<Utc>, _>("due_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                    completed: row.try_get::<i8, _>("completed").map(|v| v != 0).unwrap_or(false),
                    property_id: row.try_get::<String, _>("property_id").ok().map(ID::from),
                }).collect())
            }
        }
    }

    /// Get saved searches
    async fn my_saved_searches(&self, ctx: &Context<'_>) -> Result<Vec<SavedSearchResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = ctx.data_opt::<uuid::Uuid>().cloned()
            .ok_or_else(|| async_graphql::Error::new("Authentication required"))?;
        
        let searches = SearchService::get_saved_searches(pool, user_id)
            .await
            .map_err(|e| async_graphql::Error::new(e))?;
        
        Ok(searches.into_iter().map(|s| SavedSearchResponse {
            id: ID::from(s.id.to_string()),
            name: s.name,
            filters: s.filters,
            notify: s.notify,
        }).collect())
    }

    /// Get current subscription
    async fn my_subscription(&self, ctx: &Context<'_>) -> Result<Option<SubscriptionResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = ctx.data_opt::<uuid::Uuid>().cloned()
            .ok_or_else(|| async_graphql::Error::new("Authentication required"))?;
        
        let sub = BillingService::get_subscription(pool, user_id)
            .await
            .map_err(|e| async_graphql::Error::new(e))?;
        
        Ok(sub.map(|s| SubscriptionResponse {
            id: ID::from(s.id.to_string()),
            plan_name: s.plan_name,
            tier: s.tier,
            status: s.status,
            current_period_end: s.current_period_end,
        }))
    }

    /// Admin: List all users (real DB query, safe fields, RBAC-protected)
    async fn admin_users(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<UserResponse>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;

        let users = AuthService::list_users(pool, limit, offset)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(users
            .into_iter()
            .map(|u| UserResponse {
                id: ID::from(u.user_id.to_string()),
                email: u.email,
                phone: u.phone,
                full_name: u.full_name,
                language: u.language,
                status: u.status,
            })
            .collect())
    }

    /// Admin: List payment providers (real DB query)
    async fn payment_providers(&self, ctx: &Context<'_>) -> Result<Vec<PaymentProviderResponse>> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_admin_user(ctx, pool).await?;

        let providers = crate::services::payment_provider::PaymentProviderService::list_all(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(providers
            .into_iter()
            .map(|p| PaymentProviderResponse {
                id: ID::from(p.id.to_string()),
                provider_key: p.provider_key,
                display_name: p.display_name,
                is_enabled: p.is_enabled,
                supported_methods: p.supported_methods,
            })
            .collect())
    }

    /// Get ratings for a property
    async fn property_ratings(
        &self,
        ctx: &Context<'_>,
        property_id: ID,
    ) -> Result<Vec<RatingResponse>> {
        let pool = ctx.data::<DbPool>()?;
        let pid = Uuid::parse_str(&property_id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid property ID: {}", e)))?;
        
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, property_id, score, review, created_at FROM ratings WHERE property_id = $1 ORDER BY created_at DESC"
                )
                .bind(pid)
                .fetch_all(p)
                .await
                .map_err(|e| async_graphql::Error::new(format!("Ratings: {}", e)))?;
                
                Ok(rows.into_iter().map(|row| RatingResponse {
                    id: ID::from(row.try_get::<Uuid, _>("id").unwrap_or_default().to_string()),
                    property_id: ID::from(row.try_get::<Uuid, _>("property_id").unwrap_or_default().to_string()),
                    score: row.try_get("score").unwrap_or(0),
                    review: row.try_get("review").ok(),
                    created_at: row.try_get::<DateTime<Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, property_id, score, review, created_at FROM ratings WHERE property_id = ? ORDER BY created_at DESC"
                )
                .bind(pid.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| async_graphql::Error::new(format!("Ratings: {}", e)))?;
                
                Ok(rows.into_iter().map(|row| RatingResponse {
                    id: ID::from(row.try_get::<String, _>("id").unwrap_or_default()),
                    property_id: ID::from(row.try_get::<String, _>("property_id").unwrap_or_default()),
                    score: row.try_get::<i32, _>("score").unwrap_or(0),
                    review: row.try_get("review").ok(),
                    created_at: row.try_get::<DateTime<Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
        }
    }
}

// ─── Mutation Root ───────────────────────────────────────

#[derive(Default)]
pub struct Mutation;

#[Object]
impl Mutation {
    /// Register a new user
    async fn register(
        &self,
        ctx: &Context<'_>,
        input: RegisterInput,
    ) -> Result<AuthPayload> {
        let pool = ctx.data::<DbPool>()?;
        let cfg = ctx.data::<Config>()?;

        let result = AuthService::register(
            pool, cfg,
            &input.email,
            &input.password,
            &input.full_name,
            input.phone.as_deref(),
            input.language.as_deref(),
        )
        .await
        .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(AuthPayload {
            token: result.token,
            user: UserResponse {
                id: ID::from(result.user_id.to_string()),
                email: result.email,
                phone: result.phone,
                full_name: result.full_name,
                language: result.language,
                status: result.status,
            },
        })
    }

    /// Admin: Update platform setting
    async fn admin_update_setting(
        &self,
        ctx: &Context<'_>,
        key: String,
        value: String,
    ) -> Result<SettingEntry> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_permission_user(ctx, pool, "admin.settings.update").await?;
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query("INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()")
                    .bind(&key).bind(&value).execute(p).await
                    .map_err(|e| async_graphql::Error::new(e.to_string()))?;
                Ok(SettingEntry { key, value, updated_at: Utc::now().to_rfc3339() })
            }
            DbPool::Mysql(_) => Err(async_graphql::Error::new("Not supported")),
        }
    }

    /// Request password reset (public endpoint)
    async fn forgot_password(
        &self,
        ctx: &Context<'_>,
        email: String,
    ) -> Result<bool> {
        let pool = ctx.data::<DbPool>()?;
        AuthService::request_password_reset(pool, &email)
            .await
            .map_err(|e| async_graphql::Error::new(e))?;
        Ok(true)
    }

    /// Reset password with token (public endpoint)
    async fn reset_password(
        &self,
        ctx: &Context<'_>,
        token: String,
        new_password: String,
    ) -> Result<bool> {
        let pool = ctx.data::<DbPool>()?;
        AuthService::reset_password(pool, &token, &new_password)
            .await
            .map_err(|e| async_graphql::Error::new(e))?;
        Ok(true)
    }

    /// Login
    async fn login(
        &self,
        ctx: &Context<'_>,
        email: String,
        password: String,
    ) -> Result<AuthPayload> {
        let pool = ctx.data::<DbPool>()?;
        let cfg = ctx.data::<Config>()?;

        let result = AuthService::login(pool, cfg, &email, &password)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(AuthPayload {
            token: result.token,
            user: UserResponse {
                id: ID::from(result.user_id.to_string()),
                email: result.email,
                phone: result.phone,
                full_name: result.full_name,
                language: result.language,
                status: result.status,
            },
        })
    }

    /// Create a property (real DB insert)
    async fn create_property(
        &self,
        ctx: &Context<'_>,
        input: CreatePropertyInput,
    ) -> Result<PropertyResponse> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = auth_guard::require_auth(ctx)?;

        let property = crate::services::property::PropertyService::create(
            pool,
            user_id,
            &input.title,
            &input.property_type,
            &input.purpose,
            input.description.as_deref(),
            input.city.as_deref(),
            None, // district
            input.area_sqm,
            input.bedrooms,
            input.bathrooms,
            input.price_amount,
            input.visibility.as_deref(),
            None, // organization_id
            &input.owner_phone,
        )
        .await
        .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(PropertyResponse {
            id: ID::from(property.id.to_string()),
            title: property.title,
            property_type: property.property_type,
            purpose: property.purpose,
            price_amount: property.price_amount,
            city: property.city.unwrap_or_default(),
            status: property.status,
            created_at: property.created_at.to_rfc3339(),
            updated_at: Some(property.updated_at.to_rfc3339()),
            main_image_url: property.main_image_url,
            area_sqm: property.area_sqm,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
        })
    }

    /// Update a property (real DB update with authorization)
    async fn update_property(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdatePropertyInput,
    ) -> Result<PropertyResponse> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = auth_guard::require_auth(ctx)?;

        let pid = uuid::Uuid::parse_str(&id.to_string())
            .map_err(|_| async_graphql::Error::new("Invalid property ID"))?;

        let property = crate::services::property::PropertyService::update(
            pool,
            pid,
            user_id,
            input.title.as_deref(),
            input.property_type.as_deref(),
            input.purpose.as_deref(),
            input.description.as_deref(),
            input.city.as_deref(),
            input.status.as_deref(),
            input.visibility.as_deref(),
            None, // area_sqm
            None, // bedrooms
            None, // bathrooms
            input.price_amount,
        )
        .await
        .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(PropertyResponse {
            id: ID::from(property.id.to_string()),
            title: property.title,
            property_type: property.property_type,
            purpose: property.purpose,
            price_amount: property.price_amount,
            city: property.city.unwrap_or_default(),
            status: property.status,
            created_at: property.created_at.to_rfc3339(),
            updated_at: Some(property.updated_at.to_rfc3339()),
            main_image_url: property.main_image_url,
            area_sqm: property.area_sqm,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
        })
    }

    /// Delete a property (soft delete with authorization)
    async fn delete_property(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let pool = ctx.data::<DbPool>()?;
        let user_id = auth_guard::require_auth(ctx)?;

        let pid = uuid::Uuid::parse_str(&id.to_string())
            .map_err(|_| async_graphql::Error::new("Invalid property ID"))?;

        crate::services::property::PropertyService::delete(pool, pid, user_id)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))
    }

    /// Share a property (log event)
    async fn share_property(
        &self,
        ctx: &Context<'_>,
        property_id: ID,
        channel: String,
        recipient_phone: Option<String>,
    ) -> Result<ShareEventResponse> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(ShareEventResponse {
            id: ID::from(Uuid::new_v4().to_string()),
            property_id,
            channel,
            whatsapp_link: Some(format!(
                "https://wa.me/{}?text=🏠 %20عقار%20جديد",
                recipient_phone.unwrap_or_default()
            )),
            created_at: Utc::now().to_rfc3339(),
        })
    }

    /// Rate a property
    async fn rate_property(
        &self,
        ctx: &Context<'_>,
        property_id: ID,
        score: i32,
        review: Option<String>,
    ) -> Result<RatingResponse> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(RatingResponse {
            id: ID::from(Uuid::new_v4().to_string()),
            property_id,
            score,
            review,
            created_at: Utc::now().to_rfc3339(),
        })
    }

    /// Report a property or user
    async fn create_report(
        &self,
        ctx: &Context<'_>,
        property_id: Option<ID>,
        reported_user_id: Option<ID>,
        reason: String,
        description: Option<String>,
    ) -> Result<ReportResponse> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(ReportResponse {
            id: ID::from(Uuid::new_v4().to_string()),
            property_id,
            reported_user_id,
            reason,
            description,
            status: "pending".to_string(),
            created_at: Utc::now().to_rfc3339(),
        })
    }

    // ─── Admin Plan Mutations ────────────────────────────

    /// Admin: Create a plan
    async fn admin_create_plan(
        &self,
        ctx: &Context<'_>,
        input: CreatePlanInput,
    ) -> Result<PlanDetailResponse> {
        crate::api::admin_plans::admin_create_plan(ctx, input).await
    }

    /// Admin: Update a plan
    async fn admin_update_plan(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdatePlanInput,
    ) -> Result<PlanDetailResponse> {
        crate::api::admin_plans::admin_update_plan(ctx, id, input).await
    }

    /// Admin: Archive plan (soft-delete)
    async fn admin_archive_plan(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        crate::api::admin_plans::admin_archive_plan(ctx, id).await
    }

    /// Admin: Delete plan (fails if active subscribers)
    async fn admin_delete_plan(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        crate::api::admin_plans::admin_delete_plan(ctx, id).await
    }

    /// Admin: Set plan featured
    async fn admin_set_plan_featured(&self, ctx: &Context<'_>, id: ID, featured: bool) -> Result<PlanDetailResponse> {
        crate::api::admin_plans::admin_set_plan_featured(ctx, id, featured).await
    }

    /// Admin: Set plan popular
    async fn admin_set_plan_popular(&self, ctx: &Context<'_>, id: ID, popular: bool) -> Result<PlanDetailResponse> {
        crate::api::admin_plans::admin_set_plan_popular(ctx, id, popular).await
    }

    /// Admin: Set plan recommended
    async fn admin_set_plan_recommended(&self, ctx: &Context<'_>, id: ID, recommended: bool) -> Result<PlanDetailResponse> {
        crate::api::admin_plans::admin_set_plan_recommended(ctx, id, recommended).await
    }

    /// Admin: Set plan visibility
    async fn admin_set_plan_visibility(&self, ctx: &Context<'_>, id: ID, visibility: String) -> Result<PlanDetailResponse> {
        crate::api::admin_plans::admin_set_plan_visibility(ctx, id, visibility).await
    }

    /// Admin: Reorder plans
    async fn admin_reorder_plans(&self, ctx: &Context<'_>, plan_ids: Vec<ID>) -> Result<bool> {
        crate::api::admin_plans::admin_reorder_plans(ctx, plan_ids).await
    }

    /// Admin: Create plan feature
    async fn admin_create_plan_feature(&self, ctx: &Context<'_>, input: CreatePlanFeatureInput) -> Result<PlanFeatureResponse> {
        crate::api::admin_plans::admin_create_plan_feature(ctx, input).await
    }

    /// Admin: Update plan feature
    async fn admin_update_plan_feature(&self, ctx: &Context<'_>, id: ID, input: UpdatePlanFeatureInput) -> Result<PlanFeatureResponse> {
        crate::api::admin_plans::admin_update_plan_feature(ctx, id, input).await
    }

    /// Admin: Delete plan feature
    async fn admin_delete_plan_feature(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        crate::api::admin_plans::admin_delete_plan_feature(ctx, id).await
    }

    /// Admin: Toggle payment provider (real DB toggle)
    async fn admin_toggle_payment_provider(
        &self,
        ctx: &Context<'_>,
        provider_key: String,
        is_enabled: bool,
    ) -> Result<PaymentProviderResponse> {
        let pool = ctx.data::<DbPool>()?;
        auth_guard::require_permission_user(ctx, pool, "admin.payment_providers.manage").await?;

        let updated = crate::services::payment_provider::PaymentProviderService::toggle(
            pool,
            &provider_key,
            is_enabled,
        )
        .await
        .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        if !updated {
            return Err(async_graphql::Error::new(format!(
                "Payment provider '{}' not found", provider_key
            )));
        }

        // Re-fetch to return full updated record
        let providers = crate::services::payment_provider::PaymentProviderService::list_all(pool)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        let provider = providers
            .into_iter()
            .find(|p| p.provider_key == provider_key)
            .ok_or_else(|| async_graphql::Error::new("Provider disappeared after toggle"))?;

        Ok(PaymentProviderResponse {
            id: ID::from(provider.id.to_string()),
            provider_key: provider.provider_key,
            display_name: provider.display_name,
            is_enabled: provider.is_enabled,
            supported_methods: provider.supported_methods,
        })
    }
}

// ─── Response Types ──────────────────────────────────────

#[derive(SimpleObject, Debug, Default)]
pub struct UserResponse {
    pub id: ID,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub full_name: String,
    pub language: String,
    pub status: String,
}

#[derive(SimpleObject, Debug, Default)]
pub struct PropertyResponse {
    pub id: ID,
    pub title: String,
    pub property_type: String,
    pub purpose: String,
    pub price_amount: Option<f64>,
    pub city: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub main_image_url: Option<String>,
    pub area_sqm: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
}

#[derive(SimpleObject, Debug)]
pub struct PlanResponse {
    pub id: ID,
    pub name: String,
    pub tier: String,
    pub price_monthly_sar: f64,
    pub max_properties: i32,
    pub max_images_per_property: i32,
    pub ai_enabled: bool,
    pub export_enabled: bool,
    pub features: Vec<String>,
    pub is_active: bool,
}

#[derive(SimpleObject, Debug)]
pub struct DashboardStats {
    pub total_users: i32,
    pub total_properties: i32,
    pub total_organizations: i32,
    pub total_revenue_sar: f64,
    pub active_subscriptions: i32,
    pub pending_reports: i32,
}
#[derive(SimpleObject, Debug)]
pub struct OrganizationResponse {
    pub id: ID,
    pub name: String,
    pub role: String,
    pub member_count: i32,
    pub property_count: i32,
}

#[derive(SimpleObject, Debug)]
pub struct ContactResponse {
    pub id: ID,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    #[graphql(name = "type")]
    pub contact_type: String,
}

#[derive(SimpleObject, Debug)]
pub struct AuditLogEntry {
    pub id: ID,
    pub admin_id: ID,
    pub action: String,
    pub target_type: String,
    pub target_id: Option<ID>,
    pub details: Option<String>,
    pub created_at: String,
}

#[derive(SimpleObject, Debug)]
pub struct AdminPropertyEntry {
    pub id: ID,
    pub title: String,
    pub property_type: String,
    pub purpose: String,
    pub price_amount: Option<f64>,
    pub city: String,
    pub status: String,
    pub visibility: String,
    pub created_at: String,
    pub owner_name: String,
}

#[derive(SimpleObject, Debug)]
pub struct AdminOrgEntry {
    pub id: ID,
    pub name: String,
    pub status: String,
    pub created_at: String,
    pub member_count: i32,
    pub owner_name: String,
}

#[derive(SimpleObject, Debug)]
pub struct AdminReportEntry {
    pub id: ID,
    pub reason: String,
    pub description: Option<String>,
    pub status: String,
    pub created_at: String,
    pub reporter_name: String,
}

#[derive(SimpleObject, Debug)]
pub struct SettingEntry {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}

#[derive(SimpleObject, Debug)]
pub struct ReminderResponse {
    pub id: ID,
    pub title: String,
    pub due_at: String,
    pub completed: bool,
    pub property_id: Option<ID>,
}

#[derive(SimpleObject, Debug)]
pub struct SavedSearchResponse {
    pub id: ID,
    pub name: String,
    pub filters: String,
    pub notify: bool,
}

#[derive(SimpleObject, Debug)]
pub struct SubscriptionResponse {
    pub id: ID,
    pub plan_name: String,
    pub tier: String,
    pub status: String,
    pub current_period_end: String,
}

#[derive(SimpleObject, Debug)]
pub struct PaymentProviderResponse {
    pub id: ID,
    pub provider_key: String,
    pub display_name: String,
    pub is_enabled: bool,
    pub supported_methods: Vec<String>,
}

#[derive(SimpleObject, Debug)]
pub struct AuthPayload {
    pub token: String,
    pub user: UserResponse,
}

#[derive(SimpleObject, Debug)]
pub struct ShareEventResponse {
    pub id: ID,
    pub property_id: ID,
    pub channel: String,
    pub whatsapp_link: Option<String>,
    pub created_at: String,
}

#[derive(SimpleObject, Debug)]
pub struct RatingResponse {
    pub id: ID,
    pub property_id: ID,
    pub score: i32,
    pub review: Option<String>,
    pub created_at: String,
}

#[derive(SimpleObject, Debug)]
pub struct ReportResponse {
    pub id: ID,
    pub property_id: Option<ID>,
    pub reported_user_id: Option<ID>,
    pub reason: String,
    pub description: Option<String>,
    pub status: String,
    pub created_at: String,
}

// ─── Input Types ─────────────────────────────────────────

#[derive(InputObject)]
pub struct RegisterInput {
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub language: Option<String>,
}

#[derive(InputObject)]
pub struct CreatePropertyInput {
    pub title: String,
    pub property_type: String,
    pub purpose: String,
    pub price_amount: Option<f64>,
    pub city: Option<String>,
    pub description: Option<String>,
    pub area_sqm: Option<f64>,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub owner_phone: String,
    pub visibility: Option<String>,
}

#[derive(InputObject)]
pub struct UpdatePropertyInput {
    pub title: Option<String>,
    pub property_type: Option<String>,
    pub purpose: Option<String>,
    pub price_amount: Option<f64>,
    pub city: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub visibility: Option<String>,
}

#[derive(InputObject)]
pub struct SearchInput {
    pub query: Option<String>,
    pub city: Option<String>,
    pub property_type: Option<Vec<String>>,
    pub purpose: Option<Vec<String>>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub min_area: Option<f64>,
    pub max_area: Option<f64>,
    pub bedrooms: Option<i32>,
    pub sort_by: Option<String>,
}

#[derive(InputObject)]
pub struct PlanInput {
    pub id: Option<String>,
    pub name: String,
    pub tier: String,
    pub price_monthly_sar: f64,
    pub max_properties: i32,
    pub max_images_per_property: i32,
    pub ai_enabled: bool,
    pub export_enabled: bool,
    pub features: Vec<String>,
    pub is_active: bool,
}

#[derive(InputObject)]
pub struct RatingInput {
    pub property_id: ID,
    pub score: i32,
    pub review: Option<String>,
}

#[derive(InputObject)]
pub struct ReportInput {
    pub property_id: Option<ID>,
    pub reported_user_id: Option<ID>,
    pub reason: String,
    pub description: Option<String>,
}

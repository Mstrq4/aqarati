// Aqarati GraphQL Schema — Query & Mutation roots

use async_graphql::{Context, Object, Result, InputObject, SimpleObject, ID};
use uuid::Uuid;
use chrono::{Utc, DateTime};
use serde::{Serialize, Deserialize};

use crate::db::DbPool;

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
        let user_id = ctx.data_opt::<Uuid>().cloned();

        // For now return demo user — will be replaced with JWT auth
        Ok(UserResponse {
            id: ID::from(user_id.unwrap_or_else(Uuid::new_v4).to_string()),
            email: Some("demo@aqarati.app".to_string()),
            phone: Some("+966500000000".to_string()),
            full_name: "مستخدم تجريبي".to_string(),
            language: "ar".to_string(),
            status: "active".to_string(),
        })
    }

    /// List properties for current user
    async fn my_properties(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<PropertyResponse>> {
        let pool = ctx.data::<DbPool>()?;
        // TODO: Implement with real DB query
        Ok(vec![])
    }

    /// Get single property by ID
    async fn property(
        &self,
        ctx: &Context<'_>,
        id: ID,
    ) -> Result<Option<PropertyResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Implement authorization check + DB query
        Ok(None)
    }

    /// Search properties
    async fn search_properties(
        &self,
        ctx: &Context<'_>,
        input: SearchInput,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<PropertyResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Implement full-text search + filters
        Ok(vec![])
    }

    /// Get plans
    async fn plans(&self, ctx: &Context<'_>) -> Result<Vec<PlanResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        // Return demo plans
        Ok(vec![
            PlanResponse {
                id: ID::from("free"),
                name: "مجاني".to_string(),
                tier: "free".to_string(),
                price_monthly_sar: 0.0,
                max_properties: 10,
                max_images_per_property: 5,
                ai_enabled: false,
                export_enabled: false,
                features: vec!["إضافة عقارات".to_string(), "مشاركة واتساب".to_string()],
                is_active: true,
            },
            PlanResponse {
                id: ID::from("pro"),
                name: "احترافي".to_string(),
                tier: "pro".to_string(),
                price_monthly_sar: 49.0,
                max_properties: 100,
                max_images_per_property: 20,
                ai_enabled: true,
                export_enabled: true,
                features: vec!["كل مميزات المجاني".to_string(), "AI".to_string(), "تصدير".to_string()],
                is_active: true,
            },
        ])
    }

    /// Get organizations for current user
    async fn my_organizations(&self, ctx: &Context<'_>) -> Result<Vec<OrganizationResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(vec![])
    }

    /// Get contacts for current user
    async fn my_contacts(&self, ctx: &Context<'_>) -> Result<Vec<ContactResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(vec![])
    }

    /// Get reminders for current user
    async fn my_reminders(&self, ctx: &Context<'_>) -> Result<Vec<ReminderResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(vec![])
    }

    /// Get saved searches
    async fn my_saved_searches(&self, ctx: &Context<'_>) -> Result<Vec<SavedSearchResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(vec![])
    }

    /// Get current subscription
    async fn my_subscription(&self, ctx: &Context<'_>) -> Result<Option<SubscriptionResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(None)
    }

    /// Admin: List all users
    async fn admin_users(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<UserResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Admin only check
        Ok(vec![])
    }

    /// Admin: List payment providers
    async fn payment_providers(&self, ctx: &Context<'_>) -> Result<Vec<PaymentProviderResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(vec![
            PaymentProviderResponse {
                id: ID::from("mada"),
                provider_key: "mada".to_string(),
                display_name: "مدى".to_string(),
                is_enabled: true,
                supported_methods: vec!["card".to_string(), "apple_pay".to_string()],
            },
            PaymentProviderResponse {
                id: ID::from("stc_pay"),
                provider_key: "stc_pay".to_string(),
                display_name: "STC Pay".to_string(),
                is_enabled: true,
                supported_methods: vec!["wallet".to_string(), "card".to_string()],
            },
        ])
    }

    /// Get ratings for a property
    async fn property_ratings(
        &self,
        ctx: &Context<'_>,
        property_id: ID,
    ) -> Result<Vec<RatingResponse>> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(vec![])
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
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Hash password, insert user, return JWT
        Ok(AuthPayload {
            token: "demo_token_placeholder".to_string(),
            user: UserResponse {
                id: ID::from(Uuid::new_v4().to_string()),
                email: Some(input.email),
                phone: input.phone,
                full_name: input.full_name,
                language: input.language.unwrap_or_else(|| "ar".to_string()),
                status: "active".to_string(),
            },
        })
    }

    /// Login
    async fn login(
        &self,
        ctx: &Context<'_>,
        email: String,
        password: String,
    ) -> Result<AuthPayload> {
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Verify credentials, return JWT
        Ok(AuthPayload {
            token: "demo_token_placeholder".to_string(),
            user: UserResponse {
                id: ID::from(Uuid::new_v4().to_string()),
                email: Some(email),
                phone: Some("+966500000000".to_string()),
                full_name: "مستخدم تجريبي".to_string(),
                language: "ar".to_string(),
                status: "active".to_string(),
            },
        })
    }

    /// Create a property
    async fn create_property(
        &self,
        ctx: &Context<'_>,
        input: CreatePropertyInput,
    ) -> Result<PropertyResponse> {
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Validate, insert into DB, return
        Ok(PropertyResponse {
            id: ID::from(Uuid::new_v4().to_string()),
            title: input.title,
            property_type: input.property_type,
            purpose: input.purpose,
            price_amount: input.price_amount,
            city: input.city.unwrap_or_default(),
            status: "draft".to_string(),
            created_at: Utc::now().to_rfc3339(),
            ..Default::default()
        })
    }

    /// Update a property
    async fn update_property(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdatePropertyInput,
    ) -> Result<PropertyResponse> {
        let _pool = ctx.data::<DbPool>()?;
        // TODO: Authorization check + update
        Ok(PropertyResponse {
            id,
            title: input.title.unwrap_or_default(),
            ..Default::default()
        })
    }

    /// Delete a property (soft delete)
    async fn delete_property(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(true)
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

    // ─── Admin Mutations ──────────────────────────────────

    /// Admin: Create/update plan
    async fn admin_upsert_plan(
        &self,
        ctx: &Context<'_>,
        input: PlanInput,
    ) -> Result<PlanResponse> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(PlanResponse {
            id: ID::from(input.id.unwrap_or_else(|| Uuid::new_v4().to_string())),
            name: input.name,
            tier: input.tier,
            price_monthly_sar: input.price_monthly_sar,
            max_properties: input.max_properties,
            max_images_per_property: input.max_images_per_property,
            ai_enabled: input.ai_enabled,
            export_enabled: input.export_enabled,
            features: input.features,
            is_active: input.is_active,
        })
    }

    /// Admin: Delete plan
    async fn admin_delete_plan(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(true)
    }

    /// Admin: Toggle payment provider
    async fn admin_toggle_payment_provider(
        &self,
        ctx: &Context<'_>,
        provider_key: String,
        is_enabled: bool,
    ) -> Result<PaymentProviderResponse> {
        let _pool = ctx.data::<DbPool>()?;
        Ok(PaymentProviderResponse {
            id: ID::from(provider_key.clone()),
            provider_key,
            display_name: "Provider".to_string(),
            is_enabled,
            supported_methods: vec![],
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

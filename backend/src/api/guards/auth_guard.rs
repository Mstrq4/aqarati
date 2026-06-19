// Aqarati — RBAC Guard Functions for GraphQL Resolvers
// These provide composable authorization checks for async-graphql resolvers.
//
// Usage in a resolver:
//   let user_id = extract_user_id(ctx)?;
//   require_permission(&pool, user_id, "admin.plans.read").await?;

use async_graphql::{Context, Error};
use uuid::Uuid;

use crate::db::DbPool;
use crate::services::rbac::RbacService;

/// Extract the authenticated user's UUID from GraphQL context.
/// Returns an auth error if no user is present.
pub fn extract_user_id(ctx: &Context<'_>) -> Result<Uuid, Error> {
    ctx.data_opt::<Uuid>()
        .cloned()
        .ok_or_else(|| Error::new("Not authenticated"))
}

/// Require that the user is authenticated (has a valid JWT).
pub fn require_auth(ctx: &Context<'_>) -> Result<Uuid, Error> {
    extract_user_id(ctx)
}

/// Require a specific permission. Returns the user_id on success.
pub async fn require_permission(
    pool: &DbPool,
    user_id: Uuid,
    permission: &str,
) -> Result<(), Error> {
    if !RbacService::has_permission(pool, user_id, permission)
        .await
        .map_err(|e| Error::new(e))?
    {
        return Err(Error::new(format!(
            "Forbidden: missing permission '{}'",
            permission
        )));
    }
    Ok(())
}

/// Require that the user has any admin.* permission.
pub async fn require_admin(pool: &DbPool, user_id: Uuid) -> Result<(), Error> {
    if !RbacService::is_admin(pool, user_id)
        .await
        .map_err(|e| Error::new(e))?
    {
        return Err(Error::new("Forbidden: admin access required"));
    }
    Ok(())
}

/// Combined guard: extract user_id + require admin access.
/// Returns the user_id on success.
pub async fn require_admin_user(ctx: &Context<'_>, pool: &DbPool) -> Result<Uuid, Error> {
    let user_id = require_auth(ctx)?;
    require_admin(pool, user_id).await?;
    Ok(user_id)
}

/// Combined guard: extract user_id + require specific permission.
/// Returns the user_id on success.
pub async fn require_permission_user(
    ctx: &Context<'_>,
    pool: &DbPool,
    permission: &str,
) -> Result<Uuid, Error> {
    let user_id = require_auth(ctx)?;
    require_permission(pool, user_id, permission).await?;
    Ok(user_id)
}

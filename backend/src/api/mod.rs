// Aqarati — GraphQL API Module
pub mod schema;
pub mod resolvers;
pub mod guards;
pub mod admin_plans;

use actix_web::{web, HttpResponse, get};
use async_graphql::http::{playground_source, GraphQLPlaygroundConfig};
use async_graphql_actix_web::{GraphQLRequest, GraphQLResponse};

use crate::db::DbPool;
use crate::config::Config;

pub type AppSchema = async_graphql::Schema<
    schema::Query,
    schema::Mutation,
    async_graphql::EmptySubscription,
>;

/// Configure all routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(graphql_handler)
       .service(graphql_playground)
       .service(health_check);
}

/// Main GraphQL endpoint
#[actix_web::post("/graphql")]
async fn graphql_handler(
    schema: web::Data<AppSchema>,
    _pool: web::Data<DbPool>,
    _cfg: web::Data<Config>,
    http_req: actix_web::HttpRequest,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let mut gql_req = req.into_inner();

    // Extract JWT from Authorization header and inject user_id into context
    if let Some(auth_header) = http_req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                let secret = std::env::var("JWT_SECRET").unwrap_or_default();
                if !secret.is_empty() {
                    if let Ok(claims) = crate::services::auth::AuthService::validate_token(token, &secret) {
                        if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
                            gql_req = gql_req.data(user_id);
                        }
                    }
                }
            }
        }
    }

    schema.execute(gql_req).await.into()
}

/// GraphQL Playground (dev only)
#[get("/graphql")]
async fn graphql_playground(cfg: web::Data<Config>) -> HttpResponse {
    if cfg.playground_enabled {
        HttpResponse::Ok()
            .content_type("text/html; charset=utf-8")
            .body(playground_source(
                GraphQLPlaygroundConfig::new("/graphql")
                    .title("عقاراتي — GraphQL Playground"),
            ))
    } else {
        HttpResponse::Forbidden().body("Playground disabled in production")
    }
}

/// Health check
#[get("/health")]
async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "aqarati-backend",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

/// Serve uploaded files
pub async fn serve_upload(
    path: web::Path<String>,
    cfg: web::Data<Config>,
) -> actix_web::HttpResponse {
    let file_path = std::path::Path::new(&cfg.storage_path).join(path.as_str());

    // Security: prevent directory traversal
    let canonical = match file_path.canonicalize() {
        Ok(p) => p,
        Err(_) => return HttpResponse::NotFound().body("File not found"),
    };
    let storage_canonical = match std::path::Path::new(&cfg.storage_path).canonicalize() {
        Ok(p) => p,
        Err(_) => return HttpResponse::NotFound().body("Storage not configured"),
    };
    if !canonical.starts_with(&storage_canonical) {
        return HttpResponse::Forbidden().body("Access denied");
    }

    match actix_web::web::Bytes::from(std::fs::read(&canonical).unwrap_or_default()) {
        bytes if bytes.is_empty() => HttpResponse::NotFound().body("File not found"),
        bytes => {
            let mime = mime_guess::from_path(&canonical).first_or_octet_stream();
            HttpResponse::Ok().content_type(mime.as_ref()).body(bytes)
        }
    }
}

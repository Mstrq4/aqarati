// Aqarati — JWT Auth Middleware / GraphQL Extension
// Extracts user ID from Authorization header and injects into GraphQL Context

use actix_web::{dev::ServiceRequest, Error, HttpMessage};
use async_graphql::{Context, ServerError, ErrorExtensions};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::future::{Ready, ready};
use actix_web::dev::{Service, Transform};
use actix_web::body::EitherBody;
use futures_util::future::LocalBoxFuture;

// ─── Actix-Web Middleware ─────────────────────────────────

pub struct JwtAuth;

impl<S, B> Transform<S, ServiceRequest> for JwtAuth
where
    S: Service<ServiceRequest, Response = actix_web::dev::ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = actix_web::dev::ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = JwtAuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(JwtAuthMiddleware {
            service: std::rc::Rc::new(service),
        }))
    }
}

pub struct JwtAuthMiddleware<S> {
    service: std::rc::Rc<S>,
}

impl<S, B> Service<ServiceRequest> for JwtAuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = actix_web::dev::ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = actix_web::dev::ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_web::dev::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            // Extract JWT from Authorization header
            if let Some(auth_header) = req.headers().get("Authorization") {
                if let Ok(auth_str) = auth_header.to_str() {
                    if let Some(token) = auth_str.strip_prefix("Bearer ") {
                        // Get JWT secret from env
                        let secret = std::env::var("JWT_SECRET").unwrap_or_default();
                        if !secret.is_empty() {
                            let validation = Validation::new(Algorithm::HS256);
                            if let Ok(token_data) = decode::<Claims>(
                                token,
                                &DecodingKey::from_secret(secret.as_bytes()),
                                &validation,
                            ) {
                                if let Ok(user_id) = Uuid::parse_str(&token_data.claims.sub) {
                                    // Inject user_id into request extensions
                                    req.extensions_mut().insert(user_id);
                                }
                            }
                        }
                    }
                }
            }

            let res = svc.call(req).await?;
            Ok(res.map_into_left_body())
        })
    }
}

// ─── Claims ──────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
    pub role: String,
}

// ─── GraphQL Extension — injects user_id from Actix request into GraphQL context ──

pub struct AuthExtension;

#[async_graphql::async_trait::async_trait]
impl async_graphql::extensions::Extension for AuthExtension {
    async fn prepare_request(
        &self,
        ctx: &async_graphql::extensions::ExtensionContext<'_>,
        request: async_graphql::Request,
    ) -> async_graphql::ServerResult<async_graphql::Request> {
        // Try to get the Actix HttpRequest from context data
        if let Some(http_req) = ctx.data_opt::<actix_web::HttpRequest>() {
            if let Some(user_id) = http_req.extensions().get::<Uuid>() {
                // Inject user_id AND request into GraphQL context so resolvers can access it
                ctx.data_unchecked::<Option<Uuid>>(); // placeholder
            }
        }
        Ok(request)
    }
}

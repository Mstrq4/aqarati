// Aqarati Backend — Main entry point
// Rust + Actix-Web + async-graphql

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware as actix_middleware, http};
use async_graphql::{Schema, EmptySubscription};
use std::env;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod api;
mod config;
mod db;
mod domain;
mod middleware;
mod resolvers;
mod services;
mod integrations;
mod repository;
mod utils;

use api::schema::{Mutation, Query};
use api::AppSchema;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .pretty()
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set tracing subscriber");

    // Load config
    dotenv::dotenv().ok();
    let cfg = config::Config::from_env().expect("Failed to load config");

    // Initialize database pool
    let pool = db::create_pool(&cfg).await.expect("Failed to create database pool");
    db::run_migrations(&pool, &cfg.db_engine).await.expect("Failed to run migrations");

    info!("🚀 Aqarati Backend starting on {}:{}", cfg.host, cfg.port);

    // Build GraphQL schema
    let schema = Schema::build(Query::default(), Mutation::default(), EmptySubscription)
        .data(pool.clone())
        .data(cfg.clone())
        .finish();

    let schema = web::Data::new(schema);

    // Clone cfg before moving into the closure (needed for .bind below)
    let cfg_clone = cfg.clone();

    // Start server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin_fn(|origin, _req_head| {
                let origins = env::var("CORS_ORIGINS")
                    .unwrap_or_else(|_| "http://localhost:*".to_string());
                origins.split(',').any(|o| {
                    let o = o.trim();
                    if o.ends_with('*') {
                        origin.to_str().map_or(false, |orig| {
                            orig.starts_with(&o[..o.len() - 1])
                        })
                    } else {
                        origin.to_str().map_or(false, |orig| orig == o)
                    }
                })
            })
            .allowed_methods(vec!["GET", "POST", "OPTIONS"])
            .allowed_headers(vec![
                http::header::AUTHORIZATION,
                http::header::ACCEPT,
                http::header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(actix_middleware::Logger::default())
            .app_data(schema.clone())
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(cfg.clone()))
            .configure(api::configure_routes)
            .service(
                web::scope("/uploads")
                    .route("/{path:.*}", web::get().to(api::serve_upload)),
            )
    })
    .bind(format!("{}:{}", cfg_clone.host, cfg_clone.port))?
    .run()
    .await
}

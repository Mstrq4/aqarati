use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub db_engine: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub host: String,
    pub port: u16,
    pub storage_path: String,
    pub storage_url: String,
    pub playground_enabled: bool,
    pub demo_mode: bool,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        Ok(Config {
            db_engine: env::var("DB_ENGINE").unwrap_or_else(|_| "postgresql".to_string()),
            database_url: env::var("DATABASE_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .unwrap_or(8000),
            storage_path: env::var("STORAGE_PATH").unwrap_or_else(|_| "./storage/uploads".to_string()),
            storage_url: env::var("STORAGE_URL").unwrap_or_else(|_| "/uploads".to_string()),
            playground_enabled: env::var("PLAYGROUND_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            demo_mode: env::var("DEMO_MODE")
                .unwrap_or_else(|_| "false".to_string())
                .parse()
                .unwrap_or(false),
        })
    }
}

/// Extract user ID from the auth header for RLS context
pub fn extract_user_id_from_token(token: &str, secret: &str) -> Result<uuid::Uuid, String> {
    use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        exp: usize,
    }

    let token = token.trim_start_matches("Bearer ");
    let validation = Validation::new(Algorithm::HS256);

    match decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &validation) {
        Ok(data) => {
            uuid::Uuid::parse_str(&data.claims.sub)
                .map_err(|e| format!("Invalid user ID: {}", e))
        }
        Err(e) => Err(format!("Invalid token: {}", e)),
    }
}

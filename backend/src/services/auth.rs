// Aqarati — Auth Service
// Registration, login, JWT generation, password hashing with argon2, refresh tokens

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::config::Config;
use crate::db::DbPool;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user id
    pub exp: usize,
    pub iat: usize,
    pub role: String,
}

#[derive(Debug)]
pub struct AuthResult {
    pub token: String,
    pub refresh_token: String,
    pub user_id: Uuid,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub full_name: String,
    pub language: String,
    pub status: String,
}

pub struct AuthService;

impl AuthService {
    /// Hash a password with Argon2id
    pub fn hash_password(password: &str) -> Result<String, String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|h| h.to_string())
            .map_err(|e| format!("Password hashing failed: {}", e))
    }

    /// Verify a password against its hash
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| format!("Invalid password hash: {}", e))?;
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Generate a JWT access token
    pub fn generate_token(user_id: Uuid, role: &str, secret: &str) -> Result<String, String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            exp: (now + Duration::hours(24)).timestamp() as usize,
            iat: now.timestamp() as usize,
            role: role.to_string(),
        };
        encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .map_err(|e| format!("Token generation failed: {}", e))
    }

    /// Generate a refresh token (random UUID stored in DB)
    pub fn generate_refresh_token() -> String {
        Uuid::new_v4().to_string()
    }

    /// Register a new user
    pub async fn register(
        pool: &DbPool,
        cfg: &Config,
        email: &str,
        password: &str,
        full_name: &str,
        phone: Option<&str>,
        language: Option<&str>,
    ) -> Result<AuthResult, String> {
        let password_hash = Self::hash_password(password)?;
        let user_id = Uuid::new_v4();
        let lang = language.unwrap_or("ar");

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO users (id, email, phone, password_hash, status, language) VALUES ($1, $2, $3, $4, 'active', $5)"
                )
                .bind(user_id)
                .bind(email)
                .bind(phone)
                .bind(&password_hash)
                .bind(lang)
                .execute(p)
                .await
                .map_err(|e| {
                    if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
                        "Email already registered".to_string()
                    } else {
                        format!("Registration failed: {}", e)
                    }
                })?;

                sqlx::query(
                    "INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)"
                )
                .bind(user_id)
                .bind(full_name)
                .execute(p)
                .await
                .map_err(|e| format!("Profile creation failed: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO users (id, email, phone, password_hash, status, language) VALUES (?, ?, ?, ?, 'active', ?)"
                )
                .bind(user_id.to_string())
                .bind(email)
                .bind(phone)
                .bind(&password_hash)
                .bind(lang)
                .execute(p)
                .await
                .map_err(|e| {
                    if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
                        "Email already registered".to_string()
                    } else {
                        format!("Registration failed: {}", e)
                    }
                })?;

                sqlx::query(
                    "INSERT INTO user_profiles (user_id, full_name) VALUES (?, ?)"
                )
                .bind(user_id.to_string())
                .bind(full_name)
                .execute(p)
                .await
                .map_err(|e| format!("Profile creation failed: {}", e))?;
            }
        }

        let token = Self::generate_token(user_id, "user", &cfg.jwt_secret)?;
        let refresh_token = Self::generate_refresh_token();

        let refresh_hash = Self::hash_password(&refresh_token)?;
        let expires_at = Utc::now() + Duration::days(30);
        Self::store_refresh_token(pool, user_id, &refresh_hash, expires_at).await?;

        Ok(AuthResult {
            token,
            refresh_token,
            user_id,
            email: Some(email.to_string()),
            phone: phone.map(|s| s.to_string()),
            full_name: full_name.to_string(),
            language: lang.to_string(),
            status: "active".to_string(),
        })
    }

    /// Login with email + password
    pub async fn login(
        pool: &DbPool,
        cfg: &Config,
        email: &str,
        password: &str,
    ) -> Result<AuthResult, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT u.id, u.email, u.phone, u.password_hash, u.status::text as status, u.language, up.full_name \
                     FROM users u JOIN user_profiles up ON u.id = up.user_id \
                     WHERE u.email = $1 AND u.deleted_at IS NULL"
                )
                .bind(email)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Login query failed: {}", e))?
                .ok_or_else(|| "Invalid email or password".to_string())?;

                let user_id: Uuid = row.try_get("id").map_err(|e| format!("ID parse error: {}", e))?;
                let status: String = row.try_get("status").map_err(|e| format!("Status parse error: {}", e))?;

                if status == "suspended" || status == "deleted" {
                    return Err("Account is suspended or deleted".to_string());
                }

                let password_hash: String = row.try_get("password_hash")
                    .map_err(|_| "Account has no password (social login only)".to_string())?;

                if !Self::verify_password(password, &password_hash)? {
                    return Err("Invalid email or password".to_string());
                }

                let user_email: Option<String> = row.try_get("email").ok();
                let phone: Option<String> = row.try_get("phone").ok();
                let language: String = row.try_get("language").unwrap_or_else(|_| "ar".to_string());
                let full_name: String = row.try_get("full_name").unwrap_or_else(|_| "User".to_string());

                let token = Self::generate_token(user_id, "user", &cfg.jwt_secret)?;
                let refresh_token = Self::generate_refresh_token();
                let refresh_hash = Self::hash_password(&refresh_token)?;
                let expires_at = Utc::now() + Duration::days(30);
                Self::store_refresh_token(pool, user_id, &refresh_hash, expires_at).await?;

                Ok(AuthResult {
                    token,
                    refresh_token,
                    user_id,
                    email: user_email,
                    phone,
                    full_name,
                    language,
                    status,
                })
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT u.id, u.email, u.phone, u.password_hash, u.status, u.language, up.full_name \
                     FROM users u JOIN user_profiles up ON u.id = up.user_id \
                     WHERE u.email = ? AND u.deleted_at IS NULL"
                )
                .bind(email)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Login query failed: {}", e))?
                .ok_or_else(|| "Invalid email or password".to_string())?;

                let user_id: Uuid = row.try_get("id").map_err(|e| format!("ID parse error: {}", e))?;
                let status: String = row.try_get("status").map_err(|e| format!("Status parse error: {}", e))?;

                if status == "suspended" || status == "deleted" {
                    return Err("Account is suspended or deleted".to_string());
                }

                let password_hash: String = row.try_get("password_hash")
                    .map_err(|_| "Account has no password (social login only)".to_string())?;

                if !Self::verify_password(password, &password_hash)? {
                    return Err("Invalid email or password".to_string());
                }

                let user_email: Option<String> = row.try_get("email").ok();
                let phone: Option<String> = row.try_get("phone").ok();
                let language: String = row.try_get("language").unwrap_or_else(|_| "ar".to_string());
                let full_name: String = row.try_get("full_name").unwrap_or_else(|_| "User".to_string());

                let token = Self::generate_token(user_id, "user", &cfg.jwt_secret)?;
                let refresh_token = Self::generate_refresh_token();
                let refresh_hash = Self::hash_password(&refresh_token)?;
                let expires_at = Utc::now() + Duration::days(30);
                Self::store_refresh_token(pool, user_id, &refresh_hash, expires_at).await?;

                Ok(AuthResult {
                    token,
                    refresh_token,
                    user_id,
                    email: user_email,
                    phone,
                    full_name,
                    language,
                    status,
                })
            }
        }
    }

    /// Store a refresh token hash
    async fn store_refresh_token(
        pool: &DbPool,
        user_id: Uuid,
        token_hash: &str,
        expires_at: chrono::DateTime<Utc>,
    ) -> Result<(), String> {
        let id = Uuid::new_v4();
        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)"
                )
                .bind(id)
                .bind(user_id)
                .bind(token_hash)
                .bind(expires_at)
                .execute(p)
                .await
                .map_err(|e| format!("Refresh token storage failed: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(user_id.to_string())
                .bind(token_hash)
                .bind(expires_at)
                .execute(p)
                .await
                .map_err(|e| format!("Refresh token storage failed: {}", e))?;
            }
        }
        Ok(())
    }

    /// Validate JWT and extract claims
    pub fn validate_token(token: &str, secret: &str) -> Result<Claims, String> {
        let token = token.trim_start_matches("Bearer ");
        let validation = Validation::new(Algorithm::HS256);
        decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &validation)
            .map(|data| data.claims)
            .map_err(|e| format!("Invalid token: {}", e))
    }

    /// Refresh an access token using a refresh token
    pub async fn refresh_access_token(
        pool: &DbPool,
        cfg: &Config,
        refresh_token: &str,
    ) -> Result<AuthResult, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, \
                     u.email, u.phone, u.status, u.language, up.full_name \
                     FROM refresh_tokens rt \
                     JOIN users u ON rt.user_id = u.id \
                     JOIN user_profiles up ON u.id = up.user_id \
                     WHERE rt.expires_at > NOW() AND u.deleted_at IS NULL"
                )
                .fetch_all(p)
                .await
                .map_err(|e| format!("Refresh query failed: {}", e))?;

                for row in rows {
                    let token_hash: String = row.try_get("token_hash").unwrap_or_default();
                    if Self::verify_password(refresh_token, &token_hash).unwrap_or(false) {
                        let user_id: Uuid = row.try_get("user_id").map_err(|e| format!("ID parse: {}", e))?;
                        let email: Option<String> = row.try_get("email").ok();
                        let phone: Option<String> = row.try_get("phone").ok();
                        let language: String = row.try_get("language").unwrap_or_else(|_| "ar".to_string());
                        let full_name: String = row.try_get("full_name").unwrap_or_else(|_| "User".to_string());
                        let status: String = row.try_get("status").unwrap_or_else(|_| "active".to_string());

                        let token = Self::generate_token(user_id, "user", &cfg.jwt_secret)?;
                        let new_refresh = Self::generate_refresh_token();
                        let new_hash = Self::hash_password(&new_refresh)?;
                        let expires_at = Utc::now() + Duration::days(30);
                        Self::store_refresh_token(pool, user_id, &new_hash, expires_at).await?;

                        return Ok(AuthResult {
                            token,
                            refresh_token: new_refresh,
                            user_id,
                            email,
                            phone,
                            full_name,
                            language,
                            status,
                        });
                    }
                }
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, \
                     u.email, u.phone, u.status, u.language, up.full_name \
                     FROM refresh_tokens rt \
                     JOIN users u ON rt.user_id = u.id \
                     JOIN user_profiles up ON u.id = up.user_id \
                     WHERE rt.expires_at > NOW() AND u.deleted_at IS NULL"
                )
                .fetch_all(p)
                .await
                .map_err(|e| format!("Refresh query failed: {}", e))?;

                for row in rows {
                    let token_hash: String = row.try_get("token_hash").unwrap_or_default();
                    if Self::verify_password(refresh_token, &token_hash).unwrap_or(false) {
                        let user_id: Uuid = row.try_get("user_id").map_err(|e| format!("ID parse: {}", e))?;
                        let email: Option<String> = row.try_get("email").ok();
                        let phone: Option<String> = row.try_get("phone").ok();
                        let language: String = row.try_get("language").unwrap_or_else(|_| "ar".to_string());
                        let full_name: String = row.try_get("full_name").unwrap_or_else(|_| "User".to_string());
                        let status: String = row.try_get("status").unwrap_or_else(|_| "active".to_string());

                        let token = Self::generate_token(user_id, "user", &cfg.jwt_secret)?;
                        let new_refresh = Self::generate_refresh_token();
                        let new_hash = Self::hash_password(&new_refresh)?;
                        let expires_at = Utc::now() + Duration::days(30);
                        Self::store_refresh_token(pool, user_id, &new_hash, expires_at).await?;

                        return Ok(AuthResult {
                            token,
                            refresh_token: new_refresh,
                            user_id,
                            email,
                            phone,
                            full_name,
                            language,
                            status,
                        });
                    }
                }
            }
        }

        Err("Invalid or expired refresh token".to_string())
    }

    /// Get user profile by ID
    pub async fn get_user_by_id(pool: &DbPool, user_id: Uuid) -> Result<Option<AuthResult>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT u.id, u.email, u.phone, u.status, u.language, up.full_name \
                     FROM users u JOIN user_profiles up ON u.id = up.user_id \
                     WHERE u.id = $1 AND u.deleted_at IS NULL"
                )
                .bind(user_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("User query failed: {}", e))?;

                match row {
                    Some(r) => {
                        let email: Option<String> = r.try_get("email").ok();
                        let phone: Option<String> = r.try_get("phone").ok();
                        let language: String = r.try_get("language").unwrap_or_else(|_| "ar".to_string());
                        let full_name: String = r.try_get("full_name").unwrap_or_else(|_| "User".to_string());
                        let status: String = r.try_get("status").unwrap_or_else(|_| "active".to_string());
                        Ok(Some(AuthResult {
                            token: String::new(),
                            refresh_token: String::new(),
                            user_id,
                            email,
                            phone,
                            full_name,
                            language,
                            status,
                        }))
                    }
                    None => Ok(None),
                }
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT u.id, u.email, u.phone, u.status, u.language, up.full_name \
                     FROM users u JOIN user_profiles up ON u.id = up.user_id \
                     WHERE u.id = ? AND u.deleted_at IS NULL"
                )
                .bind(user_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("User query failed: {}", e))?;

                match row {
                    Some(r) => {
                        let email: Option<String> = r.try_get("email").ok();
                        let phone: Option<String> = r.try_get("phone").ok();
                        let language: String = r.try_get("language").unwrap_or_else(|_| "ar".to_string());
                        let full_name: String = r.try_get("full_name").unwrap_or_else(|_| "User".to_string());
                        let status: String = r.try_get("status").unwrap_or_else(|_| "active".to_string());
                        Ok(Some(AuthResult {
                            token: String::new(),
                            refresh_token: String::new(),
                            user_id,
                            email,
                            phone,
                            full_name,
                            language,
                            status,
                        }))
                    }
                    None => Ok(None),
                }
            }
        }
    }

    /// Check if user is admin
    pub async fn is_admin(pool: &DbPool, user_id: Uuid) -> Result<bool, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT 1 FROM admin_audit_logs WHERE admin_id = $1 LIMIT 1"
                )
                .bind(user_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Admin check failed: {}", e))?;
                Ok(row.is_some())
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT 1 FROM admin_audit_logs WHERE admin_id = ? LIMIT 1"
                )
                .bind(user_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Admin check failed: {}", e))?;
                Ok(row.is_some())
            }
        }
    }

    /// List all users for admin panel (safe fields only, no password_hash)
    pub async fn list_users(
        pool: &DbPool,
        limit: i32,
        offset: i32,
    ) -> Result<Vec<AuthResult>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT u.id, u.email, u.phone, u.status, u.language, up.full_name \
                     FROM users u \
                     JOIN user_profiles up ON u.id = up.user_id \
                     WHERE u.deleted_at IS NULL \
                     ORDER BY u.created_at DESC \
                     LIMIT $1 OFFSET $2"
                )
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("List users query failed: {}", e))?;

                Ok(rows
                    .iter()
                    .map(|r| {
                        let user_id: Uuid = r.try_get("id").unwrap_or_default();
                        let email: Option<String> = r.try_get("email").ok();
                        let phone: Option<String> = r.try_get("phone").ok();
                        let language: String =
                            r.try_get("language").unwrap_or_else(|_| "ar".to_string());
                        let full_name: String =
                            r.try_get("full_name").unwrap_or_else(|_| "User".to_string());
                        let status: String =
                            r.try_get("status").unwrap_or_else(|_| "active".to_string());
                        AuthResult {
                            token: String::new(),
                            refresh_token: String::new(),
                            user_id,
                            email,
                            phone,
                            full_name,
                            language,
                            status,
                        }
                    })
                    .collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT u.id, u.email, u.phone, u.status, u.language, up.full_name \
                     FROM users u \
                     JOIN user_profiles up ON u.id = up.user_id \
                     WHERE u.deleted_at IS NULL \
                     ORDER BY u.created_at DESC \
                     LIMIT ? OFFSET ?"
                )
                .bind(limit)
                .bind(offset)
                .fetch_all(p)
                .await
                .map_err(|e| format!("List users query failed: {}", e))?;

                Ok(rows
                    .iter()
                    .map(|r| {
                        let raw_id: String = r.try_get("id").unwrap_or_default();
                        let user_id = Uuid::parse_str(&raw_id).unwrap_or_default();
                        let email: Option<String> = r.try_get("email").ok();
                        let phone: Option<String> = r.try_get("phone").ok();
                        let language: String =
                            r.try_get("language").unwrap_or_else(|_| "ar".to_string());
                        let full_name: String =
                            r.try_get("full_name").unwrap_or_else(|_| "User".to_string());
                        let status: String =
                            r.try_get("status").unwrap_or_else(|_| "active".to_string());
                        AuthResult {
                            token: String::new(),
                            refresh_token: String::new(),
                            user_id,
                            email,
                            phone,
                            full_name,
                            language,
                            status,
                        }
                    })
                    .collect())
            }
        }
    }
}

use sqlx::postgres::PgPoolOptions;
use sqlx::mysql::MySqlPoolOptions;
use tracing::info;
use crate::config::Config;

#[derive(Debug, Clone)]
pub enum DbPool {
    Postgres(sqlx::PgPool),
    Mysql(sqlx::MySqlPool),
}

impl DbPool {
    pub async fn begin(&self) -> Result<DbTransaction, sqlx::Error> {
        match self {
            DbPool::Postgres(p) => Ok(DbTransaction::Postgres(p.begin().await?)),
            DbPool::Mysql(p) => Ok(DbTransaction::Mysql(p.begin().await?)),
        }
    }
}

pub enum DbTransaction {
    Postgres(sqlx::Transaction<'static, sqlx::Postgres>),
    Mysql(sqlx::Transaction<'static, sqlx::MySql>),
}

impl DbTransaction {
    pub async fn commit(self) -> Result<(), sqlx::Error> {
        match self {
            DbTransaction::Postgres(tx) => tx.commit().await,
            DbTransaction::Mysql(tx) => tx.commit().await,
        }
    }

    pub async fn rollback(self) -> Result<(), sqlx::Error> {
        match self {
            DbTransaction::Postgres(tx) => tx.rollback().await,
            DbTransaction::Mysql(tx) => tx.rollback().await,
        }
    }
}

pub async fn create_pool(cfg: &Config) -> Result<DbPool, sqlx::Error> {
    match cfg.db_engine.as_str() {
        "postgresql" | "postgres" => {
            let pool = PgPoolOptions::new()
                .max_connections(20)
                .connect(&cfg.database_url)
                .await?;
            info!("✅ PostgreSQL pool created");
            Ok(DbPool::Postgres(pool))
        }
        "mysql" | "mariadb" => {
            let pool = MySqlPoolOptions::new()
                .max_connections(20)
                .connect(&cfg.database_url)
                .await?;
            info!("✅ MySQL pool created");
            Ok(DbPool::Mysql(pool))
        }
        other => Err(sqlx::Error::Configuration(
            format!("Unsupported DB_ENGINE: {}. Use 'postgresql' or 'mysql'", other).into(),
        )),
    }
}

pub async fn run_migrations(pool: &DbPool, engine: &str) -> Result<(), Box<dyn std::error::Error>> {
    match engine {
        "postgresql" | "postgres" => {
            if let DbPool::Postgres(_) = pool {
                // Migrations are applied manually via CLI or migration tool
                // To enable: add sqlx migrate files in ./migrations/postgres/
                info!("⚠️  Runtime migrations not enabled. Apply PostgreSQL migrations manually.");
            }
        }
        "mysql" | "mariadb" => {
            if let DbPool::Mysql(_) = pool {
                info!("⚠️  Runtime migrations not enabled. Apply MySQL migrations manually.");
            }
        }
        _ => {
            info!("⚠️  No migrations for engine: {}", engine);
        }
    }
    Ok(())
}

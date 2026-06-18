// Aqarati — Sharing Service
// WhatsApp template generation, share event logging

use sqlx::Row;
use uuid::Uuid;

use crate::db::DbPool;

#[derive(Debug)]
pub struct ShareEvent {
    pub id: Uuid,
    pub property_id: Uuid,
    pub user_id: Uuid,
    pub channel: String,
    pub template_id: Option<Uuid>,
    pub recipient_contact_id: Option<Uuid>,
    pub whatsapp_link: Option<String>,
    pub created_at: String,
}

pub struct SharingService;

impl SharingService {
    /// Generate a WhatsApp share link for a property
    pub fn generate_whatsapp_link(
        property_title: &str,
        property_city: Option<&str>,
        property_type: &str,
        purpose: &str,
        price: Option<f64>,
        area: Option<f64>,
        bedrooms: Option<i32>,
    ) -> String {
        let mut text = format!("🏠 *{}*", property_title);

        if let Some(city) = property_city {
            text.push_str(&format!("\n📍 {}", city));
        }

        let type_ar = match property_type {
            "apartment" => "شقة",
            "villa" => "فيلا",
            "land" => "أرض",
            "commercial" => "تجاري",
            "office" => "مكتب",
            "warehouse" => "مستودع",
            "farm" => "مزرعة",
            "floor" => "دور",
            "building" => "عمارة",
            "rest_house" => "استراحة",
            "shop" => "محل",
            _ => "عقار",
        };
        text.push_str(&format!("\n🏷 {}", type_ar));

        let purpose_ar = match purpose {
            "sale" => "للبيع",
            "rent" => "للإيجار",
            "investment" => "للاستثمار",
            _ => purpose,
        };
        text.push_str(&format!(" - {}", purpose_ar));

        if let Some(p) = price {
            text.push_str(&format!("\n💰 {} ريال", p as i64));
        }
        if let Some(a) = area {
            text.push_str(&format!("\n📐 {} م²", a));
        }
        if let Some(b) = bedrooms {
            text.push_str(&format!("\n🛏 {} غرف", b));
        }

        text.push_str("\n\n📲 *تطبيق عقاراتي*");

        let encoded = urlencoding(&text);
        format!("https://wa.me/?text={}", encoded)
    }

    /// Log a share event
    pub async fn log_share(
        pool: &DbPool,
        property_id: Uuid,
        user_id: Uuid,
        channel: &str,
        _recipient_phone: Option<&str>,
    ) -> Result<ShareEvent, String> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();

        let whatsapp_link = if channel == "whatsapp" {
            let prop = Self::get_property_summary(pool, property_id).await?;
            Some(Self::generate_whatsapp_link(
                &prop.title,
                prop.city.as_deref(),
                &prop.property_type,
                &prop.purpose,
                prop.price_amount,
                prop.area_sqm,
                prop.bedrooms,
            ))
        } else {
            None
        };

        match pool {
            DbPool::Postgres(p) => {
                sqlx::query(
                    "INSERT INTO share_events (id, property_id, user_id, channel) VALUES ($1, $2, $3, $4)"
                )
                .bind(id)
                .bind(property_id)
                .bind(user_id)
                .bind(channel)
                .execute(p)
                .await
                .map_err(|e| format!("Share log: {}", e))?;
            }
            DbPool::Mysql(p) => {
                sqlx::query(
                    "INSERT INTO share_events (id, property_id, user_id, channel) VALUES (?, ?, ?, ?)"
                )
                .bind(id.to_string())
                .bind(property_id.to_string())
                .bind(user_id.to_string())
                .bind(channel)
                .execute(p)
                .await
                .map_err(|e| format!("Share log: {}", e))?;
            }
        }

        Ok(ShareEvent {
            id,
            property_id,
            user_id,
            channel: channel.to_string(),
            template_id: None,
            recipient_contact_id: None,
            whatsapp_link,
            created_at: now.to_rfc3339(),
        })
    }

    /// Get share events for a property
    pub async fn get_share_events(
        pool: &DbPool,
        property_id: Uuid,
    ) -> Result<Vec<ShareEvent>, String> {
        match pool {
            DbPool::Postgres(p) => {
                let rows = sqlx::query(
                    "SELECT id, property_id, user_id, channel, template_id, recipient_contact_id, created_at \
                     FROM share_events WHERE property_id = $1 ORDER BY created_at DESC"
                )
                .bind(property_id)
                .fetch_all(p)
                .await
                .map_err(|e| format!("Share events: {}", e))?;

                Ok(rows.into_iter().map(|row| ShareEvent {
                    id: row.try_get("id").unwrap_or_default(),
                    property_id: row.try_get("property_id").unwrap_or_default(),
                    user_id: row.try_get("user_id").unwrap_or_default(),
                    channel: row.try_get("channel").unwrap_or_default(),
                    template_id: row.try_get("template_id").ok().flatten(),
                    recipient_contact_id: row.try_get("recipient_contact_id").ok().flatten(),
                    whatsapp_link: None,
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
            DbPool::Mysql(p) => {
                let rows = sqlx::query(
                    "SELECT id, property_id, user_id, channel, template_id, recipient_contact_id, created_at \
                     FROM share_events WHERE property_id = ? ORDER BY created_at DESC"
                )
                .bind(property_id.to_string())
                .fetch_all(p)
                .await
                .map_err(|e| format!("Share events: {}", e))?;

                Ok(rows.into_iter().map(|row| ShareEvent {
                    id: row.try_get("id").unwrap_or_default(),
                    property_id: row.try_get("property_id").unwrap_or_default(),
                    user_id: row.try_get("user_id").unwrap_or_default(),
                    channel: row.try_get("channel").unwrap_or_default(),
                    template_id: row.try_get("template_id").ok().flatten(),
                    recipient_contact_id: row.try_get("recipient_contact_id").ok().flatten(),
                    whatsapp_link: None,
                    created_at: row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                        .map(|d| d.to_rfc3339()).unwrap_or_default(),
                }).collect())
            }
        }
    }

    async fn get_property_summary(
        pool: &DbPool,
        property_id: Uuid,
    ) -> Result<PropertySummary, String> {
        match pool {
            DbPool::Postgres(p) => {
                let row = sqlx::query(
                    "SELECT p.title, p.property_type, p.purpose, pl.city, pp.price_amount, pd.area_sqm, pd.bedrooms \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.id = $1"
                )
                .bind(property_id)
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Property summary: {}", e))?
                .ok_or("Property not found")?;

                Ok(PropertySummary {
                    title: row.try_get("title").unwrap_or_default(),
                    property_type: row.try_get("property_type").unwrap_or_default(),
                    purpose: row.try_get("purpose").unwrap_or_default(),
                    city: row.try_get("city").ok(),
                    price_amount: row.try_get("price_amount").ok(),
                    area_sqm: row.try_get("area_sqm").ok(),
                    bedrooms: row.try_get("bedrooms").ok(),
                })
            }
            DbPool::Mysql(p) => {
                let row = sqlx::query(
                    "SELECT p.title, p.property_type, p.purpose, pl.city, pp.price_amount, pd.area_sqm, pd.bedrooms \
                     FROM properties p \
                     LEFT JOIN property_locations pl ON p.id = pl.property_id \
                     LEFT JOIN property_details pd ON p.id = pd.property_id \
                     LEFT JOIN LATERAL (SELECT price_amount FROM property_prices WHERE property_id = p.id ORDER BY valid_from DESC LIMIT 1) pp ON true \
                     WHERE p.id = ?"
                )
                .bind(property_id.to_string())
                .fetch_optional(p)
                .await
                .map_err(|e| format!("Property summary: {}", e))?
                .ok_or("Property not found")?;

                Ok(PropertySummary {
                    title: row.try_get("title").unwrap_or_default(),
                    property_type: row.try_get("property_type").unwrap_or_default(),
                    purpose: row.try_get("purpose").unwrap_or_default(),
                    city: row.try_get("city").ok(),
                    price_amount: row.try_get("price_amount").ok(),
                    area_sqm: row.try_get("area_sqm").ok(),
                    bedrooms: row.try_get("bedrooms").ok(),
                })
            }
        }
    }
}

struct PropertySummary {
    title: String,
    property_type: String,
    purpose: String,
    city: Option<String>,
    price_amount: Option<f64>,
    area_sqm: Option<f64>,
    bedrooms: Option<i32>,
}

/// Simple URL encoding for WhatsApp text
fn urlencoding(s: &str) -> String {
    let mut result = String::new();
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                result.push(b as char);
            }
            b' ' => result.push_str("%20"),
            b'\n' => result.push_str("%0A"),
            b'*' => result.push_str("%2A"),
            _ => {
                let hex = format!("%{:02X}", b);
                result.push_str(&hex);
            }
        }
    }
    result
}

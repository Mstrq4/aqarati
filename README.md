# عقاراتي | Aqarati

**دفتر عقاراتك الذكي** — Smart Property Notebook for Saudi Real Estate Agents.

أسرع طريقة لحفظ العروض العقارية ومشاركتها ومتابعتها، دون تعقيد CRM التقليدي.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Android/iOS/Huawei) |
| Backend API | Rust + Actix-Web + GraphQL |
| Admin Panel | React + Vite + TailwindCSS |
| Landing Page | Next.js 14 + TailwindCSS |
| Database | PostgreSQL + MySQL (configurable) |
| Storage | Local file system (S3-compatible ready) |

## 📁 Project Structure

```
aqarati/
├── backend/          # Rust GraphQL API
│   ├── src/
│   │   ├── api/      # GraphQL schema, resolvers, guards
│   │   ├── services/ # Business logic
│   │   └── config.rs # Configuration
│   └── migrations/   # PostgreSQL & MySQL migrations
├── mobile/           # React Native app
│   └── src/
│       ├── screens/  # App screens
│       ├── components/ # Reusable components
│       └── i18n/     # Translations (AR/EN)
├── admin/            # React admin panel
│   └── src/pages/    # Dashboard, Users, Plans, etc.
├── web/              # Next.js landing & SEO
├── shared/           # Shared types, theme, i18n
└── storage/          # File uploads directory
```

## ⚡ Quick Start

### Prerequisites
- Rust 1.75+
- Node.js 18+
- PostgreSQL 15+ or MySQL 8+

### Backend
```bash
cd backend
cp ../.env.example .env
# Edit .env with your database credentials
cargo run --release
# API runs at http://localhost:8000/graphql
```

### Mobile App
```bash
cd mobile
npm install
npx react-native start
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
```

### Landing Page
```bash
cd web
npm install
npm run dev
```

## 🌐 Deployment

### Vercel (Web + Admin)
1. Connect your GitHub repo to Vercel
2. Set framework to Next.js for /web
3. Set build directory to /admin for admin panel
4. Add environment variables

### Backend
Deploy to any VPS (Hetzner, DigitalOcean, etc.) or use Railway/Render:
```bash
cd backend
cargo build --release
./target/release/aqarati-backend
```

### Database
Connect to your Hostinger (or any PostgreSQL/MySQL) instance via `DATABASE_URL`.

## 📱 Features

- ⚡ Add property in < 60 seconds
- 📱 Instant WhatsApp sharing
- 🏢 Smart office with team permissions
- 🔍 Advanced search & filters
- 🌙 Dark/Light mode
- 🗣️ Full Arabic RTL + English support
- 🔒 Saudi compliance ready
- 💳 Multi-provider payment support (Mada, Apple Pay, STC Pay)

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

## 📄 License

Proprietary — All rights reserved.

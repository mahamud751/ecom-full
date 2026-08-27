# Cholbe — Premium Health & Beauty E-commerce

Full-stack online pharmacy / wellness store inspired by [Arogga](https://lab.arogga.com/web), built with **Next.js**, **Prisma**, and **PostgreSQL**.

## Features

- Premium green healthcare design (hero carousel, service cards, category grid)
- Product sections (Flash Sale, brand deals, featured)
- Category pages, search, product detail
- Cart (Zustand + localStorage) with slide-out drawer
- Checkout with Cash on Delivery / bKash demo
- Order API with stock validation & free delivery over ৳999
- Express delivery badges, discount %, star ratings
- **Doctor consultation system**
  - Live availability + weekly schedule slots
  - Instant or scheduled video/audio consults (Agora RTC)
  - Doctor portal: go online, join queue, write e-prescription
  - Patient: my consultations, join call, download/print Rx PDF

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), Tailwind CSS 4, Lucide icons |
| State | Zustand (cart) |
| Database | PostgreSQL + Prisma ORM |
| Images | Next.js Image + Unsplash |

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL running locally

### 2. Database

```bash
# Create DB (if needed)
createdb cholbe

# Configure connection in .env
DATABASE_URL="postgresql://USER@localhost:5432/cholbe?schema=public"
```

### 3. Install & seed

```bash
npm install
npm run db:setup    # prisma db push + seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Agora (video / audio)

Set in `.env`:

```env
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
```

**Patient flow:** `/doctors` → book video/audio → join call → get Rx PDF  
**Doctor flow:** `/doctor-portal` → go online → accept queue → call → write prescription

### 5. Admin portal (full ops)

Open [http://localhost:3000/admin](http://localhost:3000/admin)

| Login | Password | Role |
|-------|----------|------|
| `admin@cholbe.com` | `admin123` | SUPER_ADMIN |
| `ops@cholbe.com` | `ops123` | OPS |

**Modules:** Dashboard · Products + variants · Brands/Categories · Stock · Orders · Lab tests/packages · Vendors B2B · Riders/ops · Doctors

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:setup` | Push schema + seed data |
| `npm run db:seed` | Re-seed products |
| `npm run db:studio` | Prisma Studio (optional) |

## Project structure

```
src/
  app/                 # Pages & API routes
  components/
    layout/            # Header, Footer
    home/              # Hero, categories, services
    product/           # Cards, sections, add-to-cart
    cart/              # Cart drawer
  lib/                 # Prisma, cart store, utils
prisma/
  schema.prisma
  seed.ts
```

## Brand colors

- **Brand green**: `#00A86B`
- **Deep green**: `#006B45`
- **Accent orange**: `#FF6B35`
- **Background**: soft mint mesh `#F4F7F6`

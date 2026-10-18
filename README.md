# Ethiopia Arenguade Paper Product — Production Web Platform

A production-grade, full-stack web platform for **Ethiopia Arenguade Paper Product**, combining sustainable packaging e-commerce, custom packaging design dieline submissions, vocational bag-making academy workshops (both in-person and live online via LiveKit), and an executive administrative operations console.

---

## 🔐 Seed User Accounts & Clearance Matrix

All seed accounts are initialized with pre-verified email addresses in `auth.users` and linked records in `public.profiles`.

| Role | Name | Email | Password | Primary Destination | Permissions |
|---|---|---|---|---|---|
| **Admin** | Abebe Admin (Owner) | `admin@arenguade.com` | `Password123!` | `/admin` | Complete factory control: payment verification, order pipeline, pricing, class scheduling, user governance, audit ledger |
| **Teacher** | Tigist Tadesse | `teacher.tigist@arenguade.com` | `Password123!` | `/teacher` | Host LiveKit live studio, manage assigned session rosters, mark student attendance |
| **Teacher** | Dawit Haile | `teacher.dawit@arenguade.com` | `Password123!` | `/teacher` | Host assigned live workshops, view class registrations |
| **Customer** | Selam Kebede | `customer.selam@gmail.com` | `Password123!` | `/dashboard` | Order products, upload bank receipts, submit dieline designs, book vocational workshops |
| **Customer** | Tariku Alemu | `customer.tariku@gmail.com` | `Password123!` | `/dashboard` | Place custom packaging orders, participate in workshops |
| **Customer** | Helen Berhanu | `customer.helen@gmail.com` | `Password123!` | `/dashboard` | Place packaging orders, track deliveries |

---

## 🛠️ Tech Stack & System Architecture

- **Frontend**: Next.js 16.3.4 (App Router, Turbopack, React 19), Tailwind CSS, Framer Motion
- **3D Visualization**: React Three Fiber + `@react-three/drei` (Interactive 3D paper bag model, offline procedural shaders)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) on all 11 tables, `@supabase/ssr` server cookie sessions
- **Storage**: Supabase Storage (`product-images`, `payment-proofs`, `designs`) with 15-minute short-lived signed URLs for receipts
- **Realtime**: Supabase Realtime Channels (`postgres_changes` on `notifications` with `REPLICA IDENTITY FULL`)
- **Live Video Streaming**: LiveKit Cloud (`livekit-server-sdk`, `@livekit/components-react`) with strict Host/Viewer privilege minting
- **Validation & Rate Limiting**: Zod schemas, in-memory IP token-bucket rate limiter with HTTP 429 headers

---

## 🚀 Local Development Quickstart

### 1. Prerequisites
- Node.js 20+ (Node 22 / 24 supported)
- npm 10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env.local` in the project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres.<your-project>:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<your-project>:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# LiveKit WebRTC Configuration
LIVEKIT_URL=wss://<your-subdomain>.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://<your-subdomain>.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...
```

### 4. Database Setup & Seeding
```bash
# Apply PostgreSQL schema migrations & stored procedures
node scripts/run-migration.js

# Seed initial database records (products, workshops, bank accounts, seed users)
npm run seed
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Quality Assurance

Run the comprehensive Playwright end-to-end test suites:

```bash
# Run all end-to-end scenarios (Phases 1 through 9)
npx playwright test

# Run the 11 Master Specification Workflows
npx playwright test tests/e2e/master-flows.spec.ts

# Run Phase 9: Realtime Notifications, Audit Log & Admin Metrics
npx playwright test tests/e2e/phase9-notifications-admin.spec.ts

# Run Phase 8: Custom Designs & Quotations
npx playwright test tests/e2e/phase8-designs.spec.ts

# Run Phase 7: LiveKit WebRTC Host/Student Privileges
npx playwright test tests/e2e/phase7-livekit.spec.ts

# Run Phase 6: Workshop Capacity & Class Registration
npx playwright test tests/e2e/phase6-classes.spec.ts
```

---

## 🚢 Production Deployment Guide

### 1. Supabase (Database, Auth, Storage)
1. Create a new Supabase project in the desired AWS region.
2. In the Supabase SQL Editor, run [`scripts/run-migration.js`](file:///c:/Users/us/greenwork/scripts/run-migration.js) or execute the schema definitions:
   - Tables: `profiles`, `products`, `bank_accounts`, `orders`, `order_items`, `order_status_history`, `designs`, `class_sessions`, `enrollments`, `notifications`, `audit_log`, `settings`.
   - Stored Procedure: `register_for_session_atomic` (enforces row-level capacity locking).
   - Realtime Publication: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications, public.orders, public.enrollments;`
   - Replica Identity: `ALTER TABLE public.notifications REPLICA IDENTITY FULL;`
3. In Supabase Storage, create three storage buckets:
   - `product-images` (Public)
   - `payment-proofs` (Private)
   - `designs` (Private)
4. Run `npm run seed` to initialize baseline data and admin credentials.

### 2. LiveKit Cloud (Video Streaming)
1. Sign up at [cloud.livekit.io](https://cloud.livekit.io) and create a project.
2. Under **Project Settings > Keys**, generate an **API Key** and **API Secret**.
3. Copy the WebSocket URL (`wss://<subdomain>.livekit.cloud`).
4. (Optional) Set webhook receiver in LiveKit Cloud to `https://<your-domain>/api/livekit/webhook`.

### 3. Vercel (Next.js App Deployment)
1. Import repository into Vercel.
2. Framework Preset: **Next.js**.
3. In **Settings > Environment Variables**, configure all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `LIVEKIT_URL`
   - `NEXT_PUBLIC_LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
4. Deploy. Verify that Edge middleware (`src/proxy.ts`) functions properly on custom domain.

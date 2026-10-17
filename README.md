# Ethiopia Arenguade Paper Product

Enterprise e-commerce, custom packaging design, and interactive live learning platform for Ethiopia Arenguade Paper Product.

---

## 🔐 Seed User Credentials

| Role | Name | Email | Password | Primary Portal |
|---|---|---|---|---|
| **Admin** | Abebe Admin (Owner) | `admin@arenguade.com` | `Password123!` | `/admin` |
| **Teacher** | Tigist Tadesse | `teacher.tigist@arenguade.com` | `Password123!` | `/teacher` |
| **Teacher** | Dawit Haile | `teacher.dawit@arenguade.com` | `Password123!` | `/teacher` |
| **Customer** | Selam Kebede | `customer.selam@gmail.com` | `Password123!` | `/dashboard` |
| **Customer** | Tariku Alemu | `customer.tariku@gmail.com` | `Password123!` | `/dashboard` |
| **Customer** | Helen Berhanu | `customer.helen@gmail.com` | `Password123!` | `/dashboard` |

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Verify `.env.local` contains valid Supabase and LiveKit credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DIRECT_URL=postgresql://...
DATABASE_URL=postgresql://...
LIVEKIT_URL=wss://...
NEXT_PUBLIC_LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

### 3. Database Migration & Seeding
```bash
# Run PostgreSQL master schema migration
node scripts/run-migration.js

# Seed users, products, classes, bank accounts, and orders
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Run Automated Tests
```bash
npx playwright test
```

---

## 🛡️ Architecture & Security
- **Strict Role-Based Routing**: Next.js Edge Middleware enforces `/admin/*` (admin only), `/teacher/*` (teacher & admin), and `/dashboard/*` (authenticated customer/users).
- **Server Authorization Helpers**: `requireRole(['admin'])` and `requireUser()` in server actions and API routes.
- **Row Level Security (RLS)**: Enforced across all PostgreSQL tables.
- **Atomic Capacity RPC**: Prevents overbooking on class enrollments with `register_for_session`.
- **LiveKit Server Gating**: Host-only endpoints for room creation, participant mute, speaking grant/revoke, and session termination.

# Master Execution Plan: Ethiopia Arenguade Paper Product
## Real Data, Strict Server Permissions, Realtime Workflows & Full Role Matrix

---

### 1. Architecture & Design Principles
- **Keep Existing Visual Design & 3D Hero**: Preserve the landing page, 3D Canvas, CSS styling, and layouts without regression.
- **Zero Mock / Zero LocalStorage Fakes**: Eliminate mock arrays, local storage database shims, and placeholder functions. Everything persists in and syncs with Supabase PostgreSQL and Storage.
- **Defense in Depth**:
  1. PostgreSQL Row Level Security (RLS) on every table.
  2. Role checks in every server action / API route (`requireRole`, `requireUser`).
  3. Edge Next.js Middleware route guards (`/dashboard/*`, `/teacher/*`, `/admin/*`).
- **Four Actors**: `visitor`, `customer`, `teacher`, `admin`.

---

### 2. Implementation Phases & Milestones

1. **Phase 0 — Full Codebase Audit & Database Migrations** (`AUDIT.md`, `/supabase/migrations/`)
2. **Phase 1 — Authentication, Roles, Middleware & Seeding** (`npm run seed`)
3. **Phase 2 — Admin Shell, Users, Bank Accounts & Site Settings**
4. **Phase 3 — Products Management & DB-Driven Landing Page**
5. **Phase 4 — Product Ordering (W2), Checkout & Payments Verification**
6. **Phase 5 — Class Registration (W4) & Capacity RPC**
7. **Phase 6 — Live Sessions with LiveKit (W6)**
8. **Phase 7 — Custom Design Submissions (W3)**
9. **Phase 8 — Attendance (W5), Notifications (W8) & Audit Log**
10. **Phase 9 — Automated Playwright Tests**
11. **Phase 10 — Browser Verification & Reports** (`DECISIONS.md`, `VERIFICATION.md`)

# Full Codebase Audit (Phase 0)
## Ethiopia Arenguade Paper Product

Date of Audit: October 17, 2026

---

## 1. Summary of Audit Findings
- **Data Layer**: High reliance on `DataStore.ts` (localStorage + in-memory mock fallback) and `userStore.ts` (local filesystem JSON + PBKDF2), completely bypassing Supabase PostgreSQL database tables and RLS security.
- **Role & Permissions**: Security is currently client-side or cosmetic; `/admin` routes do not have proper Next.js middleware protection; teacher role is missing; host controls in live sessions are not gated by server-verified host privileges.
- **Database Schema**: Several tables required by Section 4 are completely missing (`order_items`, `order_status_history`, `enrollments`, `notifications`, `audit_log`, `settings`), and existing tables lack required columns, enums, triggers, and foreign keys.
- **Storage**: Payment proofs and designs were stored without private signed URL access control and lack strict server-side validation.

---

## 2. Page & Route Audit

| Page / Route | Component / Path | Status | Notes / Issues |
|---|---|---|---|
| `/` | `src/app/page.tsx` | `MOCK DATA` | 3D bag works; stats and products use hardcoded/mock fallbacks; newsletter form does not persist |
| `/products` | `src/app/products/page.tsx` | `MOCK DATA` | Reads from `DataStore.getProducts()` with mock array fallback; cart uses unauthenticated localStorage |
| `/products/[id]` | `src/app/products/[id]/page.tsx` | `MOCK DATA` | Checkout uses `DataStore.addOrder()` into localStorage; prices not verified on server |
| `/design-submission` | `src/app/design-submission/page.tsx` | `UI-ONLY` | Form submits to `DataStore.addDesign()`; no quote flow, no order conversion |
| `/learn` | `src/app/learn/page.tsx` | `UI-ONLY` | Static marketing cards; links to schedule |
| `/learn/schedule` | `src/app/learn/schedule/page.tsx` | `MOCK DATA` | Classes loaded from mock `DEFAULT_CLASSES`; registration creates mock registration, no atomic capacity RPC |
| `/portfolio` | `src/app/portfolio/page.tsx` | `WORKING` | Static showcase of past client packaging; visual display works as intended |
| `/login` | `src/app/login/page.tsx` | `BROKEN` | Authenticates against `data/users.json` instead of Supabase Auth; stores session in `localStorage.arenguade_user` |
| `/signup` | `src/app/signup/page.tsx` | `BROKEN` | Allows client-specified role; writes to `data/users.json`; doesn't trigger Supabase Auth session |
| `/dashboard` | `src/app/dashboard/page.tsx` | `MOCK DATA` | Shows mock orders/classes from `DataStore`; cancel button is a placeholder |
| `/dashboard/orders/[id]` | *Missing* | `BROKEN` | Detailed timeline page with cancellation capability does not exist |
| `/dashboard/sessions/[id]` | `src/app/dashboard/sessions/[id]/page.tsx` | `BROKEN` | Student sees full host controls (mute/kick/end session); token generation doesn't enforce enrollment approval |
| `/admin` | `src/app/admin/page.tsx` | `MOCK DATA` | Metric counters read from localStorage; no real revenue or audit log |
| `/admin/payments` | *Missing* | `BROKEN` | Unified verification queue (Orders & Class Enrollments) with zoomable proof viewer is completely missing |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | `UI-ONLY` | Table reads from `DataStore`; status updates do not create `order_status_history` or notify customer |
| `/admin/products` | `src/app/admin/products/page.tsx` | `UI-ONLY` | Product CRUD interacts with `DataStore` rather than Supabase storage and `products` table |
| `/admin/classes` | `src/app/admin/classes/page.tsx` | `UI-ONLY` | Class sessions stored in localStorage; teacher assignment dropdown is static text |
| `/admin/designs` | `src/app/admin/designs/page.tsx` | `UI-ONLY` | Reads from `DataStore`; no quoting mechanism, no order conversion |
| `/admin/bank-accounts` | `src/app/admin/bank-accounts/page.tsx` | `UI-ONLY` | Reads/writes to `DataStore` localStorage |
| `/admin/users` | `src/app/admin/users/page.tsx` | `BROKEN` | Modifies `data/users.json` on local filesystem; no interaction with `auth.users` or `profiles` |
| `/admin/settings` | *Missing* | `BROKEN` | Company info settings page is missing |
| `/teacher` | *Missing* | `BROKEN` | Teacher portal home page is missing |
| `/teacher/classes/[id]` | *Missing* | `BROKEN` | Teacher attendance taking page is missing |
| `/teacher/live/[id]` | *Missing* | `BROKEN` | Teacher LiveKit host room with moderation controls is missing |

---

## 3. API Routes Audit

| API Route | Method | Status | Notes / Issues |
|---|---|---|---|
| `/api/auth/login` | POST | `BROKEN` | Validates against `data/users.json` instead of Supabase Auth |
| `/api/auth/signup` | POST | `BROKEN` | Custom PBKDF2 hash stored in JSON file; does not establish real Supabase session |
| `/api/admin/users` | GET, POST, PATCH | `BROKEN` | Edits `data/users.json` without verifying server-side admin role or updating Supabase |
| `/api/orders` | GET, POST | `BROKEN` | No role verification; doesn't calculate price from DB; doesn't create `order_items` |
| `/api/registrations` | GET, POST | `BROKEN` | Inserts into deprecated `session_registrations` without capacity RPC or server auth |
| `/api/livekit/token` | POST | `BROKEN` | Does not verify enrollment or host role; grants publish privileges to everyone |
| `/api/live/[sessionId]/start` | POST | `BROKEN` | Missing |
| `/api/live/[sessionId]/token` | POST | `BROKEN` | Missing |
| `/api/live/[sessionId]/permissions` | POST | `BROKEN` | Missing |
| `/api/live/[sessionId]/mute` | POST | `BROKEN` | Missing |
| `/api/live/[sessionId]/remove` | POST | `BROKEN` | Missing |
| `/api/live/[sessionId]/end` | POST | `BROKEN` | Missing |
| `/api/livekit/webhook` | POST | `BROKEN` | Missing |

---

## 4. Remediation Plan
1. **Database Schema & Migrations**: Apply comprehensive SQL schema via PostgreSQL connection pooler creating all required tables, enums, triggers, RLS policies, and atomic RPC functions.
2. **Server Auth & Middleware**: Replace `proxy.ts` with standard Next.js `middleware.ts`, implement `requireRole()` and `requireUser()`, configure Supabase SSR cookie authentication.
3. **Seed Database**: Run automated seed script to populate realistic users, products, classes, and bank accounts.
4. **Wire End-to-End Workflows**:
   - W1: Real Supabase Auth & role redirection.
   - W2: Cart, checkout with DB pricing, proof upload, `/admin/payments` approval/rejection, order status timeline.
   - W3: Custom designs with quote & order conversion.
   - W4: Atomic class registration, capacity safety, approval queue.
   - W5: In-person attendance on `/teacher/classes/[id]`.
   - W6: Host LiveKit room (`/teacher/live/[id]`) and viewer-only student room (`/dashboard/live/[id]`).
   - W7: Admin management (Users, Products, Classes, Bank Accounts, Settings, Payments).
   - W8: Realtime in-app notifications & audit logging.
5. **Automated Testing & Browser Verification**: Run Playwright suite and browser testing across all 4 roles.

# Architecture Decisions & Engineering Log (DECISIONS.md)
## Ethiopia Arenguade Paper Product

**Date:** October 17, 2026  
**Implementation:** MASTER PROMPT v2 — Production Database, Defense-in-Depth Security, Real LiveKit Cloud, & Complete Workflow Wiring

---

## 1. Context & Objectives
The application previously featured an attractive 3D landing page and marketing UI, but was backed entirely by mock memory arrays (`DataStore.ts`) and a local JSON file (`data/users.json`). The goal of this task was to completely wire every feature, permission, and role to real Supabase PostgreSQL, edge middleware, secure storage buckets, atomic capacity RPCs, and LiveKit Cloud WebRTC streaming—while preserving 100% of the visual layout and 3D landing canvas.

---

## 2. Key Architecture Decisions

### Decision 1: Next.js 16.3.4 Dynamic Parameters & Cookie Handling
- **Context:** Next.js 16.3.4 App Router requires that all route parameters (`params`), search parameters (`searchParams`), and server cookies (`cookies()`) be asynchronously resolved (`await params`).
- **Implementation:** All dynamic routes (e.g. `/api/orders/[id]`, `/api/products/[id]`, `/api/classes/[id]`, `/api/live/[sessionId]/start`, etc.) and client pages with Promise-based params (`use(params)`) strictly `await` the resolved parameters.
- **Trade-off:** Eliminates React 19 hydration mismatches and Next.js 16 warnings.

### Decision 2: Defense-in-Depth (RLS + Server Helpers + Edge Middleware)
- **Context:** Client-side role checking alone is insecure.
- **Implementation:**
  1. **Edge Middleware (`src/middleware.ts`):** Evaluates Supabase session and user role at the edge. Visitors and unauthorized roles are immediately redirected before page rendering. Inactive users (`is_active = false`) are redirected to `/login?error=account_deactivated`.
  2. **Server Helpers (`src/utils/roles.ts`):** `requireUser()` and `requireRole(['admin', 'teacher'])` run on every sensitive API route, verifying the caller against `public.profiles`.
  3. **Row Level Security (PostgreSQL):** RLS policies are enabled on all 11 tables (`profiles`, `products`, `bank_accounts`, `orders`, `order_items`, `order_status_history`, `designs`, `class_sessions`, `enrollments`, `notifications`, `audit_log`).
  4. **Self-Escalation DB Trigger:** Database trigger `trg_prevent_role_escalation` on `public.profiles` prevents non-admin callers from modifying their own `role` column via SQL or REST.

### Decision 3: Atomic Workshop Capacity Management via PostgreSQL Stored Procedure
- **Context:** Concurrent student registrations could cause race conditions where class sessions exceed their specified maximum capacity.
- **Implementation:** Built stored procedure `register_for_session_atomic` in PostgreSQL that executes within a transaction with `FOR UPDATE` row-level locking on `class_sessions`. If `active_count >= session_capacity`, it raises an exception and rejects the registration with an immediate HTTP 400 response.
- **Result:** 100% mathematically safe capacity allocation under high concurrency.

### Decision 4: LiveKit WebRTC Cloud Architecture & Host-Viewer Separation
- **Context:** Live workshops required low-latency video streaming with strict role differentiation.
- **Implementation:**
  1. Dedicated LiveKit Cloud integration (`wss://green-live-hhlll1sw.livekit.cloud`) using `livekit-server-sdk` and `@livekit/components-react`.
  2. Server endpoint `POST /api/live/[sessionId]/start` checks teacher/admin assignment, ensures room existence on LiveKit Cloud, updates `status = 'live'`, and notifies confirmed students.
  3. Server endpoint `POST /api/live/[sessionId]/token` verifies role and payment confirmation:
     - Teacher/Admin: `canPublish: true`, `roomAdmin: true`.
     - Student (must have confirmed enrollment): `canPublish: false` (viewer only), `roomAdmin: false`.
  4. Moderation endpoints allow the host to dynamically grant/revoke speaking permissions (`updateParticipant`), mute tracks (`mutePublishedTrack`), and remove disruptive participants (`removeParticipant`).
  5. Student view features a "Raise Hand" queue emitted over LiveKit DataChannel.

### Decision 5: Unified Payment Verification Queue
- **Context:** Admins previously had scattered screens for orders and registrations.
- **Implementation:** Created `/admin/payments`, a unified queue displaying both retail orders and class enrollments awaiting verification. Includes short-lived signed URLs for private receipts (`payment-proofs` bucket), modal zoom, and a mandatory rejection reason modal that records the reason and notifies the customer in real time.

### Decision 6: Price Snapshotting & Server-Side Pricing
- **Context:** Clients could previously manipulate unit prices in client-side requests.
- **Implementation:** All order totals are calculated exclusively on the server from the `products` table. Unit prices are frozen into `order_items.unit_price_snapshot` at the exact moment of order placement. Historical product price changes never alter past order records.

---

## 3. Database Schema Overview
- `profiles`: Synced with `auth.users` via trigger; stores full name, email, phone, role (`customer`, `teacher`, `admin`), active status.
- `products`: Product catalog with name, description, price, GSM, dimensions, images array, stock, and availability.
- `bank_accounts`: Supported settlement channels (CBE, Telebirr, Awash) with instructions and active toggles.
- `orders`: Master orders with buyer ID, order number, total price, status, delivery address, phone, and payment proof path.
- `order_items`: Snapshots of ordered products and frozen unit prices.
- `order_status_history`: Complete audit trail of every status advancement, actor, and note.
- `designs`: Custom packaging requests with dimensions, paper specs, quoted price, and approval workflow.
- `class_sessions`: Vocational workshop sessions (in-person studio or LiveKit online) with capacity, schedule, and room name.
- `enrollments`: Student registration records with payment proof, confirmed status, and teacher attendance tracking.
- `notifications`: Real-time alerts for customers and administrators.
- `audit_log`: System-wide audit trail of all administrative and status operations.
- `settings`: Company profile and settlement configuration.

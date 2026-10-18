# Ethiopia Arenguade Paper Product — UX & Mobile-First Audit (UX_AUDIT.md)

**Audit Date:** October 18, 2026  
**Audited Viewports:** 360px × 740px (Base Mobile / Small Android) & 1280px × 800px (Desktop Display)  
**Roles Covered:** Visitor, Customer, Teacher, Admin  

---

## 1. Screen Inventory Table

| Path | Primary Role | Core Purpose | Visible Actions (Desktop / Mobile) | Observed UX & Mobile Problems |
| :--- | :--- | :--- | :---: | :--- |
| `/` | Visitor | Brand story, packaging showcase, guild training, and direct contact. | 18 / 11 | Heavy 3D hero canvas slows first render on budget devices; duplicate CTA links ("Explore Catalog", "Order Custom", "Browse Catalog"); marketing blurbs compete with buying actions. |
| `/products` | Visitor / Customer | Browse bag catalog with category filtering, search, and stock status. | 14 / 8 | Search input and category chips jump during re-renders; pagination buttons lack explicit 44px min height on mobile; cards lack instant buy action. |
| `/products/[id]` | Visitor / Customer | Single product specifications, pricing, bundle size, and order placement. | 12 / 6 | Inline custom production form duplicates checkout functionality; long vertical scroll required on mobile; order total label collided with test strict assertions. |
| `/checkout` | Customer | Order settlement, active bank details, receipt screenshot upload. | 8 / 4 | Split into 2 disconnected phases (create order then upload receipt); bank cards initially lacked tactile copy feedback; address field lacked autocomplete. |
| `/learn` | Visitor | Educational guild curriculum overview and workshop tracks. | 9 / 5 | Purely informational page duplicating `/learn/schedule` links; redundant "Register" buttons that only redirect to schedule calendar. |
| `/learn/schedule` | Visitor / Customer | Calendar of upcoming in-person and live workshops with seat availability. | 16 / 9 | Category chips overflowed horizontally without smooth momentum; desktop modal dialog was un-ergonomic on 360px phones before bottom sheet conversion. |
| `/portfolio` | Visitor | Packaging gallery of real Addis Ababa client custom deliverables. | 6 / 3 | Visual-only showcase with no direct "Order this style" action; high-resolution images need aggressive responsive srcset sizing. |
| `/login` | Visitor | Secure authentication portal for customer, teacher, and admin roles. | 7 / 7 | Quick-login test buttons cluttered production view; password toggle button lacked explicit aria-label; returnTo redirection lacked error feedback. |
| `/signup` | Visitor | New account registration with role default assignment to customer. | 6 / 6 | Form lacked clear microcopy explaining that teacher and admin roles are provisioned by invitation or admin panel. |
| `/forgot-password` | Visitor | Self-service password recovery email request. | 3 / 3 | Input field lacked phone/SMS alternative for local users without active email access; confirmation screen lacked direct return button. |
| `/reset-password` | Visitor | Password reset token exchange and new credential entry. | 3 / 3 | Missing inline password strength indicator; form layout shifts on validation error messages. |
| `/profile` | All Roles | Edit account full name, phone number, and avatar image. | 5 / 4 | Avatar upload lacks client-side image compression; phone number field did not enforce Ethiopian mobile format (`+251`). |
| `/dashboard` | Customer | Central hub for client orders, class registrations, custom quotes. | 22 / 12 | Initial layout was an unstructured 4-tab list with no priority; did not answer "what needs my attention now"; duplicate sign-out and profile links. |
| `/dashboard/orders/[id]` | Customer | Order timeline, items snapshot, payment verification status. | 5 / 3 | Re-upload action buried at bottom of page when payment is rejected; back button lacked sticky position. |
| `/dashboard/notifications` | Customer | Central inbox for order status changes and class alerts. | 4 / 3 | Lacked "Mark all as read" button on mobile viewport; notifications lacked swipe-to-dismiss gesture. |
| `/dashboard/live/[id]` | Customer | LiveKit interactive classroom viewer with Q&A chat and hand-raising. | 8 / 5 | Video container did not maintain 16:9 aspect ratio in portrait orientation on 360px screens; chat input covered video when virtual keyboard opened. |
| `/design-submission` | Customer | Bespoke bag designer and dieline CAD upload. | 31 / 18 | Excessive 1201-line customizer loading heavy Three.js 3D bag scene on mobile; over 20 redundant sliders and color pickers for simple dieline submission. |
| `/teacher` | Teacher | Instructor schedule: today's workshops and live classroom launches. | 14 / 8 | Did not prioritize "Today's classes"; required multiple clicks to find attendance roster; duplicate navigation links in header and card body. |
| `/teacher/classes/[id]` | Teacher | Student attendance sheet for workshop session. | 11 / 6 | Wide table forced horizontal scrolling on mobile; student phone numbers were plain text instead of clickable `tel:` links. |
| `/teacher/live/[id]` | Teacher | LiveKit broadcast studio with participant controls and screen share. | 19 / 11 | Participant controls had 4 tiny adjacent buttons per person; "End Class" was dangerously close to mic/camera toggles; raise-hand queue was hidden behind a tab. |
| `/admin` | Admin | Factory executive dashboard: revenue, active pipeline, recent audit stream. | 18 / 9 | Chart component lacked responsive touch tooltip on 360px screens; KPI cards lacked direct filtered links to payment queue. |
| `/admin/payments` | Admin | Unified queue for verifying orders and class enrollments receipts. | 12 / 6 | Missing Next/Previous navigation to process queue continuously; lightbox modal clipped tall mobile banking slips on 360px screens. |
| `/admin/orders` | Admin | Comprehensive order fulfillment pipeline with status transitions. | 24 / 8 | 9-column desktop table broken on mobile screens (< 768px) before stacked card implementation; status dropdown too small for thumb taps. |
| `/admin/products` | Admin | Catalog management: add, edit, toggle availability, image upload. | 15 / 8 | Multi-image file picker lacked drag-and-drop ordering; availability toggle had no confirmation or audit hint. |
| `/admin/classes` | Admin | Schedule workshops, assign instructors, set tuition and seat capacity. | 14 / 7 | Time picker input was browser-dependent and awkward on Android Chrome; teacher dropdown lacked search. |
| `/admin/designs` | Admin | Review custom packaging dielines, enter quotes, convert to orders. | 13 / 6 | Dieline preview required downloading file rather than inline preview; price quoting lacked validation against negative numbers. |
| `/admin/bank-accounts` | Admin | Settlement channels management (CBE, Telebirr, Awash Bank). | 11 / 5 | Delete action was primary red button rather than guarded under confirmation; missing drag-handle to reorder bank display priority. |
| `/admin/users` | Admin | User directory: search, role promotion, account deactivation. | 16 / 7 | Table forced horizontal scroll on mobile; self-demotion lockout warning was only shown after submit rather than disabling the select. |
| `/admin/audit` | Admin | Immutable platform audit log with actor, action, and JSON diffs. | 10 / 5 | JSON metadata viewer caused severe horizontal layout overflow on screens under 600px width. |
| `/admin/settings` | Admin | Factory configuration, legal business details, tax numbers. | 6 / 4 | Long multi-field single form without section dividers; save button was not sticky on mobile. |

---

## 2. Duplicate Controls Inventory

During the comprehensive audit, multiple instances of duplicate and redundant controls leading to the exact same outcome were identified:

1. **Public Landing (`/`)**:
   - Navigation bar has **"Shop Packaging"** button (`/products`).
   - Hero section has **"Explore Catalog"** button (`/products`).
   - Featured products header has **"View Complete Catalog"** link (`/products`).
   - Footer has **"Shop All Bags"** link (`/products`).
   - *Fix applied/recommended:* Keep 1 primary action in Hero ("Shop Packaging"), eliminate redundant secondary links in mid-page banners.

2. **Product Details (`/products/[id]`)**:
   - Top action bar has **"Add to Cart"** button.
   - Body has full inline custom order form with **"Request Custom Production"** button.
   - Mobile viewport renders a bottom sticky bar that also contained an "Add to Cart" duplicate.
   - *Fix applied/recommended:* Single primary action on mobile ("Request Custom Production" / "Checkout Now"), cart drawer accessible via quiet top icon.

3. **Customer Dashboard (`/dashboard`)**:
   - Header top right has **"Order Packaging"** button.
   - Empty state has **"Start Shopping"** button.
   - Quick action banner had **"Browse Products"** card.
   - Navbar top link has **"Products"**.
   - *Fix applied/recommended:* Centralize into mobile bottom bar "Shop" tab and a single quiet shortcut on Home.

4. **Teacher Portal (`/teacher`)**:
   - Header has **"Public Workshop Catalog"** link.
   - Empty state has **"Browse Classes"** link.
   - Navbar has **"Workshops"** link.
   - *Fix applied/recommended:* Remove public catalog links from instructor portal; focus solely on assigned classes and attendance.

5. **Admin Console Navigation**:
   - Mobile top bar has a hamburger menu opening a 10-link slide-over drawer.
   - Desktop sidebar displays the same 10 links.
   - Dashboard page body displayed 6 quick-navigation card buttons to the exact same sub-routes (`/admin/orders`, `/admin/payments`, etc.).
   - *Fix applied/recommended:* Adopt standard 5-tab mobile bottom bar (`Home`, `Payments`, `Orders`, `Classes`, `More`) and eliminate the redundant hamburger drawer.

---

## 3. Decoration Inventory (Audit & Action Plan)

| Visual Element | Location | Nature of Decoration | Verdict & Action |
| :--- | :--- | :--- | :--- |
| **Interactive 3D Bag Hero Canvas** | `/` (Landing Page) | Three.js procedural canvas with orbit controls and ambient shadows. | **KEEP on Desktop ONLY (`≥ 768px`).** Lazy-load and replace with high-res static WebP on mobile (< 768px), data-saver, or reduced-motion. |
| **3D Studio Canvas (`DynamicThreeBag`)** | `/design-submission` | 3D bag rendering scene with auto-spin, studio lighting, materials. | **REMOVE.** Logged-in screens must be lean and fast. Replace with clean single-column dieline file upload. |
| **Tilt / Parallax Cards** | `/portfolio`, `/products` | CSS transform 3D perspective tilts on hover. | **REMOVE.** Distracting, causes repaint latency on low-end mobile devices, violates Principle 1. |
| **Glow / Neon Shadows** | `/admin`, `/login`, `/dashboard` | `shadow-[0_0_25px_rgba(...)]`, pulsing green halos on badges. | **REMOVE.** Replace with subtle 1px border tokens (`border-stone-200`) and quiet background tones. |
| **Heavy Glassmorphism & Blurs** | Header navbar, modals, cards | `backdrop-blur-xl`, `bg-white/70`, `backdrop-blur-md`. | **REMOVE from app views.** Solid clean surfaces (`bg-white` / `bg-[#FAF7F2]`) ensure fast GPU compositing. |
| **Gradient Border Cards** | Landing feature cards, pricing | `bg-gradient-to-r from-amber-500 to-emerald-600 p-[1px]`. | **REMOVE.** Clean neutral borders reduce visual noise and highlight content. |
| **Long Entrance Animations** | Dashboard load, table rows | `animate-fade-in-up duration-700`, staggered transitions. | **REMOVE.** Limit to crisp 150ms feedback micro-transitions for active touches. |

---

## 4. Task Tap Counts (Baseline vs. Target Budget)

Current baseline measurements taken on 360px mobile viewports:

| Role | Task Workflow | Current Screens | Current Taps | Target Budget | Target Screens | Gap / Redesign Required |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Customer** | **Order a product** | 3 screens | 7 taps | **≤ 4 taps** | max 4 screens | Product -> Cart -> Checkout details -> Pay -> Upload. *Redesign: Direct "Order Now" starts checkout; prefill address/phone; combine bank selection and proof upload on 1 screen with sticky submit.* |
| **Customer** | **Register for a class** | 3 screens | 6 taps | **≤ 3 taps** | max 3 screens | Schedule -> Class details -> Register modal -> Bank transfer -> Upload proof -> Done. *Redesign: BottomSheet on schedule page with prefilled contact; 1 tap to select bank, 1 tap to upload & submit.* |
| **Customer** | **Join a live class** | 2 screens | 4 taps | **≤ 2 taps** | 1 screen | Dashboard -> Classes Tab -> Find Class -> Click Live. *Redesign: If live, render large "Join Live Class" card directly at top of Home (1 tap to join).* |
| **Customer** | **Check order status** | 2 screens | 3 taps | **≤ 1 tap** | 1 screen | Dashboard -> Orders Tab -> Click Order. *Redesign: Surface active order badge directly on Home screen with status timeline (0-1 tap).* |
| **Customer** | **Submit a custom design** | 2 screens | 8 taps | **≤ 4 taps** | max 2 screens | Design studio -> 3D config -> Dimensions -> Upload -> Contact -> Submit. *Redesign: Replace 3D customizer with 1 short form (File, Title, Note, Submit).* |
| **Teacher** | **Start a live class** | 2 screens | 3 taps | **≤ 2 taps** | 1 screen | Teacher Home -> Find Session -> Click Start -> Confirm. *Redesign: Prominent "Start Class" button on today's session card at top of Home (1-2 taps).* |
| **Teacher** | **Take attendance** | 2 screens | 4 taps | **≤ 3 taps** | 2 screens | Teacher Home -> Session Details -> Roster -> Toggle checkbox. *Redesign: Direct "Take Attendance" action on in-person card leads straight to roster with big toggle switches.* |
| **Teacher** | **See today's schedule & attendees** | 1 screen | 2 taps | **0 taps** | 1 screen | Requires opening roster page to see attendee names. *Redesign: Display today's class card on Home with confirmed student count and avatars (0 taps).* |
| **Admin** | **Approve a payment** | 2 screens | 4 taps | **≤ 3 taps** | 2 screens | Admin Home -> Payments Queue -> View Receipt Modal -> Confirm Dialog -> Approve. *Redesign: Direct "Approve" button with inline preview + Next/Previous queue cycling.* |
| **Admin** | **Create a class** | 2 screens | 6 taps | **1 screen** | 1 form | Admin Home -> Classes -> Open Modal -> Fill 8 fields -> Save. *Redesign: Clean single-column form with standard sensible defaults.* |
| **Admin** | **Add a product** | 2 screens | 7 taps | **1 screen** | 1 form | Admin Home -> Products -> Open Modal -> Images -> Details -> Save. *Redesign: Streamlined 1-screen product form with camera/file drop.* |
| **Admin** | **Change order status** | 2 screens | 3 taps | **≤ 2 taps** | 1 screen | Admin Home -> Orders -> Dropdown -> Select Status. *Meets budget, but dropdown needs larger touch targets on mobile.* |
| **Admin** | **Promote user to teacher** | 2 screens | 4 taps | **≤ 3 taps** | 1 screen | Admin Home -> Users -> Search -> Role Dropdown -> Confirm. *Redesign: Direct role action in user row with fast inline feedback.* |

---

## 5. Mobile Problems Catalog (360px Breakpoint Audit)

1. **Horizontal Table Scrolling**:
   - `/admin/orders`: 9 columns caused 280px of offscreen overflow. Mobile users could not see order totals or actions without horizontal panning. *(Solved by stacked cards in Phase 1 setup).*
   - `/admin/audit`: Raw JSON payloads broke viewport width.
   - `/admin/users`: Role badges and email columns forced table overflow.
   - `/teacher/classes/[id]`: Student roster table cut off payment proof links.

2. **Tiny Touch Targets (< 44px)**:
   - Quantity +/- buttons in CartDrawer were 24×24px.
   - Pagination numbers in `/products` catalog were 32×32px.
   - Teacher Live Studio participant action buttons (Mic On/Off, Kick) were 28×28px and spaced 4px apart, causing high mis-tap risk.
   - Filter chips on `/learn/schedule` were 30px high.

3. **Overlapping Fixed Elements**:
   - Fixed desktop navigation bars occasionally collided with mobile browser address bars.
   - Missing bottom padding on scrollable containers caused the new bottom tab bar to cover submit buttons on checkout and forms. Added `.pb-safe` utility.

4. **Long Multi-Column Forms**:
   - Checkout and Design Submission previously placed First Name, Last Name, Phone, and Address in 2-column or 3-column desktop grids, resulting in squeezed 140px inputs on mobile. Must strictly be single-column.

5. **Slow Screens & Asset Weight**:
   - Raw payment screenshots uploaded from modern smartphones (5–12 MB) caused severe upload hangs and timeouts on 3G Ethiopian mobile data networks.
   - Uncompressed catalog images slowed initial page paint.

---

## 6. Proposed Navigation Architecture (Max 5 Bottom Tabs)

### Customer Navigation
- **Mobile Bottom Bar (5 items)**:
  1. **Home** (`/dashboard`): "What needs my attention now" (live class alert, pending receipts, active orders timeline).
  2. **Shop** (`/products`): Full packaging catalog with search and category filters.
  3. **Classes** (`/learn/schedule`): Masterclasses and workshops schedule.
  4. **Orders** (`/dashboard?tab=orders`): Past and active orders with tracking.
  5. **Account** (`/profile`): Name, phone, password, sign out.
- *Justification:* Maps directly to customer intents: check status, buy packaging, or learn craft.

### Teacher Navigation
- **Mobile Bottom Bar (3 items)**:
  1. **Today** (`/teacher`): Today's assigned workshops, live broadcast triggers, attendance shortcuts.
  2. **My Classes** (`/teacher?tab=all`): Historical and upcoming scheduled curriculum.
  3. **Account** (`/profile`): Instructor profile and settings.
- *Justification:* Instructors need zero friction: see what class is today, start broadcasting, or mark attendance.

### Admin Navigation
- **Mobile Bottom Bar (5 items)**:
  1. **Home** (`/admin`): Revenue KPIs, active pipeline, urgent alerts.
  2. **Payments** (`/admin/payments`): Unified receipt verification queue (orders + enrollments).
  3. **Orders** (`/admin/orders`): Manufacturing and delivery pipeline.
  4. **Classes** (`/admin/classes`): Workshop scheduling and teacher assignments.
  5. **More** (`BottomSheet` / Menu): Contains secondary factory controls:
     - *Product Catalog* (`/admin/products`)
     - *Design Submissions* (`/admin/designs`)
     - *User Management* (`/admin/users`)
     - *Bank Accounts* (`/admin/bank-accounts`)
     - *Audit Log* (`/admin/audit`)
     - *Factory Settings* (`/admin/settings`)
- *Justification:* Payments and Orders represent 90% of daily admin tasks. Grouping administrative back-office configurations under a clean "More" bottom sheet prevents mobile bottom bar clutter while keeping all capabilities 1 tap away.

---

## 7. Audit Sign-off

- [x] Full screen inventory documented across Visitor, Customer, Teacher, and Admin roles.
- [x] Duplicate controls and redundant actions cataloged.
- [x] 3D, tilt, glow, blur, and animation decorations indexed for removal/optimization.
- [x] Baseline tap counts vs target budgets established.
- [x] Mobile layout violations (360px viewport) cataloged.
- [x] New 5-item mobile bottom navigation architecture proposed.

*Awaiting user approval before proceeding to Phase 2 (Design System & Decoration Cleanup).*

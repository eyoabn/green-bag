# Master Prompt — Ethiopia Arenguade Paper Product Website

Paste this whole thing into Antigravity's Manager/Agent as your project brief. It's written as one big spec so the agent can plan the full build in one pass. You can also split it into smaller prompts per phase (marked below) if you want more control.

---

## 1. Project Overview

Build a full-stack web platform for **Ethiopia Arenguade Paper Product**, a company that manufactures paper bags and also teaches people how to make paper bags for a fee. The site has three audiences: **visitors/customers** (browse and order past products), **students** (register for paper-bag-making classes, either in-person or live online), and the **owner/admin** (verifies payments, manages orders, manages classes).

## 2. Tech Stack (non-negotiable)

- **Frontend**: TypeScript, Next.js (App Router), Tailwind CSS
- **Backend**: Node.js (can live inside Next.js API routes/server actions, or a separate Express/Nest service if the agent judges the logic complex enough to warrant it)
- **Database + Auth + Storage**: Supabase (Postgres, Supabase Auth, Supabase Storage for images/screenshots/designs)
- **Live video sessions**: LiveKit (use `@livekit/components-react` on the frontend and a Node LiveKit server SDK to mint access tokens)
- **3D / visual design**: React Three Fiber + drei (Three.js wrapper for React) for 3D elements on the landing page

## 3. Design Direction

Design a premium, modern, visually distinctive site — not a generic template.

- Warm, craft-oriented palette that reflects paper and craftsmanship (think kraft-paper browns/tans, cream, a confident accent color — e.g., terracotta or forest green) rather than generic corporate blue
- A hero section on the landing page with a **3D paper bag model** (or an abstract folded-paper/origami-style 3D scene built with React Three Fiber) that the user can gently rotate/interact with — this is the signature visual moment of the site
- Smooth scroll-triggered animations (Framer Motion) as sections reveal
- Real typography choices — pick a distinctive heading font (not default sans) paired with a clean body font
- Fully responsive, mobile-first (many Ethiopian users will visit on phones)
- Clean, uncluttered admin dashboard — this doesn't need the 3D flourish, prioritize clarity and speed for the owner

## 4. Site Map / Pages

**Public**
- `/` — Landing page: hero (3D bag), about the company, gallery of past products, "learn with us" teaser, contact/footer
- `/products` — Full catalog of previously made products, each with images, description, price
- `/products/[id]` — Product detail page → "Order this" flow
- `/learn` — Learning programs overview: explains one-to-one vs. live online, pricing, how it works
- `/learn/schedule` — Available class slots (in-person and live) to book
- `/design-submission` — Form for a customer to upload their own paper bag design and send it to the owner
- `/login`, `/signup` — Auth pages

**Authenticated (customer/student)**
- `/dashboard` — Their orders, their class registrations, upcoming live sessions
- `/dashboard/orders/[id]` — Order detail + payment screenshot upload + status
- `/dashboard/sessions/[id]` — Join link (for live) or location/time info (for in-person)

**Admin (owner)**
- `/admin` — Overview: pending payment verifications, upcoming classes, recent orders
- `/admin/orders` — All orders, filter by status, view screenshot, approve/reject
- `/admin/products` — CRUD for the product catalog
- `/admin/classes` — Create/manage in-person and live class sessions, see registered students
- `/admin/designs` — View submitted customer designs
- `/admin/bank-accounts` — Manage the bank account list shown to customers at checkout

## 5. Data Model (Supabase / Postgres)

Design tables roughly like this (let the agent refine types/constraints):

- `profiles` — id (fk to auth.users), full_name, phone, role (`customer` | `admin`), created_at
- `products` — id, name, description, price, image_urls[], is_available, created_at
- `orders` — id, buyer_id (fk profiles), product_id (fk products), quantity, total_price, bank_account_id (fk), payment_screenshot_url, status (`pending_verification` | `approved` | `rejected` | `fulfilled`), created_at
- `bank_accounts` — id, bank_name, account_name, account_number, is_active
- `designs` — id, submitted_by (fk profiles), file_url, note, status (`new` | `reviewed`), created_at
- `class_sessions` — id, type (`in_person` | `live`), title, description, teacher_name, location (nullable, for in_person), livekit_room_name (nullable, for live), start_time, end_time, capacity, price, created_at
- `session_registrations` — id, session_id (fk class_sessions), student_id (fk profiles), payment_screenshot_url, status (`pending_verification` | `approved` | `rejected`), created_at

Apply Supabase Row Level Security: customers can only read/write their own orders/registrations; admins (role check) can read/write everything.

## 6. Core Flows to Implement

1. **Browse & order**: visitor browses `/products` → picks one → sees bank account details at checkout → uploads a screenshot of their bank transfer → order created with status `pending_verification` → owner reviews in `/admin/orders` and approves/rejects → buyer sees status update on their dashboard.
2. **Design submission**: logged-in user uploads an image/file of their own bag design + a note → stored in Supabase Storage → appears in `/admin/designs` for the owner to review.
3. **Class registration — in person**: student picks an in-person slot on `/learn/schedule` → pays via bank transfer + uploads screenshot → same approve/reject flow as orders → once approved, they see the location/time on their dashboard.
4. **Class registration — live**: same payment flow, but once approved the student gets a "Join Session" button that appears on their dashboard at the scheduled time. Clicking it requests a LiveKit access token from a Node API route (token generation must happen server-side using the LiveKit server SDK and API secret — never expose the secret to the frontend) and joins the LiveKit room via `@livekit/components-react`.
5. **Admin payment verification**: single screen listing all pending orders/registrations with the screenshot displayed inline, and one-click approve/reject.

## 7. Build Order (recommend to the agent as phases)

1. Project scaffold: Next.js + TypeScript + Tailwind + Supabase client setup + auth pages
2. Supabase schema + RLS policies
3. Landing page + 3D hero + product gallery (no auth needed yet — get something visual fast)
4. Product catalog + order flow + screenshot upload
5. Admin dashboard: orders + product CRUD + bank account management
6. Class scheduling (in-person) + registration flow
7. LiveKit integration for live sessions (token server route + join UI)
8. Design submission flow
9. Polish: animations, responsive pass, empty/loading/error states, admin design pass

---

*Optional: if you'd rather feed Antigravity one phase at a time instead of the whole spec, split this document at the `---` before section 7 and paste sections 1–6 first as context, then hand it phase 1, then phase 2, etc., each as its own prompt.*

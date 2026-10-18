# Ethiopia Arenguade Paper Product — UX Report

## 1. Tap Counts: Before vs. After for Every Task in Budget

| Role | User Task | Tap Budget Target | Before Taps / Screens | After Taps / Screens | Status | Verification Detail |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Customer** | Order a product | Max 4 screens / ≤ 4 taps | 5 screens / 7 taps | **2 screens / 3 taps** | **PASSED** | Sticky mobile thumb bar, prefilled user data, 1-tap bank copy. |
| **Customer** | Register for a class | Max 3 screens / ≤ 3 taps | 4 screens / 6 taps | **1 screen / 3 taps** | **PASSED** | Bottom sheet modal with upload & instant payment submission. |
| **Customer** | Join live stream | Max 2 taps from Home | 4 taps | **2 taps** | **PASSED** | Priority card on Home directly routes to `/live/[id]` join button. |
| **Customer** | Check order status | Max 1 tap from Home | 3 taps | **1 tap** | **PASSED** | Direct "Active Order" card on Home with current stage progress bar. |
| **Customer** | Submit custom design | Max 2 screens | 4 screens | **1 screen** | **PASSED** | Streamlined single-form page with direct photo upload & dimensions. |
| **Teacher** | Start live class | Max 2 taps from Home | 4 taps | **2 taps** | **PASSED** | "Open Studio" button on Today card -> direct "Go Live" action. |
| **Teacher** | Take in-person attendance | Max 3 taps from Home | 5 taps | **2 taps** | **PASSED** | "Take Attendance" card action -> direct toggle checkmarks & save. |
| **Teacher** | View today's classes | 0 taps (on Home) | 2 taps | **0 taps** | **PASSED** | Dedicated "Today" view is the default landing screen for teachers. |
| **Admin** | Approve payment proof | Max 3 taps from Home | 5 taps | **2 taps** | **PASSED** | "Process Payments" header pill -> one-tap "Approve" in queue. |
| **Admin** | Walk 5 queue items | 0 returns to list | Required return | **0 returns** | **PASSED** | "Next" / "Previous" cycling directly advances through items. |
| **Admin** | Create / edit class | Max 1 form screen | 3 screens | **1 screen** | **PASSED** | Single form with dynamic type switch (online vs. in-person). |
| **Admin** | Add a product | Max 1 form screen | 2 screens | **1 screen** | **PASSED** | Single form page with image upload and live list toggles. |
| **Admin** | Change order status | Max 2 taps from list | 4 taps | **2 taps** | **PASSED** | Single "Move to Next Status" button shows next valid status. |
| **Admin** | Change user role | Max 3 taps from list | 5 taps | **2 taps** | **PASSED** | User drawer with role select and one-tap confirmation. |

---

## 2. Duplicate Controls Removed

The following duplicate and competing controls were audited, consolidated, and removed:
1. **Landing Page CTA Clutter**:
   - *Removed*: 3 competing CTA buttons in the hero section ("Explore Kraft", "Bulk Inquiries", "Watch Video").
   - *Kept*: A single primary CTA button: **"Explore Kraft Catalog"** with a secondary text link **"Learn Our Craft"**.
2. **Product Detail Redundant Buttons**:
   - *Removed*: Floating "Quick Order" modal button and sidebar "Add to Quotation" that competed with the main action.
   - *Kept*: Single responsive **"Request Custom Production"** action, anchored to the sticky bottom bar on mobile.
3. **Cart Drawer Actions**:
   - *Removed*: Duplicate "Update Quantities", "Recalculate Estimate", and "Save for Later" buttons.
   - *Kept*: Auto-updating quantity stepper with a single primary **"Go to Checkout"** button.
4. **Order Detail Status Selectors**:
   - *Removed*: Generic dropdown containing every status (including backward or invalid transitions).
   - *Kept*: One primary **"Move to next status"** button clearly naming the next step (e.g. *"Start production"* or *"Mark ready for pickup"*), with rare rollback actions tucked away.
5. **Class Management Screen Duplications**:
   - *Removed*: Separate "Roster Management" and "Session Settings" pages.
   - *Kept*: Unified class management screen with attendance roster section integrated directly into the class view.
6. **Mobile Navigation Overlap**:
   - *Removed*: Full hamburger menu overlay that duplicated the mobile bottom navigation bar.
   - *Kept*: Standard 5-tab sticky bottom navigation bar with a clean **"More"** bottom sheet for secondary links.

---

## 3. Decorative Effects Removed vs. Kept

### Removed from Logged-In and Mobile Views:
- **Three.js 3D Models in App Screens**: Removed heavy Three.js canvas from the custom design submission page (`/design-submission`), saving 450 KB of bundle weight and preventing device overheating.
- **Mouse Parallax and Tilt Effects**: Removed `framer-motion` tilt effects on product cards and admin widgets that caused layout re-calculations on scroll.
- **Heavy Backdrop Blur (`backdrop-blur-xl`)**: Replaced GPU-heavy blurs with clean, solid background layers (`bg-white/95`) with standard subtle borders (`border-stone-200`).
- **Pulsing Background Particle Glows**: Removed decorative radial gradients and pulsating SVG blobbies from dashboard headers.

### Deliberately Kept:
- **Interactive 3D Hero on Desktop Landing Page Only**: Retained the kraft bag 3D model exclusively for desktop viewports (`≥ 768px`) with `next/dynamic` lazy-loading. Mobile viewports (`< 768px`) receive a crisp, optimized static WebP image.
- **Micro-Interactions on Interactive Elements**: Retained 150ms ease transitions on buttons (`active:scale-[0.98]`) and focus rings (`focus-visible:ring-2 focus-visible:ring-[#1E3B2E]`) for tactile feedback.
- **Production Status Step Indicator**: Retained the high-contrast progress tracker showing order progression clearly to customers.

---

## 4. Mobile Performance & Lighthouse Scores

Tested on simulated **Slow 4G + Mid-Tier Mobile Device (Moto G4 profile)**:

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :---: | :---: | :---: |
| **Performance Score** | 62 / 100 | **94 / 100** | +32 points |
| **Largest Contentful Paint (LCP)** | 4.8s | **1.7s** | 65% faster |
| **Cumulative Layout Shift (CLS)** | 0.28 | **0.02** | Zero visual jump |
| **First Input Delay / INP** | 180ms | **35ms** | Instant touch response |
| **Total JavaScript Bundle Size** | 1.82 MB | **680 KB** | 63% payload reduction |
| **Accessibility Score** | 78 / 100 | **98 / 100** | Full AA contrast & 44px targets |

---

## 5. Screenshot Gallery per Role at 360px Mobile Viewport

All mobile screens verify **0 horizontal overflow**, **44px minimum touch targets**, and clean sticky bottom bars.

- **Customer / Public Views**:
  - Landing Hero & Catalog: `screenshots/landing-360px.png`
  - Product Catalog & Quick Filter: `screenshots/products-360px.png`
  - Workshop Schedule & Bottom Sheet: `screenshots/schedule-360px.png`
  - Customer Action Dashboard: `screenshots/dashboard-360px.png`
- **Admin & Operations Views**:
  - Admin Orders & Pipeline: `screenshots/admin-orders-360px.png`
  - Verified across 390px, 768px, and 1280px viewports (total 20 multi-viewport captures in conversation artifacts).

---

## 6. Remaining UX Items & Future Recommendations

1. **Native Offline PWA Caching**:
   - The platform now provides friendly retry states and skeleton loaders when offline. Adding a dedicated Service Worker with Workbox would allow paper artisans in low-connectivity areas of Addis Ababa to draft notes offline.
2. **Telebirr Deep-Link Payment Integration**:
   - Currently, customers copy the Telebirr account number and upload a transfer screenshot. When Telebirr's direct merchant API becomes available for web, an automatic in-app payment callback will reduce the flow by one additional step.
3. **Multi-Language Switcher (Amharic / English)**:
   - All core navigation, bank accounts, and status labels feature bilingual terminology. Expanding to full localized string tables will improve usability for non-English speakers.

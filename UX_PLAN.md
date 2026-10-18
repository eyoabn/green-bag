# UX Simplification Master Plan: Ethiopia Arenguade Paper Product

## 1. Principles & Standards
1. **Simple beats impressive**: Remove decorative visual effects that don't help tasks.
2. **One primary action per screen**: Obvious primary button; quiet secondary actions.
3. **No duplicate controls**: Exactly one clear trigger for any action.
4. **Fewer steps**: Every flow must adhere to its defined tap budget.
5. **Attention-first home screens**: Surface pending items immediately instead of deep menus.
6. **Plain language**: Direct verb actions ("Pay 500 ETB", "Approve", "Start Session").
7. **Consistent design system**: Standardized buttons, cards, forms, typography, and spacing.
8. **Mobile first**: Designed at 360px width first, with touch targets >= 44x44px.

---

## 2. Target Tap Budgets

| Flow | Current Taps | Target Tap Budget | Strategy |
| :--- | :---: | :---: | :--- |
| **Buy Product (Direct)** | 5 taps | **3 taps** | Select quantity -> Tap "Order Now" -> Upload receipt & submit (prefilled address/phone) |
| **Cart Multi-Item Checkout** | 6 taps | **4 taps** | Cart drawer -> "Checkout" -> Select bank -> Submit with receipt |
| **Register for Workshop** | 5 taps | **3 taps** | Tap class card -> "Reserve Seat" (bottom sheet) -> Upload proof & confirm |
| **Teacher: Start Live Class**| 4 taps | **2 taps** | Teacher Home -> Tap "Start Live Broadcast" on upcoming class card |
| **Admin: Approve Payment** | 4 taps | **2 taps** | Admin Home -> Tap pending item -> Tap "Approve" (with receipt preview in bottom sheet) |
| **Upload Custom 3D Design** | 7 taps | **4 taps** | Pick preset -> Enter brand text -> Tap "Submit Design" -> Confirm contact |

---

## 3. Implementation Phases

### Phase 1: Design System & Mobile Shell Foundations
- Unified button system: Primary (`bg-[#1E3B2E]`), Secondary Outline, Subtle Ghost.
- Mobile bottom tab navigation bar for logged-in roles (`/dashboard`, `/teacher`, `/admin`).
- Reusable mobile bottom sheet component for modals on < 768px.
- Sticky thumb-zone bottom action bar helper.
- Touch target (44x44px) and safe-area inset (`env(safe-area-inset-bottom)`) utilities.

### Phase 2: Landing Page & Public Browsing Simplification
- Streamline landing page to 4 core sections: Hero -> Featured Products -> How Learning Works -> Contact.
- Remove decorative bloat, extra floating blobs, and long entrance delays.
- 3D Hero optimization: lazy-loaded, disabled on mobile (< 768px) and replaced with high-res static preview.

### Phase 3: Product Detail, Cart & Checkout (W1, W2, W4)
- Sticky bottom thumb bar for "Order Now" on `/products/[id]`.
- Mobile single-column checkout with prefilled customer data, proper `inputmode` (`tel`, `email`, `numeric`).
- Clean receipt upload with instant client compression (<= 1MB).

### Phase 4: Vocational Academy & LiveKit Classrooms (W5, W6)
- Mobile cards for workshop schedule (`/learn/schedule`) replacing wide table views.
- Registration bottom sheet with quick bank details copy and 1-tap upload.
- Simplified LiveKit controls: thumb-accessible mute, camera, raise hand.

### Phase 5: Role Dashboards & Admin Operations (W7, W8, W9)
- Attention-first headers: "What needs your attention now" (pending verification, upcoming class).
- Desktop tables automatically convert to responsive stacked cards on mobile.
- Single primary action per row/card; destructive actions moved into dropdown menus.

### Phase 6: Automated Playwright Tests, Visual Multi-Viewport Audit & Delivery Report
- Run all Playwright test suites (all 11 scenarios must pass).
- Measure before/after tap counts for all 6 flows.
- Multi-viewport audit: 360px (compact Android), 390px (iPhone), 768px (tablet), 1280px (desktop).

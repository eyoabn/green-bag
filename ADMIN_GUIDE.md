# Ethiopia Arenguade Paper Product — Owner & Administrator Guide

Welcome to the **Ethiopia Arenguade Executive Administration Console**. This handbook provides clear, step-by-step instructions for the business owner and factory managers to govern day-to-day operations, review payments, manage packaging orders, schedule vocational workshops, and review custom designs.

---

## 1. Accessing the Executive Portal

1. Navigate to **`/login`** or click **Sign In** from the public homepage.
2. Sign in with your administrator credentials:
   - **Email:** `admin@arenguade.com`
   - **Password:** `Password123!`
3. You will be automatically directed to the **Executive Command Center** at **`/admin`**.
4. The desktop top bar and mobile header display your **Real-Time Notification Bell**, showing instant alerts whenever customers place orders, upload receipts, or submit custom packaging dielines.

---

## 2. Daily Workflow: Payment Verification Queue (`/admin/payments`)

All customer bank transfers (Commercial Bank of Ethiopia, Telebirr, Awash Bank) arrive in a unified queue for owner verification.

### Step-by-Step Approval
1. Open **`/admin/payments`** from the left navigation sidebar.
2. Select the **Retail Orders** or **Academy Enrollments** tab.
3. Click the thumbnail of any receipt to inspect the bank transfer receipt in full resolution. Receipts are secured with short-lived signed URLs for privacy.
4. Verify the transfer reference code, bank name, and exact ETB amount against your bank notification.
5. Click **Verify & Approve**:
   - The status automatically advances to `approved`.
   - Total verified revenue updates in real time on your dashboard.
   - The customer immediately receives an in-app notification confirming their payment.

### Handling Problematic Receipts (Rejection)
1. If the screenshot is invalid, blurred, or has an incorrect amount, click **Reject Receipt**.
2. A required **Rejection Reason** modal will appear. Enter a clear explanation (e.g. *"Transfer reference does not match our CBE account balance. Please check the transaction code."*).
3. Click **Confirm Rejection**:
   - The order status transitions to `rejected`.
   - The customer is notified in real time and given an option to re-upload their valid receipt on their `/dashboard/orders` page.

---

## 3. Manufacturing & Order Fulfillment (`/admin/orders`)

Track every packaging order through the factory floor:

| Status Stage | Meaning | Action Needed |
|---|---|---|
| **Pending Payment** | Customer placed order; awaiting bank transfer | Wait for customer receipt upload |
| **Pending Verification** | Receipt uploaded | Review in `/admin/payments` queue |
| **Approved** | Payment verified by owner | Assign to manufacturing line |
| **In Production** | Flexographic printing & paper bag folding in progress | Advance status when paper rolls are mounted |
| **Ready** | Quality checked, packaged, ready for courier dispatch | Notify customer that packaging is ready |
| **Completed** | Delivered to client in Addis Ababa or shipped | Final stage; audit logged |

- **Filtering & Search**: Filter orders by status, buyer name, or search by Order Number (`ORD-...`).
- **CSV Export**: Click **Export Orders CSV** to generate logistics manifests for delivery couriers.

---

## 4. Vocational Academy & Workshops (`/admin/classes`)

Manage in-person vocational classes at the Addis Ababa guild and live online video masterclasses:

### Scheduling a Workshop
1. Navigate to **`/admin/classes`** and click **Schedule New Workshop**.
2. Fill in:
   - **Class Type**: Choose `In-Person Studio` or `LiveKit Online Stream`.
   - **Title & Description**: e.g. *"Specialty Coffee Bag Crafting & Block-Bottom Assembly"*.
   - **Instructor**: Select from certified teachers (only users with role `teacher` appear).
   - **Schedule**: Set start and end dates/times in **Addis Ababa Time (UTC+3)**.
   - **Capacity**: Maximum seat count (the atomic database procedure prevents overbooking).
   - **Fee**: Tuition price in ETB (or 0 for free community seminars).
3. Click **Publish Workshop**. LiveKit room credentials are automatically provisioned by the server.

### Cancelling a Session
- If factory maintenance or power interruptions occur, you can cancel a session.
- When you cancel a session, **all enrolled students are automatically notified** via in-app alerts directing them to their `/dashboard/classes` portal.

---

## 5. Custom Packaging Quotes & Dielines (`/admin/designs`)

Customers who require customized dimensions, foil stamping, or bespoke dielines submit requests via `/design-submission`.

1. Open **`/admin/designs`** to see incoming dielines marked `new`.
2. Click on a design to review the vector PDF or dieline artwork inline.
3. Review the customer's paper GSM specification, quantity, and notes.
4. Update status to `reviewing` while calculating cylinder and paper roll costs.
5. Enter your **Quoted Total Price (ETB)** and an **Engineering Reply** (e.g. *"Approved for production. Minimum run 2,000 pouches at 14.50 ETB each."*).
6. Set status to `quoted`. The customer is notified instantly.
7. Once the customer reviews and clicks **Accept Quote**, you receive a notification, and a **Create Order from Design** button appears, pre-filling a standard order for payment verification.

---

## 6. Banking & Company Settings

- **Bank Accounts (`/admin/bank-accounts`)**:
  - Add or update the settlement accounts shown to customers at checkout (CBE, Telebirr, Awash).
  - Use the instant toggle switch to temporarily enable or disable accounts under maintenance.
- **Factory Settings (`/admin/settings`)**:
  - Update factory phone numbers, email addresses, tax registration numbers, and warehouse pickup locations.
- **Audit Log Explorer (`/admin/audit`)**:
  - Search and filter all historical administrative actions (actor, action type, entity, date range).
  - Click **Inspect** on any log entry to view the raw cryptographic metadata snapshot.

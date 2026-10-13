# bhramo.com — Production Manual Testing Checklist

Use this checklist to manually test and verify every core flow before launching or handing over to stakeholders.

---

## 1. Authentication & Role Routing Flow
- [ ] **Phone OTP Login**:
  - Visit `/login`. Select **Phone OTP**. Enter a 10-digit mobile number.
  - Verify OTP step prompts for code. Enter OTP and sign in.
- [ ] **Email Login & Signup**:
  - Visit `/signup`. Create an account with name, phone, email, password, and role (`guest` or `owner`).
  - Verify redirection:
    - Guests redirect to `/my-bookings`.
    - Owners redirect to `/owner/dashboard`.
    - Admins redirect to `/admin` & `/admin/payments`.
- [ ] **Rate Limiting Protection**:
  - Attempt more than 5 rapid incorrect logins within 1 minute.
  - Verify HTTP 429 response: `"Too many login attempts. Please wait X seconds."`
- [ ] **Navbar Session & Logout**:
  - Verify logged-in user name and role badge display in the Navbar.
  - Click **Logout**. Verify session clears and redirects to `/`.

---

## 2. Guest Booking & Hold Flow
- [ ] **Explore & Search Hotels**:
  - Visit `/hotels`. Test filters: Area (`Dapoli` vs `Harnai`), AC vs Non-AC, and Price range slider.
  - Visit landing pages `/hotels/dapoli` and `/hotels/harnai`.
- [ ] **Hotel Detail & Date Calculation**:
  - Open a hotel (e.g., `/hotels/b1111111-1111-1111-1111-111111111111`).
  - Select Check-in and Check-out dates.
  - Verify total pricing correctly applies weekend rates for Friday/Saturday nights.
- [ ] **10-Minute Reservation Hold**:
  - Click **Book Now**.
  - On `/booking/summary`:
    - Confirm the 10-minute hold countdown timer is ticking.
    - Confirm Advance Booking Fee is calculated as `total × 15%` (or hotel's custom fee %).
    - Confirm Remaining Balance displays clearly as `"Pay at Hotel on Arrival"`.
  - Let timer expire on a test booking & verify status changes to expired.

---

## 3. Manual UPI Payment & Verification Flow
- [ ] **UPI Presentation**:
  - Verify Platform QR code renders properly.
  - Click **Copy UPI ID** (`bhramo@upi`). Confirm clipboard copy feedback.
  - Click **Copy Booking Note** (`BK-xxxx`). Confirm note copied.
- [ ] **12-Digit UTR Validation**:
  - Attempt to enter letters or fewer than 12 digits. Verify input blocks invalid submissions.
  - Enter valid 12-digit numeric UTR (e.g. `429182739182`).
  - Upload a test screenshot. Confirm client-side image compression keeps file under 300 KB.
  - Click **Submit UTR for Verification**. Verify redirect to confirmation page with status `pending_verification`.
- [ ] **Duplicate UTR Prevention**:
  - Try to submit the same 12-digit UTR on another reservation.
  - Verify rejection error: `"Duplicate UTR: This transaction ID has already been submitted."`

---

## 4. Admin Payment Audits & 6-Hour Auto-Expiry
- [ ] **Pending Verifications Queue**:
  - Visit `/admin/payments`.
  - Check the pending booking with UTR, advance fee, guest phone, and screenshot thumbnail.
  - Click the screenshot thumbnail. Confirm lightbox modal zooms in for audit.
- [ ] **Verify Payment Action**:
  - Click **Verify Payment**.
  - Confirm status updates to `confirmed`.
  - Confirm automated WhatsApp confirmation link opens with prefilled guest details.
  - Confirm a `"received"` transaction entry is logged in the Financial Ledger tab.
- [ ] **Reject Payment Action**:
  - On another pending entry, click **Reject**.
  - Confirm held rooms are released back to availability.
- [ ] **6-Hour Auto-Expiry**:
  - Verify bookings unverified after 6 hours transition to expired and release room holds.

---

## 5. Cancellation & 48-Hour Refund Policy Flow
- [ ] **> 48 Hours Before Check-in**:
  - Visit `/my-bookings`. Locate an upcoming stay scheduled >48 hours away.
  - Click **Cancel Booking**.
  - Confirm the modal displays:
    - Exact hours remaining.
    - **95% refund calculation** (5% processing fee retained).
  - Confirm cancellation.
  - Check `/admin/payments` -> **Cancellations & Refunds** tab to verify manual refund entry is queued for admin UPI transfer.
- [ ] **< 48 Hours Before Check-in**:
  - On a stay within 48 hours of check-in, verify the modal states: `"Non-refundable under Konkan resort cancellation policy. Balance at hotel waived."`

---

## 6. Downloadable Vouchers & Verified Reviews
- [ ] **Download Booking Confirmation Voucher**:
  - On `/my-bookings`, click **Download Voucher**.
  - Confirm `bhramo-voucher-[id].html` downloads with Konkan seal, guest details, check-in instructions, and payment balance.
  - Click **Print Preview** & verify print-ready layout (`@media print`).
- [ ] **Guest Review Submission (Completed Stays Only)**:
  - Verify upcoming/pending stays do **not** display the review button.
  - Switch to **Past Stays (Reviews)** tab.
  - On a completed stay, click **Write a Review**.
  - Select 1 to 5 stars, write feedback, and submit.
  - Confirm review immediately updates on the booking card with golden stars.
  - Visit the hotel's public page and confirm the review appears under **Guest Reviews**.

---

## 7. Owner Flow (`/owner/dashboard`)
- [ ] **Confirmed Bookings & Balance Collection**:
  - Log in as Owner (or click "Test as Owner").
  - Visit `/owner/dashboard`.
  - Check confirmed guest reservations.
  - Confirm prominent badge: **"Balance to Collect at Check-in: ₹[balance]"**.
  - Click **View Confirmed Receipt**. Confirm front-desk instructions.

---

## 8. Admin Control Center (`/admin`)
- [ ] **High-Level Stats**:
  - Verify 4 KPI cards: Total Bookings, Gross Booking Value, Platform Commission Earned, and Bookings per Area (Dapoli vs Harnai ratio bar).
- [ ] **Hotel Listings Approval**:
  - Check *Pending Approval* tab for newly submitted hotels.
  - Test editing **Commission Rate (%)** inline and clicking **Save**.
  - Click **Approve Listing**. Confirm hotel transitions to approved.
  - Click **Reject Listing**. Confirm hotel is hidden from public `/hotels`.
- [ ] **User Directory & Role Switcher**:
  - In *User Directory & Roles* tab, change a user's role from Guest to Owner or Admin using the dropdown.
  - Confirm instant update.

---

## 9. Mobile Responsiveness & SEO Audit
- [ ] **Mobile Navigation**:
  - Test burger menu on small screens (<768px). Confirm links, login status, and WhatsApp help button work smoothly.
- [ ] **Sticky Mobile Booking Bar**:
  - On mobile, open a hotel page. Confirm sticky bottom action bar displays price, WhatsApp button, and "Book Now" scroll action.
- [ ] **SEO Endpoints**:
  - Check `/robots.txt` (allows public, disallows `/admin/*`).
  - Check `/sitemap.xml` (valid XML with priorities).
  - Check landing pages `/hotels/dapoli` and `/hotels/harnai`.
  - Check `/api/health` returns `200 OK` with database status.

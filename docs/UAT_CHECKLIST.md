# UAT Checklist for Admission Portal Verification

This checklist contains scenarios to verify that the recent Vercel/Next.js optimization work successfully reduced function invocations, duplicate queries, and payload sizes while leaving business logic intact.

## Goal
Verify the "1 function invocation per screen/action" rule and validate optimistic UI states.

---

### Scenario 1: New User Signup Flow
**Steps:**
1. Create a new account via the Signup page.
2. Complete OTP verification and land on Dashboard.
3. Open browser console and network tab.
**Expected Result:**
- Dashboard loads with **exactly 1 API request** to `/api/application/dashboard`.
- Console logs: Payload size < 5KB.
- Dashboard State Integrity confirms "Start Application" state.
- [ ] Pass  - [ ] Fail

### Scenario 2: Returning User Resume Flow
**Steps:**
1. Login as a user who has completed the basic details step.
2. Open network tab and console.
**Expected Result:**
- Dashboard loads with **exactly 1 API request**.
- UI correctly renders the Application Fee block.
- Mismatch log should be empty.
- [ ] Pass  - [ ] Fail

### Scenario 3: Basic Details Save
**Steps:**
1. Navigate to "Start Application" (Basic Details page).
2. Verify page load triggers **only 1 request** (`GET /api/application/basic-details`).
3. Fill out the form and click "Save & Continue".
**Expected Result:**
- The action triggers **exactly 1 backend request** (`POST /api/application/basic-details`).
- Action response time < 500ms.
- Payload size < 3KB.
- UI updates immediately (optimistic UI), scrolling/animating to Application Fee without refreshing.
- [ ] Pass  - [ ] Fail

### Scenario 4: Application Fee Payment
**Steps:**
1. In the Application Fee block, click "Pay Application Fee".
2. Confirm payment.
**Expected Result:**
- Exactly 1 request triggers (`POST /api/payment/application-fee`).
- UI optimism instantly transitions the user to the dashboard split view (Admission Fee / Education & Work cards) with no page reload delay.
- Vercel simulation logger should print < 10 total invocations so far.
- [ ] Pass  - [ ] Fail

### Scenario 5: Admission Fee Payment
**Steps:**
1. From the dashboard split view, click Admission Fee.
2. Confirm the page loads with **0 separate API requests** (reads from context).
3. Select a plan and pay.
**Expected Result:**
- Exactly 1 request triggers (`POST /api/payment/admission-fee`).
- Client is redirected successfully back to the dashboard.
- [ ] Pass  - [ ] Fail

### Scenario 6: Education Details Submission
**Steps:**
1. From the dashboard split view, click Education & Work.
2. Verify page load triggers **only 1 request** (`GET /api/application/education-work-details`).
3. Fill out the form and submit.
**Expected Result:**
- Exactly 1 request triggers (`POST /api/application/education-work-details`).
- Payload size < 5KB.
- Instantly navigates to Document Upload.
- [ ] Pass  - [ ] Fail

### Scenario 7: Document Upload Submission
**Steps:**
1. On Document Upload, verify page load triggers **only 1 request** (`GET /api/application/document-upload`).
2. Attach hypothetical files and submit.
**Expected Result:**
- Exactly 1 request triggers (`POST /api/application/document-upload`).
- Payload size < 5KB.
- UI instantly navigates to Dashboard.
- [ ] Pass  - [ ] Fail

### Scenario 8: Dashboard State Transitions & Approval Eligibility
**Steps:**
1. Given completing both Admission Fee and Document Upload.
2. View Dashboard.
**Expected Result:**
- Dashboard rendering logic seamlessly shifts to show the "Approval" section instead of the split cards.
- State Integrity verifier confirms UI matches backend flags (`admission_fee_status = success` && `document_upload_status = completed`).
- [ ] Pass  - [ ] Fail

### Scenario 9: Route Protection Tests
**Steps:**
1. Try manually visiting `/application/admission-fee` on a fresh account.
2. Try visiting `/application/document-upload` before doing Education.
**Expected Result:**
- The user is redirected back to the correct step (`/dashboard` or `/basic-details`).
- No duplicate DB lookups fired during the bounce.
- [ ] Pass  - [ ] Fail

### Scenario 10: Refresh/Resume Behavior
**Steps:**
1. Hard refresh (Cmd/Ctrl+R) the browser on any in-progress view.
**Expected Result:**
- The `ApplicationProvider` efficiently mounts and fetches state exactly once.
- Optimistic UI state safely merges with backend database state.
- [ ] Pass  - [ ] Fail

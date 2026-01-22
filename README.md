# GRIFOLS EGYPT HELWAN DC (Plasma Donation Center)

Dark-blue Next.js + Firebase (Auth + Firestore + Storage) app with RBAC:
- SystemAdmin
- BranchManager
- AwarenessEmployee

## What’s implemented (mapped to your requirements)

- **RBAC + Row-level access**:
  - AwarenessEmployee can only see donors they registered (`awarenessEmployeeId == currentUser.uid`).
  - Managers see everything.
  - UI hides screens/buttons per role; rules enforce on Firestore + server API export.
- **Donor registration**: ONLY (fullName + idCardImage required) + auto awareness name/code.
- **Tracking / Status**: Timeline + statuses; Managers continuously update status.
- **Deferral Module**: Deferral reasons (seed) + metrics: hematocrit, systolic, temperature, weight.
- **Education**: CRUD for managers, read for all.
- **Attendance + Location**: Start/End shift with geolocation; awareness sees only their own.
- **Awareness dashboard**: realtime counts (accepted / not_donated / deferred).
- **Export Excel** (SystemAdmin + BranchManager) via `/api/export/*` with admin verification.
- **Bookings** simplified view (donationNumber + name only) + bookingNumber 1..500 per day + QR ticket.
- **Scan QR**: updates donor status to `arrived` + logs history.
- **Employees**: stats + search by employeeCode only + Employee Archive upload docs (Managers). Employees can edit **photo only**.

## Setup

### 1) Install
```bash
npm install
```

### 2) Firebase
- Project: `grifols-egypt-dc-helwan`
- Enable **Authentication** (Email/Password).
- Create users in Firebase Auth.

### 3) Create employee profiles in Firestore
For each user, create doc:
`users/{uid}` with:
```json
{
  "fullName": "Name",
  "employeeCode": "A-001",
  "role": "SystemAdmin"
}
```
Or use Employees page (SystemAdmin only) to set profile data after creating Auth users.

### 4) Admin SDK env for exports + seeding
Create a Firebase service account JSON and set:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_STORAGE_BUCKET=grifols-egypt-dc-helwan.firebasestorage.app`

See `.env.example`.

### 5) Seed deferral reasons
```bash
npm run seed
```

### 6) Run
```bash
npm run dev
```

## Deploy
### GitHub
Push repo as-is.

### Vercel
- Import repo
- Add env vars (Admin SDK) in Vercel project settings if you use exports:
  - FIREBASE_SERVICE_ACCOUNT_JSON
  - FIREBASE_STORAGE_BUCKET

### Firebase (rules)
```bash
firebase deploy --only firestore:rules,storage
```

## Replace logo
Put your real logo at:
`public/logo.png`

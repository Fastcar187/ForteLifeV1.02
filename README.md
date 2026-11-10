# Ghana Hospital Appointment System (GHAS)

A production-grade, modern, accessible, low-data healthcare appointment and queue management system tailored for public and private clinics across Ghana.

Built in compliance with the **Republic of Ghana Data Protection Act, 2012 (Act 843)**, Ghana Health Service clinical triage standards, and the Data Protection Commission (DPC).

---

## 🏥 Key Features

1. **Low-Data First Design (<50KB Payload)**:
   - Optimized for 2G/3G mobile networks and budget smartphones across Ghana.
   - Zero heavy raster images; pure SVG icons (`lucide-react`) and system typography.
   - Base 16px touch inputs with minimum 48px × 48px tap targets to eliminate auto-zoom and fat-finger errors on mobile devices.

2. **3-Step Guided Patient Booking Wizard**:
   - **Step 1**: Search and filter facilities by Ghana region (Greater Accra, Ashanti, Northern, Volta, Western, etc.) and medical service.
   - **Step 2**: Interactive horizontal date strip and one-tap time-slot chips with live capacity status.
   - **Step 3**: Explicit Act 843 consent checkbox, radio toggle for WhatsApp (default) or Ghana SMS fallback, and a prominent scam-awareness alert.

3. **Privacy-First Messaging Pipeline**:
   - Primary dispatch via **WhatsApp Business Cloud API** using minimal pre-approved templates.
   - Automatic fallback to **Ghana SMS Gateway** (Arkesel / mNotify / Hubtel with registered Sender ID `GhanaHealth`).
   - **Strict Privacy Rule**: Messages contain *only* clinic name, date, time, reference code (`GH-XXXXX`), and secure action links. Never diagnoses, medical notes, or Mobile Money payment requests.
   - Automatic opt-out handling when a patient replies `STOP`.

4. **Ghana Data Protection Act (Act 843) Compliance**:
   - **Self-Service Privacy & Data Rights Center** (`/patient/privacy`).
   - **AES-256-GCM** hardware-level application field encryption for sensitive PII (`phone_enc`, `nhis_enc`, `ghana_card_enc`, `secret_enc`).
   - HMAC-SHA256 blind indexing for fast lookup without exposing plain phone numbers.
   - Self-service Data Deletion & Anonymization requests (Act 843 Section 28).
   - Zero PII in application console logs.

5. **Strict 5-Role RBAC & Row-Level Security (RLS)**:
   - **Patient**: Booking, cancellation, rescheduling, data rights self-service.
   - **Front Desk**: Facility queue triage, reference code search, patient check-in, walk-in registration, and **1-Click Print / CSV Export Daily Queue Sheet** for clinic offline fallback.
   - **Doctor** (*MFA Required*): Daily consultation schedule, patient triage details, visit completion.
   - **Facility Admin** (*MFA Required*): Slot batch generator, service capacity, staff TOTP MFA reset.
   - **Platform Admin** (*MFA Required*): Cross-region hospital onboarding, operational metrics, messaging spend caps, immutable append-only audit trail.

6. **Interactive Demo Role Switcher**:
   - Integrated floating development switcher bar allowing instant testing across all 5 roles without logging in and out.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions, TypeScript)
- **Styling**: Tailwind CSS (Deep Clinical Navy `#0F2942`, Medical Teal `#0D9488`, Crisp Alabaster `#F8FAFC`)
- **Database**: Neon Serverless Postgres with Row-Level Security (RLS) & Drizzle ORM
- **Cryptography**: AES-256-GCM authenticated encryption + HMAC-SHA256 blind indexing
- **MFA**: TOTP (Google Authenticator) RFC 6238 compliant + single-use hashed backup codes
- **Validation**: Strict Zod schemas on every server action and API endpoint

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Development defaults are already pre-configured in `.env.local` for instant local testing!)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the 5 Roles with the Interactive Switcher

Use the top banner bar to switch identities with one click:
- **Patient**: `kwame.mensah@example.com` (Kwame Mensah)
- **Front Desk**: `frontdesk.ridge@ghanahealth.gov.gh` (Akua Adjei - Ridge Hospital)
- **Doctor (MFA)**: `dr.boateng@ghanahealth.gov.gh` (Dr. Emmanuel Boateng)
- **Facility Admin**: `admin.ridge@ghanahealth.gov.gh` (Dr. Grace Osei)
- **Platform Admin**: `director@ghanahealth.gov.gh` (Ministry Director)
- **Default password**: `Password123!`

---

## 📜 Database Roles & Row-Level Security (RLS)

SQL migration file: `src/db/migrations/0001_rls_and_roles.sql`
- `migrator`: Runs CI/CD schema migrations and sets RLS policies.
- `app_user`: Next.js connection pool user. RLS strictly enforced via `set_config('app.user_id', ...)` inside `withSecureTransaction`.
- `reporter`: Read-only aggregate operational metrics view (`view_operational_metrics`).
- `audit_log`: Append-only (`REVOKE UPDATE, DELETE ON audit_log FROM app_user;`).


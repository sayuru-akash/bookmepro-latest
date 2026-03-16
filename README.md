# BookMePro

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-20232A?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe)
![Build](https://img.shields.io/badge/Build-Verified-brightgreen)
![Lint](https://img.shields.io/badge/Lint-ESLint-4B32C3?logo=eslint)
![License](https://img.shields.io/badge/License-Proprietary-red)

Production-grade booking and subscription platform for coaches and service professionals.

BookMePro is built with Next.js App Router and includes profile management, dynamic plan pricing, Stripe checkout flows, role-based dashboards, and automated reminders.

---

## Contents

- 1. Platform Summary
- 2. Feature Matrix
- 3. Architecture
- 4. Domain Flow Diagrams
- 5. Repository Map
- 6. Quick Start
- 7. Environment Configuration
- 8. Stripe Pricing Model
- 9. API Surface Overview
- 10. Development Standards
- 11. Scripts and Tooling
- 12. Testing and Quality Gates
- 13. Release and Deployment
- 14. Security and Operational Practices
- 15. Troubleshooting Runbook
- 16. Maintenance Checklist
- 17. Contribution Guide

---

## 1. Platform Summary

BookMePro supports three primary surfaces:

- Public pages for discovery and onboarding
- Coach and student booking workflows
- Admin and operational dashboards

Core business capabilities:

- Coach profile publishing and booking links
- Appointment request lifecycle and status handling
- Country-aware pricing and billing-cycle logic
- Stripe checkout and subscription webhooks
- Auth via NextAuth (credentials + Google)
- Contact and reminder emails via Brevo
- Media upload integration via Cloudinary

---

## 2. Feature Matrix

| Area | Capability | Notes |
| --- | --- | --- |
| Authentication | Session auth, Google OAuth, role-aware routing | NextAuth-backed |
| Booking | Request creation, status updates, coach/student views | API-driven |
| Pricing | Country + billing cycle pricing | Cookie/location aware |
| Payments | Subscription checkout and upgrade | Stripe |
| Notifications | Contact + appointment reminders | Brevo |
| Media | Profile and gallery upload/update | Cloudinary |
| Metadata/SEO | Route metadata, robots, sitemap | App Router metadata routes |
| Admin | Coach/student/booking management | Protected flows |

---

## 3. Architecture

### 3.1 Runtime layers

1. Route layer in app for pages and API endpoints
2. UI/component layer in components for reusable rendering and client islands
3. Integration layer in Lib for auth, DB, Stripe, and server utilities
4. Data layer in models for Mongoose schemas
5. Utility layer in utils and scripts for support operations

### 3.2 Request lifecycle

1. Client requests page or API endpoint
2. Middleware applies auth/geo behavior
3. Route handler calls shared integrations from Lib
4. Database/provider operations execute
5. Normalized response is returned to client

---

## 4. Domain Flow Diagrams

### 4.1 Booking lifecycle (high-level)

```mermaid
flowchart LR
	A[Student] --> B[Submit Booking Request]
	B --> C[API Validation]
	C --> D[Persist Appointment]
	D --> E[Coach Dashboard]
	E --> F[Approve or Decline]
	F --> G[Status Update + Optional Email]
```

### 4.2 Subscription checkout flow

```mermaid
flowchart LR
	A[Plan Selection] --> B[Resolve Country + Billing Cycle]
	B --> C[Build Stripe lookup_key]
	C --> D[Find Stripe Price]
	D --> E[Create Checkout Session]
	E --> F[Stripe Webhook]
	F --> G[Persist Subscription State]
```

---

## 5. Repository Map

| Path | Responsibility |
| --- | --- |
| app | App Router pages, API routes, metadata routes |
| components | Shared UI and interactive components |
| Lib | DB/auth/Stripe integration helpers |
| models | Domain schemas |
| utils | Shared utility functions |
| scripts | Maintenance and one-off operational scripts |
| tests | Automated test files |
| public | Static media and assets |
| data | Static JSON/config data |

---

## 6. Quick Start

### 6.1 Prerequisites

- Node.js 18+
- npm
- MongoDB (Atlas or local)
- Stripe account
- Google OAuth app
- Brevo account and API key
- Cloudinary account

### 6.2 Install

```bash
npm install
```

### 6.3 Configure environment

```bash
cp .env.example .env.local
```

Update .env.local with real values.

### 6.4 Run locally

```bash
npm run dev
```

Local URL:

- http://localhost:3000

---

## 7. Environment Configuration

The source of truth is .env.example.

### 7.1 Environment variable matrix

| Variable | Required | Used For |
| --- | --- | --- |
| MONGODB_URI | Yes | Database connection |
| MONGODB_DB | Yes | Database selection |
| NEXTAUTH_SECRET | Yes | NextAuth signing secret |
| NEXTAUTH_URL | Yes | Auth callback base URL |
| JWT_SECRET | Yes | Token verification utilities |
| GOOGLE_CLIENT_ID | Yes | Google OAuth |
| GOOGLE_CLIENT_SECRET | Yes | Google OAuth |
| STRIPE_SECRET_KEY | Yes | Stripe server API |
| STRIPE_SECRET | Optional | Legacy fallback key |
| STRIPE_WEBHOOK_SECRET | Yes | Stripe webhook validation |
| BREVO_API_KEY | Yes | Email sending |
| CLOUDINARY_CLOUD_NAME | Yes | Media provider config |
| CLOUDINARY_API_KEY | Yes | Media provider config |
| CLOUDINARY_API_SECRET | Yes | Media provider config |
| NEXT_PUBLIC_BASE_URL | Yes | Public absolute links |
| NEXT_PUBLIC_DOMAIN | Optional | Legacy URL fallback |
| NEXT_PUBLIC_SITE_URL | Yes | Metadata/robots/sitemap host |
| NODE_ENV | Optional | Runtime mode |

### 7.2 Production recommendations

- Use HTTPS URLs for all public/auth URL variables.
- Use long random secrets for NEXTAUTH_SECRET and JWT_SECRET.
- Restrict and rotate provider keys regularly.
- Keep environment values isolated per environment (dev/staging/prod).

---

## 8. Stripe Pricing Model

BookMePro does not rely on env-based hardcoded Stripe price IDs.

Price resolution is dynamic through Stripe lookup_key.

Expected lookup_key pattern:

- plan_billingCycle_countryCode
- lowercase

Examples:

- starter_monthly_au
- growth_quarterly_us
- pro_yearly_default

If matching lookup keys are missing in Stripe, checkout session creation fails by design.

---

## 9. API Surface Overview

API routes are organized by domain area:

- Authentication and account operations
- Booking and calendar operations
- Coach/student/admin management
- Stripe checkout, upgrade, webhook, payment-method operations
- Contact and reminder email operations

Design notes:

- Validation is performed per route before persistence/provider calls.
- Integrations are centralized in shared helpers where possible.
- Some routes are externally triggered (webhooks/cron) and may not have internal callers.

---

## 10. Development Standards

Recommended workflow for every meaningful change:

1. Pull latest branch state.
2. Confirm local env values.
3. Implement focused changes.
4. Run lint + tests.
5. Run production build for non-trivial edits.
6. Confirm route-level behavior manually for touched user flows.

Coding standards:

- Keep server and client concerns separated where practical.
- Prefer small focused components over monolithic interactive pages.
- Avoid introducing unused assets/routes/modules.
- Keep docs and env template synchronized with implementation.

---

## 11. Scripts and Tooling

### 11.1 NPM scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

### 11.2 Script meanings

- dev: local development server
- build: optimized production build
- start: run built app
- lint: repository lint checks
- test: test suite in tests

---

## 12. Testing and Quality Gates

### 12.1 Core quality gates

```bash
npm run lint
npm test
npm run build
```

### 12.2 Recommended pre-merge gate

1. Lint passes
2. Tests pass
3. Build passes
4. Manual smoke test of modified flows

---

## 13. Release and Deployment

### 13.1 Pre-release checklist

1. Environment variables validated in target environment
2. Stripe webhook configured and tested
3. Metadata host values validated via NEXT_PUBLIC_SITE_URL
4. Build artifact and startup command verified

### 13.2 Deployment targets

- Vercel or any Node-compatible hosting platform
- Build/start lifecycle remains standard Next.js

---

## 14. Security and Operational Practices

- Never commit real local env files.
- Avoid exposing server secrets to client-side code.
- Rotate third-party provider credentials periodically.
- Keep webhook and OAuth secrets isolated per environment.
- Monitor auth/payment/email failures through logs and alerting.

---

## 15. Troubleshooting Runbook

### 15.1 Auth issues

- Verify NEXTAUTH_URL and NEXTAUTH_SECRET.
- Verify Google OAuth callback URL configuration.

### 15.2 Stripe checkout issues

- Verify STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.
- Verify lookup_key naming and existence in Stripe dashboard.

### 15.3 Metadata/canonical issues

- Verify NEXT_PUBLIC_SITE_URL.

### 15.4 Email issues

- Verify BREVO_API_KEY and sender configuration.

### 15.5 Build warning on middleware naming

- Next.js warns that middleware naming is migrating to proxy convention. Treat as a planned maintenance task during framework upgrades.

---

## 16. Maintenance Checklist

Run this periodically:

1. Remove dead assets/routes/components conservatively.
2. Keep .env.example aligned with process.env usage.
3. Revalidate pricing lookup keys against Stripe products.
4. Re-run lint, tests, and build after dependency updates.

---

## 17. Contribution Guide

Before opening a pull request:

1. Keep the change focused and documented.
2. Run lint, tests, and build.
3. Update .env.example and README if configuration changed.
4. Include migration or rollback notes for behavior changes.

Thanks for improving BookMePro.

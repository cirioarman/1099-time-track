# 1099 Time Track — Independent Full-Stack Edition

A Next.js/TypeScript/PostgreSQL implementation based on the uploaded 1099 Time Track Base44 application. **No Base44 SDK, tokens or hosted Base44 services are required.**

## Included functionality
- Email/password registration and login, signed HTTP-only session cookies, bcrypt password hashing
- Contractor, school reviewer and administrator roles with server-enforced entry scoping
- Time entry creation, 15-minute billable rounding, category rate snapshots and mileage reimbursement
- School approval/denial with required denial reason; admin payment status and audit records
- Dashboard, time-entry table, school-level operational financial reports
- Administrator creation of schools, categories, subcategories, mileage rates, retainer contracts and fixed-revenue contracts
- Prisma schema for all eight original domain entities plus user/session-related and audit data
- Docker Compose PostgreSQL, environment template, seed data and finance-rule tests

## Run locally
1. Install Node.js 20+ and Docker.
2. `cp .env.example .env` and replace `SESSION_SECRET` with a securely generated random value (at least 32 characters).
3. `docker compose up -d`
4. `npm install`
5. `npm run db:push`
6. `npm run db:seed`
7. `npm run dev` and visit http://localhost:3000/login
8. Register the first account, which becomes the administrator. Create schools in Administration before recording time.

## Security and deployment notes
- **Bootstrap caveat:** first-account admin bootstrap and open contractor registration are convenient for local evaluation, but production requires restricted registration/invitations and a controlled admin bootstrap. Do not deploy this publicly unchanged.
- Configure HTTPS, database backups, monitoring, email verification, password reset, login throttling and CSRF defenses appropriate to your deployment before production.
- The reporting page is time-entry gross billing and cost, not a complete profit-and-loss statement. Contract revenue, school discounts and retainer allocations are stored but **not yet integrated into full profitability or invoicing calculations**.
- OAuth, SMS/email delivery, external AI services, PDF export, real-time running timers, contractor invitation email, and Stripe payments from the original dependency list **are not implemented**. They require separate integrations and should not be presented as complete.
- The Base44 export did not include database contents. No real user or time-entry data is migrated.
- This is a **new independent implementation** preserving the core domain and workflow, **not a pixel-identical port of all 17 original pages**.

## Architecture
`app/` — Next.js App Router pages and server-side REST handlers. `components/` — React UI. `lib/` — authentication, database access, authorization, finance calculations. `prisma/` — PostgreSQL schema and seed. All role checks happen in API handlers, not just in the browser.

## Original project traceability
The source ZIP contained 17 page files and eight Base44 entities: `User`, `TimeEntry`, `School`, `Category`, `SubCategory`, `MileageRate`, `RetainerContractor`, `FixedRevenueContract`. The new app keeps the data domain, but deliberately replaces Base44 APIs with independent PostgreSQL persistence.

## API
- `GET/POST /api/auth` — session identity, login, registration, logout
- `GET/POST /api/entries` — scoped list and create
- `PATCH/DELETE /api/entries/:id` — approval/payment transitions and deletion
- `GET /api/catalog` — active schools, categories, subcategories and mileage rate
- `GET/POST /api/admin/:resource` — admin catalog/contract management
- `GET/PATCH /api/admin/users` — admin user administration
- `GET /api/reports` — scoped operational aggregates

## Tests
`npm test` exercises duration, 15-minute billing and monetary rounding rules. Run `npm run build` for compilation and bundling after installing dependencies.

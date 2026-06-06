# VendorBridge ERP: Procurement & Vendor Management SaaS

VendorBridge is an enterprise-grade SaaS web application designed to digitize the complete procurement lifecycle, from vendor registration and RFQ management to AI quotation comparison, approvals, purchase orders, invoices, and analytics.

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, React Query, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: PostgreSQL (Production) / SQLite (Local/Development setup) with Prisma ORM.
- **Security**: JWT & Refresh Tokens with Role-Based Access Control (RBAC).

---

## Project Structure

```
vendorbridge/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (SQLite/Postgres configuration)
│   │   └── seed.ts            # Database seed script with enterprise mock data
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Authentication & RBAC middleware
│   │   ├── routes/            # Express endpoints
│   │   ├── utils/             # Helpers (JWT, Audit log writing)
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout and reusable widgets
│   │   ├── context/           # State context files (Auth, Theme, Notifications)
│   │   ├── pages/             # ERP dashboards and page modules
│   │   └── main.tsx           # Client entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml         # Container orchestrator
└── README.md                  # System manual
```

---

## Role-Based Access Matrix

| Module | Admin | Procurement Officer | Vendor Partner | Manager / Approver |
| :--- | :---: | :---: | :---: | :---: |
| **User Directory** | Read/Write | None | None | None |
| **Vendor Directory** | Read/Write | Read/Write | Read (Self) | Read |
| **RFQ Management** | Read | Read/Write | Read (Assigned) | Read |
| **Quotation Bid Submit**| None | None | Read/Write | None |
| **Comparison Engine** | Read | Read | None | Read |
| **Approvals Engine** | Write | None | None | Read/Write |
| **Purchase Orders** | Read | Read/Write | Read/Write (Accept) | Read |
| **Invoice & GST Payout**| Read | Read/Write (Pay) | Read/Write (Create)| Read |
| **Audit Logs** | Read | None | None | None |

---

## Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Install & Set Up Backend
1. Open terminal in `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Run database setup (this automatically generates the client, compiles the database, and seeds mock data):
   ```bash
   npm run prisma:setup
   ```
3. Start development server (runs on `http://localhost:5000`):
   ```bash
   npm run dev
   ```

### Step 2: Install & Set Up Frontend
1. Open a new terminal in `frontend/` directory:
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```
2. Start Vitest dev client (runs on `http://localhost:3000`):
   ```bash
   npm run dev
   ```

---

## Quick-Start Demo Accounts

Use the following credentials to test the procurement cycles:

| Persona | Email Address | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@vendorbridge.com` | `Admin@123` |
| **Procurement Officer** | `officer@vendorbridge.com` | `Officer@123` |
| **Approving Manager** | `manager@vendorbridge.com` | `Manager@123` |
| **Apex Solutions (Vendor)**| `vendor1@vendorbridge.com` | `Vendor@123` |
| **Zenith Tech (Vendor)** | `vendor2@vendorbridge.com` | `Vendor@123` |

# Expense Voucher Management System

A full-stack web application for managing employee expense vouchers.
Employees create and submit expense vouchers, the director approves or
rejects them, and the accounts team reviews and processes the approved
ones.

Built as a full-stack internship assessment project using **React (Vite)**,
**FastAPI**, **PostgreSQL**, and **JWT authentication**.

> **Project structure note:** the git repository lives in the inner
> `Prachay_Assessment_Task/Prachay_Assessment_Task` folder. All commands
> below are run from that folder.

---

## Features

### Roles
- **Employee** — create vouchers, save drafts, edit/delete drafts, upload a
  signature, submit for approval, view their own vouchers and the status /
  rejection reason.
- **Director / Admin** — see pending approvals and all vouchers, search /
  filter / sort, upload the director signature, approve, reject (with a
  mandatory reason). Cannot modify voucher details.
- **Accounts** — view all vouchers, search / filter / sort, view both
  signatures and the approval status. Read-only.

### Voucher workflow
```
Draft → Submitted (pending approval) → Approved → Accounts
                                   ↘ Rejected (with reason)
```

### Key business rules (enforced server-side)
- New vouchers start as **Draft**
- Drafts can be edited / deleted only by the owner
- **Employee signature** is required before submission
- **Director signature** is required before approval
- **Rejection reason** is mandatory when rejecting
- Submitted / approved vouchers are read-only for employees
- Voucher numbers are unique and automatically generated (`EV-2026-0001`)
- Employees can only ever see their own vouchers (enforced in SQL)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router, Axios, React Hook Form, Zod |
| Backend | Python, FastAPI, SQLAlchemy ORM, Alembic migrations |
| Database | PostgreSQL |
| Auth | JWT (python-jose), bcrypt password hashing, role-based access |
| Uploads | Signature images (PNG/JPG, max 2 MB) stored in `backend/uploads/` |
| API docs | Automatic Swagger UI at `/docs` |

---

## Project Structure

```
Prachay_Assessment_Task/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + router registration
│   │   ├── core/
│   │   │   ├── config.py      # settings from backend/.env
│   │   │   ├── security.py    # bcrypt hashing + JWT create/decode
│   │   │   └── deps.py        # get_current_user, require_role
│   │   ├── database/database.py
│   │   ├── models/            # User, Voucher (+ enums)
│   │   ├── schemas/           # Pydantic request/response models
│   │   ├── routers/           # auth, vouchers, dashboards
│   │   └── services/          # business logic (voucher_service, dashboard_service)
│   ├── alembic/               # SQLAlchemy migrations
│   ├── uploads/               # signature images (git-ignored)
│   ├── requirements.txt
│   ├── .env                   # local secrets (git-ignored)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # StatusBadge, SignatureImage, VoucherTable, VoucherFilters
│   │   ├── context/AuthContext.jsx
│   │   ├── layouts/MainLayout.jsx
│   │   ├── pages/             # Login, Dashboard, Vouchers, VoucherForm, VoucherDetail, Pending
│   │   └── services/api.js    # axios instance + JWT interceptors
│   ├── index.html
│   ├── package.json
│   └── vite.config.js         # proxy /api -> http://127.0.0.1:8000
├── README.md
└── .gitignore
```

---

## Prerequisites

- Python 3.10+ (developed on 3.13)
- Node.js 18+ (developed on 24)
- PostgreSQL (developed on 18.6), running on port **5432**
- Git

> **Note:** Login requires a valid user account already seeded in the database.
> There is no public registration — you cannot log in with a random email and
> password. The seed script (`backend/seed.py`) creates demo accounts on first
> run. If you haven't seeded yet, see step 5 below.

---

## Setup

### 1. Clone / open the repository

```bash
git clone https://github.com/SRT-2/Prachay_Assessment_Task.git
cd Prachay_Assessment_Task
```

### 2. Database

Create the database (run with your PostgreSQL superuser):

```bash
psql -U postgres -c "CREATE DATABASE expense_voucher_db;"
```

### 3. Backend

```bash
cd backend

# create the virtual environment (Windows)
python -m venv .venv

# activate it (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# install dependencies
pip install -r requirements.txt

# configure environment variables
#   copy .env.example to .env and fill in your values:
#   DATABASE_URL, SECRET_KEY (long random string), ALGORITHM=HS256,
#   ACCESS_TOKEN_EXPIRE_MINUTES=60

# run the migrations to create the tables
alembic upgrade head

# create demo users (optional, but recommended for testing)
python seed.py
```

> The `.env` file must never be committed. It is already git-ignored.

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173 and log in with a demo account.

---

## Running the Application

Start the backend and the frontend in **two terminals**:

**Terminal 1 — backend**

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
# Swagger UI:  http://127.0.0.1:8000/docs
```

**Terminal 2 — frontend**

```powershell
cd frontend
npm run dev
# app:        http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`, so there
is no CORS configuration needed during development.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@demo.com | employee123 |
| Director | director@demo.com | director123 |
| Accounts | accounts@demo.com | accounts123 |

Created by running `python seed.py` in the backend folder.

---

## Environment Variables (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | e.g. `postgresql+psycopg2://postgres:password@localhost:5432/expense_voucher_db` |
| `SECRET_KEY` | a long random string used to sign JWTs |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | token lifetime in minutes (default 60) |

> If your database password contains special characters such as `@`, they
> must be URL-encoded in `DATABASE_URL` (`@` → `%40`).

---

## API Overview

Base URL (through the frontend proxy): `/api`

| Method | Endpoint | Purpose | Role |
|--------|----------|---------|------|
| POST | /api/auth/login | Login, returns JWT + user | Public |
| GET | /api/auth/me | Current user from token | Any |
| GET | /api/vouchers | List (search/filter/sort) | Any (scoped) |
| POST | /api/vouchers | Create voucher (draft) | employee |
| GET | /api/vouchers/{id} | Voucher details | Any (scoped) |
| PUT | /api/vouchers/{id} | Edit draft | employee (owner) |
| DELETE | /api/vouchers/{id} | Delete draft | employee (owner) |
| POST | /api/vouchers/{id}/submit | Submit draft | employee (owner) |
| POST | /api/vouchers/{id}/employee-signature | Upload employee signature | employee (owner) |
| POST | /api/vouchers/{id}/director-signature | Upload director signature | director |
| POST | /api/vouchers/{id}/approve | Approve submitted voucher | director |
| POST | /api/vouchers/{id}/reject | Reject with required reason | director |
| GET | /api/vouchers/{id}/signature/{employee\|director} | Serve a signature image | Any (scoped) |
| GET | /api/vouchers/pending-approvals | Submitted vouchers | director |
| GET | /api/dashboard/employee | Employee stats (own) | employee |
| GET | /api/dashboard/director | Queue stats + recent activity | director |
| GET | /api/dashboard/accounts | Org stats + recent approved | accounts |
| GET | /health | Health check | Public |

Search / filter / sort query parameters on `GET /api/vouchers`:
`search`, `status`, `department`, `category`, `date_from`, `date_to`,
`min_amount`, `max_amount`, `sort_by`, `order`.

Full interactive documentation is available in Swagger at
http://127.0.0.1:8000/docs.

---

## Error Handling

| Status | Meaning | Example |
|--------|---------|---------|
| 400 | Missing precondition | Submit without a signature |
| 401 | Not authenticated | No / invalid / expired JWT |
| 403 | Forbidden | Wrong role, or another employee's voucher |
| 404 | Not found | Unknown voucher id |
| 409 | State conflict | Editing a submitted voucher |
| 422 | Validation error | amount <= 0, invalid enum |
| 500 | Unexpected error | Server exception |

---

## Security Notes

- Passwords are hashed with **bcrypt** (never stored in plain text)
- JWTs are signed with `SECRET_KEY` and expire
- **Every** protected endpoint validates the token (`get_current_user`)
- Role checks use `require_role(...)` — no duplicated auth logic
- Employees can never access another employee's voucher (server-side
  ownership checks + SQL filters)
- Signature uploads validate file type and size
- `.env`, `.venv/`, `uploads/`, `node_modules/`, `dist/` are git-ignored

---

## Known Assumptions

1. **"Submitted" = "Pending approval"** — the director acts immediately
   after an employee submits, so there is no separate additional status.
2. **"Total amount claimed"** excludes drafts (a draft is not yet claimed).
3. **"Rejected today"** uses `updated_at` because rejections have no
   dedicated timestamp column; the last change to a rejected voucher is
   the rejection itself.
4. Signatures are stored as image files in `backend/uploads/` (public
   folder in the filesystem, not in the database).

---

Built with **React + FastAPI + PostgreSQL + JWT**. © Prachay Assessment Task.
Last updated: 2026

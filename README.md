# EVENTHUB — Event & Ticket Booking Management System

EVENTHUB is an enterprise-grade, full-stack event management and ticket reservation platform designed with a primary focus on robust Database Management System (DBMS) principles, high-performance API design, concurrency control, and a modern reactive user experience.

---

## 1. Project Overview & Architecture

EVENTHUB connects event organizers and attendees through a clean, secure, multi-tier architecture:

```text
React 19 + TypeScript + Vite Frontend (Phase 6)
                      ↓
           FastAPI REST API Layer (Phase 5)
                      ↓
         API Routers & Dependencies (RBAC / JWT)
                      ↓
         Pydantic v2 Schemas (Validation & Safe DTOs)
                      ↓
             Domain Service Layer
                      ↓
      Authoritative Booking Transaction Service
        (Row-Level Locking & SELECT FOR UPDATE)
                      ↓
            SQLAlchemy 2.0 ORM Engine
                      ↓
               PostgreSQL 18.6
     (16 Tables • 5 Views • 4 Stored Functions • 18 Triggers)
```

---

## 2. Technology Stack

### Database Layer
- **PostgreSQL 18.6**: Authoritative relational database management system.
- **psycopg (psycopg 3)**: High-performance Python PostgreSQL DBAPI adapter.
- **SQLAlchemy 2.0**: Next-generation Python SQL toolkit and Object Relational Mapper (ORM).
- **Alembic**: Database schema migration and version control framework.

### Backend Layer
- **Python 3.13+**: Core runtime.
- **FastAPI 0.115+**: Modern, asynchronous web framework for building secure RESTful APIs.
- **Pydantic v2 & Pydantic-Settings**: Schema validation, serialization, and environment configuration.
- **PyJWT**: Secure JSON Web Token creation, decoding, and cryptographic validation.
- **Uvicorn**: High-throughput ASGI server implementation.
- **Pytest & HTTPX**: Automated test execution and API integration testing.

### Frontend Layer (Phase 6 Placeholder)
- **React 19**: Modern component-based user interface library.
- **TypeScript**: Static typing for front-end safety and maintainability.
- **Vite**: Next-generation front-end build tool and dev server.
- **Tailwind CSS**: Utility-first CSS framework for clean, responsive design.

---

## 3. Project Structure

```text
EVENTHUB/
├── database/
│   ├── migrations/       # Alembic migrations (Phases 2 & 4)
│   ├── schema/           # Relational schema DDL definitions
│   ├── seeds/            # Initial and mock data insertion scripts
│   ├── views/            # Analytical and reporting database views
│   ├── functions/        # Stored procedures and custom PostgreSQL functions
│   ├── triggers/         # Automated business rule and audit triggers
│   ├── queries/          # Complex analytical and reporting SQL queries
│   └── exports/          # Database backups and schema exports
│
├── backend/
│   ├── app/
│   │   ├── api/          # API dependencies and router definitions
│   │   │   ├── deps.py   # DB injection, JWT parsing, and RBAC guards
│   │   │   └── routers/  # 16 domain routers (Auth, Events, Bookings, etc.)
│   │   ├── core/         # Settings, password hashing, JWT, and exceptions
│   │   ├── db/           # Database engine, session maker, and DeclarativeBase
│   │   ├── models/       # 16 SQLAlchemy ORM entity models
│   │   ├── schemas/      # Pydantic v2 request/response schemas
│   │   ├── services/     # Business logic & authoritative booking transaction service
│   │   └── main.py       # FastAPI application entrypoint and middleware
│   ├── tests/            # Pytest test suite (97 tests passing)
│   │   └── api/          # Comprehensive API integration tests
│   ├── alembic.ini       # Alembic migration configuration
│   └── requirements.txt  # Python package dependencies
│
├── frontend/             # React + TypeScript + Vite frontend
├── docs/                 # API, architecture, and database documentation
│   ├── api.md            # Complete REST API specification
│   ├── architecture.md   # Architectural design documents
│   └── database.md       # Comprehensive DBMS documentation
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## 4. PostgreSQL Database Setup

> **REQUIREMENT:**
> The PostgreSQL database named **`eventhub`** must exist and be accessible.

### Database Connection Parameters
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Database Name**: `eventhub`
- **Service Name**: `postgresql-x64-18`

Ensure the PostgreSQL service is active:
```powershell
Get-Service postgresql*
```

---

## 5. Backend Setup & Configuration

### Prerequisites
- Python 3.11+ installed and available on PATH.

### Installation Steps
1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Activate virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Environment Configuration
Copy `.env.example` in the project root to `.env`:
```ini
DATABASE_URL=postgresql+psycopg://postgres:1234@localhost:5432/eventhub
APP_ENV=development
ENVIRONMENT=development
JWT_SECRET_KEY=eventhub-super-secret-jwt-key-change-in-production-2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

---

## 6. Running FastAPI Server

With the virtual environment activated from the `backend` directory:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Accessing the API & Documentation:
- **Root Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **API v1 Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON**: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

## 7. API Architecture & Domains

The REST API exposes 64 endpoints organized cleanly across 16 domain routers:

1. **Authentication (`/api/v1/auth`)**: Registration, login, token refresh, `/me` profile, and stateless logout.
2. **Users (`/api/v1/users`)**: Profile retrieval, profile updates, and safe public inspection.
3. **Categories (`/api/v1/categories`)**: Public event category catalog.
4. **Venues (`/api/v1/venues`)**: Physical venue specs and seat maps.
5. **Events (`/api/v1/events`)**: Published event search, filtering, detail, real-time availability, and public seat maps.
6. **Ticket Types (`/api/v1/ticket-types`)**: Multi-tier pricing and tier definitions.
7. **Seats (`/api/v1/seats`)**: Safe seat availability endpoints.
8. **Bookings (`/api/v1/bookings`)**: Customer ticket booking using Phase 4 row-locking transaction logic, booking cancellation, and hold expiration.
9. **Payments (`/api/v1/payments`, `/api/v1/bookings/{id}/payment`)**: Simulated payment gateway callbacks (`SUCCESS` / `FAILED`).
10. **Tickets (`/api/v1/tickets`)**: Issued digital tickets, QR verification tokens, and gate scanner validation (`ACTIVE` -> `USED`).
11. **Reviews (`/api/v1/reviews`, `/api/v1/events/{id}/reviews`)**: Verified reviews (ratings 1–5, unique per user/event).
12. **Favorites (`/api/v1/favorites`)**: Customer event bookmarking.
13. **Notifications (`/api/v1/notifications`)**: In-app notifications and read-state management.
14. **Organizer (`/api/v1/organizer`)**: Organization profile, event lifecycle (`DRAFT` -> `PUBLISHED` -> `CANCELLED`), ticket tier management, and sales analytics.
15. **Admin (`/api/v1/admin`)**: User roles and status governance, catalog curation, system audit trail, and expired hold maintenance.
16. **Analytics (`/api/v1/analytics`)**: Read-only reporting backed directly by PostgreSQL views.

---

## 8. Database Features & Concurrency Guarantees

EVENTHUB showcases advanced PostgreSQL capabilities:
- **5 Views**: `v_event_sales_summary`, `v_event_occupancy`, `v_organizer_revenue`, `v_monthly_booking_summary`, `v_event_rating_summary`.
- **4 Stored Functions**: `calculate_booking_total()`, `get_available_ticket_count()`, `get_event_revenue()`, `release_expired_holds()`.
- **18 Triggers**: Automated audit logging across users, events, and bookings; seat state consistency; sold count synchronization.
- **Row-Level Locking**: `SELECT ... FOR UPDATE` prevents double-booking under concurrent transactional stress.
- **Zero Password Leakage**: Passwords are never stored in plaintext, never returned in APIs, and strictly masked in audit logs.

---

## 9. Automated Testing Suite

Run all automated test suites from the `backend` directory:

```bash
# Execute entire test suite (111 tests)
pytest -v

# Run concurrency and double-booking prevention regression tests
pytest -v tests/test_concurrency.py

# Run transactional atomicity and rollback tests
pytest -v tests/test_transactions.py

# Run database relational integrity tests
pytest -v tests/test_database_integrity.py

# Run API endpoint integration tests (75 tests)
pytest -v tests/api/
```

---

## 10. Development Phases Status

- [x] **Phase 1: Project Foundation**: Directory architecture, PostgreSQL setup, FastAPI skeleton, Alembic, React base.
- [x] **Phase 2: Database Foundation**: 16 core PostgreSQL tables, foreign keys, unique constraints, check constraints, indexes.
- [x] **Phase 3: Demo Data & Exports**: Deterministic seeder, 16 CSV exports, SQL dump, analytics verification.
- [x] **Phase 4: Advanced DBMS Features**: 5 views, 4 stored functions, 18 triggers, row-level locking, double-booking prevention.
- [x] **Phase 5: Production-Style FastAPI Backend**: 16 routers, 64 endpoints, JWT authentication, RBAC, transaction service integration, Swagger docs, 97 passing tests.
- [x] **Phase 6: Frontend Application**: Modern React 19, TypeScript, Tailwind CSS, responsive customer, organizer, and admin dashboards, seat map reservation flow, 14 passing unit/integration tests.
- [x] **Phase 7: Database Portal & DBMS Showcase**: Dedicated educational /database portal showcasing all 16 tables, 5 analytical views, 4 stored functions, 18 triggers, ER relationships, normalization, constraints, indexes, row-level locking concurrency, sanitized audit trail, 15 pre-crafted query cards, and secure demo exports. Backed by 14 read-only REST endpoints and zero arbitrary SQL exposure.

---

## 11. Database Portal & DBMS Showcase (`/database`)

The EVENTHUB Database Portal is a dedicated educational and technical showcase designed for demonstrating advanced relational database design and DBMS engineering in academic presentations, vivas, and architectural reviews.

- **Primary Route**: `/database`
- **Sub-Views**:
  - `Overview`: Real-time system catalog statistics, architectural flow, and feature metrics.
  - `Tables`: Visual explorer for all 16 tables with schema attributes, keys, and row counts.
  - `Relationships`: Interactive visual Entity-Relationship (ER) graph showing foreign-key hierarchies.
  - `Views`: Live query outputs from all 5 PostgreSQL analytical views.
  - `Functions`: Documentation and safe pre-parameterized testing of custom stored functions.
  - `Triggers`: Visual event pipelines explaining all 18 triggers and audit functions.
  - `Indexes`: Catalog of performance B-Tree, unique, and composite indexes.
  - `Normalization`: Step-by-step breakdown of 1NF, 2NF, and 3NF decomposition in EVENTHUB.
  - `Concurrency`: Visual timeline demonstrating `SELECT ... FOR UPDATE` row-level locking and 409 conflict prevention.
  - `Queries`: 15 pre-crafted SQL queries (JOINs, Window Functions, CTEs, Aggregations) with execution outputs and 1-click SQL copy.
  - `Concepts`: Viva/exam reference guide defining essential DBMS terms with EVENTHUB examples.
  - `Exports`: One-click secure downloads for SQL dumps and CSV datasets.
- **Safety Architecture**:
  - **Zero Arbitrary SQL**: No open query consoles or raw SQL input from the frontend.
  - **Read-Only**: Strictly `GET` requests hitting allowlisted catalog queries.
  - **Zero Credential Exposure**: Sensitive columns (`password_hash`, tokens) are strictly stripped or masked with `[PROTECTED]`.

For complete documentation, see [docs/DATABASE_PORTAL.md](docs/DATABASE_PORTAL.md).

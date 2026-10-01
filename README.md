# EVENTHUB — Event & Ticket Booking Management System

EVENTHUB is an enterprise-grade, full-stack event management and ticket reservation platform designed with a primary focus on robust Database Management System (DBMS) principles, high-performance API design, and a modern reactive user experience.

---

## 1. What is EVENTHUB?

EVENTHUB provides a unified platform connecting event organizers and attendees. It manages event lifecycle workflows, complex multi-tier ticket inventory, high-concurrency seat and ticket reservations, transaction processing, and analytical reporting.

The system is built on relational database integrity, utilizing advanced PostgreSQL features such as foreign key constraints, atomic transactions, ACID guarantees, triggers, stored procedures, and optimized views.

---

## 2. Technology Stack

### Database Layer
- **PostgreSQL 18.6**: Primary relational database management system.
- **psycopg (psycopg 3)**: High-performance Python PostgreSQL adapter.
- **SQLAlchemy 2.0**: Next-generation Python SQL toolkit and Object Relational Mapper (ORM).
- **Alembic**: Database schema migration and version control framework.

### Backend Layer
- **Python 3.13+**: Core runtime.
- **FastAPI**: Modern, high-performance web framework for building RESTful APIs.
- **Pydantic v2 & Pydantic-Settings**: Data validation, serialization, and environment configuration management.
- **Uvicorn**: Lightning-fast ASGI web server implementation.
- **Pytest & HTTPX**: Automated test execution and API integration testing.

### Frontend Layer
- **React 19**: Modern component-based user interface library.
- **TypeScript**: Static typing for front-end safety and maintainability.
- **Vite**: Next-generation front-end build tool and dev server.
- **Tailwind CSS**: Utility-first CSS framework for clean, responsive design.

### Development & Version Control
- **Git & GitHub**: Version control and collaborative source code management.
- **Antigravity IDE**: AI-assisted development environment.

---

## 3. Project Structure

```text
EVENTHUB/
├── database/
│   ├── migrations/       # Alembic migrations, versions, and env.py
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
│   │   ├── api/          # API route definitions and endpoint versioning (v1)
│   │   ├── core/         # Configuration, settings, and application constants
│   │   ├── db/           # Database engine, session maker, and DeclarativeBase
│   │   ├── models/       # SQLAlchemy ORM entity models
│   │   ├── schemas/      # Pydantic schemas for data validation
│   │   ├── services/     # Core domain business logic and services
│   │   └── main.py       # FastAPI application entrypoint and middleware
│   ├── tests/            # Test suites (pytest)
│   ├── alembic.ini       # Alembic migration configuration
│   └── requirements.txt  # Python package dependencies
│
├── frontend/
│   ├── public/           # Static assets
│   ├── src/              # React components, pages, and styles
│   ├── package.json      # Node.js project manifest and scripts
│   ├── tsconfig.json     # TypeScript compiler configuration
│   └── vite.config.ts    # Vite bundler configuration
│
├── scripts/              # Utility scripts for maintenance and deployment
├── docs/                 # Architecture, API, and database documentation
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## 4. PostgreSQL Database Setup

> **IMPORTANT REQUIREMENT:**
> The PostgreSQL database named **`eventhub`** must already exist before executing database-dependent operations or running schema migrations in subsequent phases.

### Database Connection Parameters
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Database Name**: `eventhub`
- **Service Name**: `postgresql-x64-18`

Ensure the PostgreSQL service is active:
```powershell
# Windows PowerShell check
Get-Service postgresql*
```

If creating the database manually on a fresh installation:
```sql
CREATE DATABASE eventhub;
```

---

## 5. Backend Setup

### Prerequisites
- Python 3.11+ installed and available on PATH.

### Installation Steps
1. Open terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```
4. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 6. Frontend Setup

### Prerequisites
- Node.js (v18 or higher; v24 recommended) and npm.

### Installation Steps
1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

---

## 7. Environment Variables

EVENTHUB uses environment variables for database connections and runtime flags.

1. Copy `.env.example` in the project root to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your local parameters inside `.env`:
   ```ini
   DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/eventhub
   ENVIRONMENT=development
   HOST=0.0.0.0
   PORT=8000
   API_V1_STR=/api/v1
   PROJECT_NAME=EVENTHUB
   ```

> **Security Note**: Never commit `.env` or plain-text credentials to Git. The `.gitignore` file is pre-configured to ignore all `.env` files except `.env.example`.

---

## 8. How to Run the Backend

With the virtual environment activated from the `backend` directory:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Accessing the API:
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Running Backend Tests:
```bash
pytest
```

---

## 9. How to Run the Frontend

From the `frontend` directory:
```bash
npm run dev
```

The application will start at:
- **Local Application URL**: [http://localhost:5173](http://localhost:5173)

### Building for Production:
```bash
npm run build
```

---

---

## 10. Demo Dataset

EVENTHUB includes a realistic, relationally consistent, and **100% fictional** demo dataset designed for DBMS queries, complex SQL analytics, and UI prototyping.

### Fictional Data Notice
All users, organizations, emails, phone numbers, and payment references are purely fictional. No real personal or financial credentials are used. Passwords are deterministically hashed via PBKDF2-HMAC-SHA256.

### How to Seed the Database
Run the deterministic seed script from the project root:
```bash
python database/seeds/seed_demo_data.py
```
*(The seed script is idempotent; re-running it resets and repopulates the 16 core tables safely within an atomic transaction.)*

### How to Validate
Run the analytical verification queries against the seeded database:
```bash
# Execute 15 business analytics queries (JOINs, aggregations, window functions)
psql -U postgres -d eventhub -f database/queries/seed_validation.sql

# Or run the automated Pytest validation suite
cd backend
pytest -v
```

### Pre-packaged Demo Exports
Demo database exports are generated in `database/exports/`:
- **SQL Dump**: `database/exports/eventhub_demo.sql` (Complete DDL + demo records)
- **CSV Files**: `database/exports/csv/*.csv` (16 individual table CSV files)
- **ZIP Archive**: `database/exports/eventhub_csv_dataset.zip` (All 16 CSVs compressed)

---

## 11. Current Development Phase

### Phase 1: Project Foundation (Completed)
- [x] Standardized DBMS project directory structure.
- [x] PostgreSQL connection settings and template configuration (`.env.example`).
- [x] FastAPI skeleton with `/health` verification endpoint.
- [x] SQLAlchemy 2.0 Base and engine structure prepared.
- [x] Alembic configuration pointing to `database/migrations`.
- [x] React + TypeScript + Vite frontend initialized with Tailwind CSS.
- [x] Automated test suite verifying health endpoint.
- [x] Git repository configured with comprehensive `.gitignore`.

### Phase 2: Database Foundation (Completed)
- [x] Relational schema modeling (16 tables) in SQLAlchemy 2.0.
- [x] Reversible Alembic database migration (`171a3cddf5ff`).
- [x] Primary keys, foreign keys, unique candidate keys, and check constraints.
- [x] B-tree indexes for foreign keys and frequent query filters.
- [x] Pure SQL DDL export (`database/schema/eventhub_schema.sql`).
- [x] Database catalog verification script (`database/queries/verify_schema.sql`).

### Phase 3: Demo Data, Seeding & Exports (Current - Completed)
- [x] Deterministic transactional demo seeder (`database/seeds/seed_demo_data.py`).
- [x] 16 populated tables adhering to exact volume and constraint requirements.
- [x] 15 business analytics and SQL validation queries (`database/queries/seed_validation.sql`).
- [x] Automated seed integrity tests in Pytest (`backend/tests/test_seed.py`).
- [x] CSV exports for all 16 tables (`database/exports/csv/`) and ZIP archive.
- [x] Standalone SQL demo export (`database/exports/eventhub_demo.sql`).

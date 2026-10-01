# Database Design & Configuration

## Database Engine
- **Engine**: PostgreSQL 18.6
- **Database Name**: `eventhub`
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Driver**: `psycopg` (psycopg 3)

## Structure
The database layer is organized as follows:
- `database/schema/`: Raw DDL definitions and relational schema.
- `database/migrations/`: Alembic database version control and migration scripts.
- `database/seeds/`: Realistic seed data scripts for local development and testing.
- `database/views/`: Database views for reporting and optimized query abstractions.
- `database/functions/`: Stored procedures and custom PostgreSQL functions.
- `database/triggers/`: Automated triggers for business rule enforcement and audit trails.
- `database/queries/`: Analytical, reporting, and complex transactional queries.
- `database/exports/`: Schema and data backup dumps.

## Status
*Phase 1 - Project Foundation*: Core connection parameters and structure established. The 16 relational entities, foreign keys, constraints, and migrations will be implemented in Phase 2.

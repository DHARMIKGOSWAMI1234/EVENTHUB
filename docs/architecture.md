# Architecture Overview

This document outlines the architecture for **EVENTHUB**, a full-stack Event & Ticket Booking Management System.

## High-Level Architecture

EVENTHUB follows a clean, decoupled architecture:

- **Frontend**: Single Page Application built with React, TypeScript, Vite, and Tailwind CSS.
- **Backend API**: High-performance RESTful API built with FastAPI and Python.
- **Data Access & ORM**: SQLAlchemy 2.0 (async/sync engine with psycopg driver) and Alembic for schema migrations.
- **Core Database**: PostgreSQL (version 18.6+).

```mermaid
graph TD
    Client[Web Client (React + TS + Vite)] -->|HTTP / JSON| API[FastAPI Backend]
    API -->|SQLAlchemy / psycopg| DB[(PostgreSQL 18.6 eventhub)]
```

## Status
*Phase 1 - Project Foundation*: Initial project skeleton, development environment, and health check endpoints established. Detailed architectural specifications will be expanded in subsequent phases.

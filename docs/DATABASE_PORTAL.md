# EVENTHUB — Database Portal & DBMS Showcase Documentation

## 1. Executive Summary & Purpose

The **EVENTHUB Database Portal** (`/database`) is a comprehensive, production-grade DBMS showcase and educational portal built directly into EVENTHUB. It visually demonstrates the relational database architecture, SQL normalization, schema integrity constraints, ACID transaction isolation, pessimistic row-level locking (`SELECT ... FOR UPDATE`), analytical views, stored procedures (PL/pgSQL), automated database triggers, B-tree indexing, and audit logging implemented across Phases 2 through 4.

The portal provides an interactive, read-only window into the authoritative **PostgreSQL 18.6** database engine without ever allowing arbitrary SQL execution or exposing private user credentials.

---

## 2. End-to-End System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │      React 19 + TypeScript + Vite            │
                    │         EVENTHUB Database Portal             │
                    │               (/database)                    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           │ HTTP GET (Read-Only)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │          FastAPI REST Gateway                │
                    │      Strict Allowlist /api/v1/database       │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           │ SQLAlchemy 2.x
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            psycopg3 Session Pool             │
                    │         Safe Parameterized Queries           │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │                       PostgreSQL 18.6 Engine                         │
        │                                                                      │
        │  ├── 16 Core 3NF Relational Tables                                   │
        │  ├── 17 Foreign Key Referential Integrity Constraints                │
        │  ├── Unique & Check Invariants (e.g., rating 1-5, capacity > 0)      │
        │  ├── 55 Optimized B-Tree Indexes                                     │
        │  ├── 5 Analytical PostgreSQL Views (v_*)                             │
        │  ├── 4 Stored Business Functions (PL/pgSQL)                          │
        │  ├── 5 Trigger Functions & 18 Active Triggers                        │
        │  ├── ACID Transactions with Row Locking (SELECT FOR UPDATE)          │
        │  └── Immutable JSONB Audit Logging (audit_logs)                      │
        └──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Portal Routes & Views

The portal is mounted at `/database` and accessible to all users, evaluators, and students:

| Route | View Name | Description |
|---|---|---|
| `/database` | Overview & Architecture | Hero banner, DBMS metrics, 3-tier architecture diagram, record distributions. |
| `/database/tables` | Relational Tables Explorer | 16 core table cards with category filters, row counts, and deep schema viewer. |
| `/database/relationships` | ER Diagram & Foreign Keys | Interactive Entity-Relationship graph mapping 17 foreign key edges with cardinality tags (1:N, 1:1). |
| `/database/views` | Analytical Views | Detailed breakdown of the 5 PostgreSQL views, DDL SQL definitions, and real sample data. |
| `/database/functions` | Stored Procedures | PL/pgSQL business logic routines and trigger procedures with parameters and code blocks. |
| `/database/triggers` | Active Triggers | Complete catalog of the 18 active triggers, target tables, event manipulations, and architectural effects. |
| `/database/indexes` | B-Tree Indexes | Analysis of the 55 B-tree indexes, indexed columns, uniqueness, and lookup rationales. |
| `/database/normalization` | Normalization & Rules | Educational comparison of 0NF anomalies vs. 1NF, 2NF, 3NF decomposition and constraints. |
| `/database/concurrency` | ACID & Concurrency | Visual timeline of the double-booking problem, `SELECT FOR UPDATE` row locks, and audit trails. |
| `/database/queries` | SQL Query Showcase | 15 predefined live queries covering JOINs, Subqueries, CTEs, Window Functions (`DENSE_RANK`), and live execution. |
| `/database/concepts` | DBMS Viva Cheat-Sheet | Comprehensive viva/presentation guide mapping relational theory to EVENTHUB implementations. |
| `/database/exports` | Data Artifacts | Verified downloads for `eventhub_demo.sql`, `eventhub_csv_dataset.zip`, and `eventhub_schema.sql`. |

---

## 4. Backend REST Endpoints (`/api/v1/database`)

All endpoints are strictly read-only (`GET` method only), parameter-validated, and allowlisted against SQL injection:

```http
GET /api/v1/database/overview
GET /api/v1/database/tables
GET /api/v1/database/tables/{table_name}
GET /api/v1/database/relationships
GET /api/v1/database/views
GET /api/v1/database/views/{view_name}
GET /api/v1/database/functions
GET /api/v1/database/triggers
GET /api/v1/database/indexes
GET /api/v1/database/statistics
GET /api/v1/database/queries
GET /api/v1/database/queries/{query_key}
GET /api/v1/database/exports
GET /api/v1/database/exports/download/{filename}
```

---

## 5. Security & Privacy Architecture

The Database Portal strictly complies with defense-in-depth security principles:

1. **Zero Arbitrary SQL Execution**:
   - The backend contains no endpoint like `POST /execute-sql`.
   - The frontend contains no SQL input console, textarea, or freeform query executor.
   - All executed queries come from a server-side allowlisted catalog of 15 predefined queries.
2. **Strict Parameter Allowlisting**:
   - Table names are validated against the `CORE_TABLES` allowlist (16 tables). Unknown table names return HTTP 404.
   - View names are validated against the `CORE_VIEWS` allowlist (5 views).
   - Export filenames are strictly matched to predefined relative paths, preventing directory traversal (`../../`).
3. **Sensitive Field Masking**:
   - Sample row inspection automatically masks sensitive attributes (`password_hash`, `qr_token`, `token_hash`) with `[PROTECTED]`.
   - Phone numbers and email addresses are partially masked in public views.
4. **Trigger-Level Secret Stripping**:
   - The PostgreSQL trigger `audit_user_change()` explicitly strips `password_hash` from `OLD` and `NEW` records before serializing into JSONB audit snapshots.

---

## 6. Relational Schema Summary (16 Core Tables)

1. **`users`**: User identity, roles (`CUSTOMER`, `ORGANIZER`, `ADMIN`), and bcrypt password hashes.
2. **`organizers`**: Organization profile, bio, and contact details linked 1-to-1 with `users`.
3. **`categories`**: Event classification taxonomy (Music, Tech, Theatre, Sports, Comedy, Workshop).
4. **`venues`**: Physical facility records with capacity and address coordinates.
5. **`venue_seats`**: Fixed venue seating layouts (section, row, seat label).
6. **`events`**: Scheduled events with lifecycle states (`DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`).
7. **`ticket_types`**: Ticket pricing tiers and capacity quotas per event.
8. **`event_seats`**: Dynamic per-event seat allocations (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`).
9. **`bookings`**: Customer reservations with reference codes and total monetary amounts.
10. **`booking_items`**: Line items linking bookings to ticket tiers, seats, and subtotal amounts.
11. **`payments`**: Simulated payment records (`UPI`, `CARD`, `NET_BANKING`, `CASH`).
12. **`tickets`**: Individual verified admission passes with unique codes and QR tokens.
13. **`reviews`**: Verified customer ratings (1–5) constrained uniquely per customer-event pair.
14. **`notifications`**: In-app system alerts dispatched to users.
15. **`audit_logs`**: Immutable event-driven change ledger generated by triggers.
16. **`favorites`**: User wishlists constrained uniquely per user-event pair.

---

## 7. Analytical Views (5 Views)

- **`v_event_sales_summary`**: Aggregates tickets sold, confirmed booking counts, and gross revenue per event.
- **`v_event_occupancy`**: Computes venue capacity utilization and occupancy percentages.
- **`v_organizer_revenue`**: Aggregates platform-wide revenue and event counts grouped by organizer.
- **`v_monthly_booking_summary`**: Historical monthly booking volumes and confirmed payment totals.
- **`v_event_rating_summary`**: Customer review counts and average ratings per event.

---

## 8. Stored Procedures & Triggers

### Stored Functions
- `calculate_booking_total(p_booking_id)`: Authoritatively sums line items for a booking.
- `get_available_ticket_count(p_event_id)`: Calculates remaining ticket inventory.
- `get_event_revenue(p_event_id)`: Sums confirmed booking revenue for an event.
- `release_expired_holds()`: Resets expired seat holds back to `AVAILABLE`.

### Triggers (18 Active)
- `update_updated_at_column` (8 tables): Synchronizes `updated_at` timestamps on row updates.
- `audit_booking_change` (`bookings`): Captures lifecycle transitions into `audit_logs`.
- `audit_user_change` (`users`): Records account mutations with automatic password hash redaction.
- `validate_event_seat_state` (`event_seats`): Prevents invalid state jumps (e.g. `BOOKED` directly to `AVAILABLE`).
- `update_ticket_type_sold_count` (`tickets`): Synchronizes `sold_count` atomically on ticket issuance or cancellation.

---

## 9. Verification & Test Coverage

- **Backend Tests**: 111/111 passing (`pytest -v`).
  - 14 dedicated tests in `test_database_portal_api.py`.
- **Frontend Tests**: 23/23 passing (`vitest run`).
  - 9 dedicated tests in `DatabasePortal.test.tsx`.
- **TypeScript**: 0 errors (`tsc -b`).
- **Production Bundle**: Built in 613ms with zero warnings.

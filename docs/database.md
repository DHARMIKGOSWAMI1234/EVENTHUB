# Database Design & Configuration

## 1. Database Specification
- **Engine**: PostgreSQL 18.6
- **Database Name**: `eventhub`
- **Host**: `localhost`
- **Port**: `5432`
- **Default User**: `postgres`
- **Python Driver**: `psycopg` (psycopg 3)
- **ORM / Toolkit**: SQLAlchemy 2.0 (Declarative Mapping)
- **Migration Framework**: Alembic

## 2. Purpose
EVENTHUB is a full-stack, DBMS-focused event and ticket booking platform designed around relational database principles. The database layer guarantees ACID compliance, strict referential integrity, domain constraint validation, indexing for query efficiency, concurrency-safe seat allocation, and immutable audit tracking.

---

## 3. Core Relational Schema (16 Tables)

The schema comprises exactly 16 core normalized relational tables:

| # | Table Name | Description | Primary Key | Key Foreign Keys |
|---|---|---|---|---|
| 1 | `users` | Accounts for customers, organizers, and administrators | `id` (BIGINT) | None |
| 2 | `organizers` | Event organizer profiles linked 1-to-1 with a user | `id` (BIGINT) | `user_id` → `users.id` |
| 3 | `categories` | Event genres and classification taxonomy | `id` (BIGINT) | None |
| 4 | `venues` | Physical event venues and locations | `id` (BIGINT) | None |
| 5 | `venue_seats` | Seating layouts and blueprint configurations | `id` (BIGINT) | `venue_id` → `venues.id` |
| 6 | `events` | Core event listings, dates, schedules, and statuses | `id` (BIGINT) | `organizer_id`, `category_id`, `venue_id` |
| 7 | `ticket_types` | Ticket tiers, pricing, and available quotas | `id` (BIGINT) | `event_id` → `events.id` |
| 8 | `bookings` | Customer ticket reservation transactions | `id` (BIGINT) | `user_id` → `users.id`, `event_id` → `events.id` |
| 9 | `event_seats` | Real-time seat allocation, hold locks, and booking status | `id` (BIGINT) | `event_id`, `venue_seat_id`, `held_by_booking_id` |
| 10 | `booking_items` | Line items detailing quantity and price per tier | `id` (BIGINT) | `booking_id` → `bookings.id`, `ticket_type_id` |
| 11 | `payments` | Financial records of transactions for bookings | `id` (BIGINT) | `booking_id` → `bookings.id` |
| 12 | `tickets` | Issued tickets with unique ticket codes and QR tokens | `id` (BIGINT) | `booking_id`, `ticket_type_id`, `event_seat_id` |
| 13 | `reviews` | User reviews and ratings (1–5) for events | `id` (BIGINT) | `user_id` → `users.id`, `event_id` → `events.id` |
| 14 | `notifications` | In-app user notifications and system alerts | `id` (BIGINT) | `user_id` → `users.id` |
| 15 | `audit_logs` | Security and change log with JSONB snapshots | `id` (BIGINT) | `user_id` → `users.id` (nullable) |
| 16 | `favorites` | User saved/wishlisted events | `id` (BIGINT) | `user_id` → `users.id`, `event_id` → `events.id` |

---

## 4. Foreign Key Constraints & Safe Delete Rules

To preserve historical and financial integrity, restrictive delete rules are enforced rather than blanket cascading deletions:

| Source Column | Target Reference | ON DELETE Behavior | Rationale |
|---|---|---|---|
| `organizers.user_id` | `users.id` | `RESTRICT` | Cannot delete a user who is registered as an organizer. |
| `events.organizer_id` | `organizers.id` | `RESTRICT` | Organizers with active/past events cannot be deleted. |
| `events.category_id` | `categories.id` | `RESTRICT` | Categories assigned to events cannot be deleted. |
| `events.venue_id` | `venues.id` | `RESTRICT` | Venues hosting events cannot be deleted. |
| `venue_seats.venue_id` | `venues.id` | `CASCADE` | Deleting a venue removes its physical seating topology. |
| `ticket_types.event_id` | `events.id` | `RESTRICT` | Ticket types protect event sales history. |
| `bookings.user_id` | `users.id` | `RESTRICT` | Users with financial/booking history cannot be deleted. |
| `bookings.event_id` | `events.id` | `RESTRICT` | Events with booking records cannot be deleted. |
| `event_seats.event_id` | `events.id` | `RESTRICT` | Preserves seat allocation records. |
| `event_seats.venue_seat_id` | `venue_seats.id` | `RESTRICT` | Preserves link to venue seat blueprint. |
| `event_seats.held_by_booking_id` | `bookings.id` | `SET NULL` | Nullable hold; released if booking expires or is cleared. |
| `booking_items.booking_id` | `bookings.id` | `RESTRICT` | Line items cannot be removed from recorded bookings. |
| `booking_items.ticket_type_id` | `ticket_types.id` | `RESTRICT` | Ticket types linked to purchases cannot be deleted. |
| `payments.booking_id` | `bookings.id` | `RESTRICT` | Financial transactions must never be lost. |
| `tickets.booking_id` | `bookings.id` | `RESTRICT` | Issued tickets must remain permanently linked to booking. |
| `tickets.ticket_type_id` | `ticket_types.id` | `RESTRICT` | Ticket type link preserved for validation. |
| `tickets.event_seat_id` | `event_seats.id` | `RESTRICT` | Assigned seat link preserved. |
| `reviews.user_id` | `users.id` | `RESTRICT` | Review attribution preserved. |
| `reviews.event_id` | `events.id` | `RESTRICT` | Event reviews preserved. |
| `notifications.user_id` | `users.id` | `CASCADE` | Notifications safely delete with user account. |
| `audit_logs.user_id` | `users.id` | `SET NULL` | Audit records persist indefinitely even if actor is removed. |
| `favorites.user_id` | `users.id` | `CASCADE` | User bookmarks delete when user is removed. |
| `favorites.event_id` | `events.id` | `CASCADE` | Bookmarks cascade if an unbooked event is deleted. |

---

## 5. Domain Check Constraints & Unique Constraints

### Unique Constraints (Candidate Keys)
- `users`: `email`
- `organizers`: `user_id`
- `categories`: `name`
- `venue_seats`: `(venue_id, seat_label)`
- `events`: `slug`
- `bookings`: `booking_reference`
- `event_seats`: `(event_id, venue_seat_id)`
- `payments`: `transaction_reference`
- `tickets`: `ticket_code`, `qr_token`
- `reviews`: `(user_id, event_id)`
- `favorites`: `(user_id, event_id)`

### Domain Check Constraints
- `users.role`: `IN ('CUSTOMER', 'ORGANIZER', 'ADMIN')`
- `venues.capacity`: `> 0`
- `venue_seats.seat_number`: `> 0`
- `events.seating_mode`: `IN ('GENERAL_ADMISSION', 'RESERVED_SEATING')`
- `events.status`: `IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')`
- `events.end_time`: `end_time IS NULL OR end_time > start_time`
- `ticket_types.price`: `>= 0`
- `ticket_types.capacity`: `> 0`
- `ticket_types.sold_count`: `>= 0 AND <= capacity`
- `bookings.status`: `IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED')`
- `bookings.subtotal`, `discount_amount`, `tax_amount`, `total_amount`: `>= 0`
- `booking_items.quantity`: `> 0`
- `booking_items.unit_price`, `subtotal`: `>= 0`
- `event_seats.status`: `IN ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED')`
- `payments.payment_method`: `IN ('UPI', 'CARD', 'NET_BANKING', 'CASH')`
- `payments.status`: `IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')`
- `payments.amount`: `>= 0`
- `tickets.status`: `IN ('ACTIVE', 'USED', 'CANCELLED', 'REFUNDED')`
- `reviews.rating`: `BETWEEN 1 AND 5`

---

## 6. Indexing Strategy

Targeted B-tree indexes are implemented on high-frequency query filters, foreign keys, and sorting fields:
- `venues`: `(city)`
- `venue_seats`: `(venue_id)`
- `events`: `(event_date)`, `(category_id)`, `(organizer_id)`, `(venue_id)`
- `ticket_types`: `(event_id)`
- `bookings`: `(user_id)`, `(event_id)`
- `event_seats`: `(event_id, status)` (composite index for seat map polling), `(held_by_booking_id)`, `(venue_seat_id)`
- `booking_items`: `(booking_id)`, `(ticket_type_id)`
- `payments`: `(booking_id)`
- `tickets`: `(booking_id)`, `(ticket_type_id)`, `(event_seat_id)`
- `reviews`: `(event_id)`, `(user_id)`
- `notifications`: `(user_id, is_read)`
- `audit_logs`: `(user_id)`, `(entity_type, entity_id)`, `(created_at)`
- `favorites`: `(event_id)`, `(user_id)`

---

## 7. Migration Instructions

To run migrations from the `backend` directory:
```bash
# Apply all pending migrations to the database
alembic upgrade head

# Rollback one migration revision
alembic downgrade -1

# Rollback completely to base
alembic downgrade base
```

---

## 8. Demo Dataset (Phase 3)

### Fictional Data Safety
> [!IMPORTANT]
> All records in the demo dataset are **100% fictional**. No real personal names, actual emails, phone numbers, payment credentials, or passwords are used.
> - Email addresses strictly use safe domains: `@example.com` or `@example.org`.
> - Phone numbers use non-routable fictional numbers (`+1-555-01xx`).
> - Passwords are cryptographically hashed using PBKDF2-HMAC-SHA256 (`pbkdf2:sha256:100000$...`). Plaintext passwords are never stored.
> - Financial transactions and booking codes are simulated (`EVH-2026-xxxxxx`, `TXN-EVH-xxxxxx`).

### Dataset Volume Summary

| Table | Target Range | Actual Count | Notes |
|---|---|---|---|
| `users` | 30–50 | **45** | 3 Admins, 10 Organizers, 32 Customers |
| `organizers` | 8–12 | **10** | 10 organizations linked 1:1 to organizer users |
| `categories` | 10 | **10** | Music, Technology, Sports, Education, Business, Comedy, Workshop, Festival, Gaming, Networking |
| `venues` | 8–12 | **10** | Spanning Mumbai, Bengaluru, Delhi, Hyderabad, Pune, Chennai, etc. |
| `venue_seats` | Several hundred | **624** | Configured across 6 reserved seating venues (VIP, Premium, Standard) |
| `events` | 25–40 | **32** | 20 Published, 7 Completed, 3 Draft, 2 Cancelled |
| `ticket_types` | 60–100 | **89** | 2–3 tiers per event with capacities and dynamic sold counts |
| `event_seats` | Several hundred/thousand | **1,560** | Seat allocations across reserved events (Booked, Held, Available) |
| `bookings` | 80–150 | **110** | 82 Confirmed, 12 Pending, 8 Cancelled, 4 Expired, 4 Refunded |
| `booking_items` | 150–250 | **165** | Multi-item orders with mathematical subtotal consistency |
| `payments` | 80–150 | **110** | UPI, Card, Net Banking, and Cash transactions |
| `tickets` | 150–300 | **196** | Digital admissions (Active, Used, Cancelled, Refunded) with QR tokens |
| `reviews` | 40–80 | **55** | Ratings (1–5) and realistic feedback from completed event attendees |
| `notifications` | 50–100 | **80** | In-app alerts with read/unread statuses |
| `audit_logs` | 50–100 | **75** | Audit entries with structured JSONB snapshots |
| `favorites` | 50–100 | **75** | User event bookmarks |

---

## 9. Seeding & Reset Instructions

The database seeding process is fully deterministic (`SEED = 2026`), safe, and transaction-aware.

### How to Seed / Re-Seed:
From the project root:
```bash
python database/seeds/seed_demo_data.py
```
Or with backend virtual environment:
```bash
backend\.venv\Scripts\python database/seeds/seed_demo_data.py
```

### Idempotency & Reset Behavior:
Running the seed script executes an internal `TRUNCATE ... RESTART IDENTITY CASCADE` across all 16 tables within an atomic transaction. If any constraint or error occurs, the transaction rolls back completely, leaving the database clean and safe.

---

## 10. Verification & Analytics Queries

### Automated Pytest Suite
Run the comprehensive test suite verifying schema constraints, mathematical consistency, foreign keys, and analytical queries:
```bash
cd backend
pytest -v
```

### Analytical SQL Queries
Execute the 15 analytical validation queries demonstrating JOINs, aggregations, window functions, and business analytics:
```bash
psql -U postgres -d eventhub -f database/queries/seed_validation.sql
```

The script verifies:
1. Total users by role
2. Events by category
3. Events by organizer
4. Events by status
5. Bookings by status
6. Payment status distribution
7. Revenue by event
8. Revenue by organizer
9. Average event rating
10. Event occupancy percentage
11. Top customers by booking count
12. Most favorited events
13. Ticket status distribution
14. Monthly booking trends
15. Average ticket price by category

---

## 11. Demo Exports

Pre-packaged database exports suitable for staging and local demonstration are available in `database/exports/`:

1. **SQL Demo Script**:
   - `database/exports/eventhub_demo.sql`: Self-contained script containing full schema DDL + all 16 table demo INSERT statements.
2. **CSV Dataset (Individual)**:
   - `database/exports/csv/*.csv`: 16 individual comma-separated files containing raw table records.
3. **Compressed Archive**:
   - `database/exports/eventhub_csv_dataset.zip`: ZIP archive packaging all 16 CSV files.

---

## 12. Advanced DBMS Features

EVENTHUB implements advanced PostgreSQL database-level capabilities that elevate the project into a comprehensive relational database demonstration. Rather than delegating business rules and state validation entirely to application code, the database actively enforces data integrity, maintains synchronized audit trails, executes concurrent row-level locking, and optimizes complex analytical summaries.

### 12.1 PostgreSQL Views
EVENTHUB provides 5 curated SQL views encapsulating complex multi-table joins, CTE aggregations, and business metrics:

1. **`v_event_sales_summary`**:
   - **Purpose**: Event-level performance summary combining total bookings, confirmed bookings, tickets sold, and gross revenue.
   - **DBMS Technique**: CTE-based pre-aggregation of booking line items to prevent multiplication artifacts in multi-item orders; `FILTER (WHERE ...)` clauses for conditional metric summation.
2. **`v_event_occupancy`**:
   - **Purpose**: Calculates capacity, sold ticket volume, remaining seats, and occupancy percentages.
   - **DBMS Technique**: Division-by-zero protection using `NULLIF(sum(tt.capacity), 0)` and `round(..., 2)` floating precision formatting.
3. **`v_organizer_revenue`**:
   - **Purpose**: Aggregates gross organizer financial metrics, total events produced, total confirmed tickets, and average booking value.
   - **DBMS Technique**: Relational grouping by organizer primary key and name with safe division for average spend metrics.
4. **`v_monthly_booking_summary`**:
   - **Purpose**: Platform-wide chronological analysis of booking trends by month.
   - **DBMS Technique**: Temporal extraction functions `EXTRACT(YEAR/MONTH FROM created_at)` and `to_char(..., 'YYYY-MM')`.
5. **`v_event_rating_summary`**:
   - **Purpose**: Aggregates customer feedback metrics (total reviews, average rating, min rating, max rating) per event.
   - **DBMS Technique**: `COALESCE` null-fallback handling ensuring unreviewed events remain properly represented with 0.00 ratings.

### 12.2 Stored Functions (PL/pgSQL)
Custom server-side stored functions encapsulate deterministic calculation formulas and automated maintenance routines:

1. **`calculate_booking_total(subtotal, discount, tax)`**:
   - **Signature**: `(NUMERIC, NUMERIC, NUMERIC) -> NUMERIC(12, 2)`
   - **Classification**: `IMMUTABLE`
   - **Logic**: Evaluates `subtotal - discount + tax` while enforcing non-negative results `max(0, total)` and two-decimal rounding.
2. **`get_available_ticket_count(event_id)`**:
   - **Signature**: `(BIGINT) -> INTEGER`
   - **Classification**: `STABLE`
   - **Logic**: Computes remaining ticket capacity across all active ticket types for a given event, guarding against negative inventory.
3. **`get_event_revenue(event_id)`**:
   - **Signature**: `(BIGINT) -> NUMERIC(12, 2)`
   - **Classification**: `STABLE`
   - **Logic**: Sums `total_amount` strictly for `CONFIRMED` bookings, excluding pending, cancelled, and refunded orders.
4. **`release_expired_holds()`**:
   - **Signature**: `() -> INTEGER`
   - **Classification**: `VOLATILE`
   - **Logic**: Finds all `event_seats` in `HELD` status where `hold_expires_at < CURRENT_TIMESTAMP`. Transitions them back to `AVAILABLE` and clears hold metadata. Returns the count of released seats without touching `BOOKED` or `BLOCKED` seats.

### 12.3 Database Triggers
Active automated trigger mechanisms ensure consistent data state transitions and audit logging:

1. **Automatic Timestamp Refresh (`update_updated_at_column`)**:
   - `BEFORE UPDATE` trigger applied across `users`, `organizers`, `venues`, `events`, `ticket_types`, `bookings`, and `reviews`.
   - Guarantees `updated_at` reflects the exact microsecond of database modification without requiring client-side timestamp injection.
2. **Booking Audit Logging (`audit_booking_change`)**:
   - `AFTER INSERT OR UPDATE OR DELETE` on `bookings`.
   - Records full `JSONB` state snapshots of `old_data` and `new_data` into `audit_logs` table, tagging actions like `BOOKING_CREATED` and `BOOKING_STATUS_<STATUS>`.
3. **User Audit Sanitization (`audit_user_change`)**:
   - `AFTER INSERT OR UPDATE OR DELETE` on `users`.
   - Captures lifecycle events while strictly sanitizing JSON payloads: `password_hash` is explicitly deleted (`- 'password_hash'`) before writing to audit logs, ensuring zero credential leakage.
4. **Seat State Consistency Machine (`validate_event_seat_state`)**:
   - `BEFORE INSERT OR UPDATE` on `event_seats`.
   - Enforces relational invariants:
     - `AVAILABLE`: Clears hold fields.
     - `HELD`: Requires valid `held_by_booking_id` and future `hold_expires_at`. Auto-reverts to `AVAILABLE` if reference is detached.
     - `BOOKED`: Prohibits reversion back to `HELD`; clears temporary hold timestamps.
     - `BLOCKED`: Prohibits active hold references.
5. **Ticket Inventory Synchronization (`update_ticket_type_sold_count`)**:
   - `AFTER INSERT OR UPDATE OR DELETE` on `tickets`.
   - Synchronizes `ticket_types.sold_count` whenever tickets transition between active statuses (`ACTIVE`, `USED`) and return statuses (`CANCELLED`, `REFUNDED`). Avoids recursive execution by triggering only across tables.

### 12.4 Concurrency Control & Double-Booking Prevention

#### The Concurrency Problem
In high-demand event ticketing, multiple customers frequently attempt to reserve or purchase the exact same seat simultaneously. Without database-level locking, a race condition occurs:
1. Customer A checks seat availability → finds it AVAILABLE.
2. Customer B checks seat availability → finds it AVAILABLE.
3. Customer A books the seat.
4. Customer B overwrites and also books the seat, issuing duplicate tickets.

#### EVENTHUB Resolution Strategy: Row-Level Locking (`SELECT ... FOR UPDATE`)
EVENTHUB solves this at the database engine level using explicit pessimistic row locking:

```text
       Customer A Transaction                           Customer B Transaction
  ┌───────────────────────────────┐               ┌───────────────────────────────┐
  │ BEGIN TRANSACTION             │               │ BEGIN TRANSACTION             │
  │ SELECT * FROM event_seats     │               │ SELECT * FROM event_seats     │
  │   WHERE id = 42 FOR UPDATE;   │ ──(Locks Row)─│   WHERE id = 42 FOR UPDATE;   │
  │ [Row Lock Acquired]           │               │ [BLOCKED: WAITING FOR LOCK]   │
  │ Check status: 'AVAILABLE'     │               │              .                │
  │ UPDATE status = 'BOOKED'      │               │              .                │
  │ INSERT booking, ticket, etc.  │               │              .                │
  │ COMMIT TRANSACTION            │ ──(Releases)──│ [Lock Acquired by Customer B] │
  └───────────────────────────────┘               │ Re-checks seat status:        │
                                                  │ Status is now 'BOOKED'!       │
                                                  │ RAISE SeatNotAvailableError   │
                                                  │ ROLLBACK TRANSACTION          │
                                                  └───────────────────────────────┘
```

#### Verification & Invariants
- Verified via `backend/tests/test_concurrency.py` using `ThreadPoolExecutor` and synchronization barriers across distinct database sessions.
- In all concurrent race tests, **exactly one customer succeeds**, the competing transaction fails gracefully, and exactly one active ticket is issued per seat.

### 12.5 Transaction Architecture & Rollback Integrity
The `BookingTransactionService` (`backend/app/services/booking_transaction.py`) coordinates atomic transactions:
1. Validate event status (`PUBLISHED`) and seating mode (`RESERVED_SEATING`).
2. Acquire row lock on target seat (`SELECT ... FOR UPDATE`).
3. Validate seat availability.
4. Acquire row lock on ticket tier and check quota.
5. Calculate subtotal, taxes (18%), and net totals.
6. Insert `bookings` record.
7. Insert `booking_items` record.
8. Mutate seat status to `BOOKED`.
9. Insert simulated payment record (`SUCCESS`).
10. Issue ticket with unique code and QR token.
11. Commit transaction (or atomic rollback if any validation step fails).


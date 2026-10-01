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
- `venues`: `name` (unique per address)
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

*(Note: UNIQUE columns such as `email`, `slug`, `booking_reference`, `ticket_code`, and `qr_token` automatically utilize PostgreSQL's underlying unique B-tree indexes without redundant index creation.)*

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

## 8. Verification Instructions

### Automated Pytest Suite
Run the full test suite from `backend`:
```bash
pytest -v
```

### PostgreSQL System Catalog Queries
Execute the verification script located at `database/queries/verify_schema.sql`:
```bash
# Inspect table existence, constraints, and indexes using psql
psql -U postgres -d eventhub -f ../database/queries/verify_schema.sql
```

---

## 9. Schema Export
The complete, production-ready DDL script containing all 16 tables, constraints, foreign keys, and indexes is exported at:
- `database/schema/eventhub_schema.sql`

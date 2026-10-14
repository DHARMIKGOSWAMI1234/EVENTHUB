# EVENTHUB — 5–8 MINUTE LIVE DEMO SCRIPT & VIVA DEFENSE GUIDE

**Project**: EVENTHUB — Full-Stack Event & Ticket Booking Management System  
**Presentation Audience**: Evaluators, Technical Interviewers, Project Vivas, and Architecture Reviewers  
**Target Time**: 5 to 8 Minutes  
**Demonstration Mode**: Live Full-Stack Application (`http://localhost:5173`) + Interactive Database Portal (`/database`)  

---

## 1. Demo Credentials & Accounts

All demo users share the standard demo password: **`DemoUser@2026`**

| Role | Email | Purpose in Demo |
| :--- | :--- | :--- |
| **Customer** | `aarav.mehta@example.com` | Event discovery, interactive seat selection, booking reservation, tickets |
| **Organizer** | `vikram.malhotra@example.com` | Organizer dashboard, event lifecycle management, ticket tiers, sales analytics |
| **Admin** | `priya.nair.admin@example.com` | System governance, user moderation, audit logs trail, maintenance tasks |
| **Academic / Public** | *No login required* | Public catalog, event details, and the **Database Portal (`/database`)** |

---

## 2. Chronological Demo Walkthrough (5–8 Minutes)

### Minute 0:00 – 1:00 • The Hook & Architecture Overview
- **Opening Statement**:  
  *"EVENTHUB is an enterprise-grade event reservation platform built to demonstrate advanced relational database engineering and high-concurrency transactional safety. Powered by PostgreSQL 18.6, FastAPI, and React 19, the platform solves the hardest problems in ticketing: double-booking prevention, auditability, and analytical reporting."*
- **Visuals**:
  - Open Home Page (`http://localhost:5173`).
  - Highlight the sleek dark glassmorphic UI, upcoming events hero, category filters, and live search.
  - Point to the **Database Portal** button in the navigation bar with the `DBMS` badge.

---

### Minute 1:00 – 2:30 • Customer Journey & Concurrency Safety
- **Actions**:
  1. Login as Customer: `aarav.mehta@example.com` / `DemoUser@2026`.
  2. Navigate to **Events** → Select **SoundWave Monsoon Music Festival** (Event 8 — Reserved Seating).
  3. Open the **Interactive Seat Map**:
     - Point out the visual seating grid showing `AVAILABLE`, `HELD`, and `BOOKED` seats.
     - Select an available seat (e.g., Section A, Row 1, Seat 5).
  4. Proceed to **Checkout**:
     - Review the breakdown: Subtotal, Discount, Tax, and Total Amount calculated by database business rules.
     - Complete Simulated Payment (UPI / Card).
  5. Inspect the generated **Digital Ticket**:
     - Show the unique alphanumeric ticket code (e.g., `TKT-2026-XXXX`).
     - Point out the secure cryptographic QR token generated for admission gate scanning.
- **DBMS Defense Talking Point**:  
  *"Behind the scenes, when the customer selected the seat, the backend executed `SELECT ... FOR UPDATE` row-level locking inside an atomic transaction. If another customer attempted to claim that exact seat at that millisecond, PostgreSQL's row lock held the second transaction until the first completed, returning an authoritative HTTP 409 Conflict. This guarantees zero double-booking under extreme concurrency without locking the entire table."*

---

### Minute 2:30 – 3:45 • Organizer & Administrator Control
- **Actions**:
  1. Switch to Organizer: `vikram.malhotra@example.com` / `DemoUser@2026`.
  2. Open **Organizer Dashboard** (`/organizer`):
     - View real-time ticket sales volume, gross revenue, and occupancy percentages backed directly by PostgreSQL analytical views.
     - Show the event lifecycle state machine (`DRAFT` → `PUBLISHED` → `CANCELLED`).
  3. Switch to Administrator: `priya.nair.admin@example.com` / `DemoUser@2026`.
  4. Open **Admin Dashboard** (`/admin`):
     - View platform user management and role governance.
     - Open **Audit Logs**: Show immutable change capture emitted automatically by PostgreSQL triggers whenever bookings or users mutate. Show that sensitive fields like `password_hash` are strictly masked.

---

### Minute 3:45 – 6:30 • The Core Showcase: Database Portal (`/database`)
Navigate to `/database`. This is the academic centerpiece of EVENTHUB.

#### Tab 1: Overview
- Showcase real-time system catalog metrics:
  - **16 Core Tables • 5 Analytical Views • 4 Stored Functions • 18 Triggers • 23 Foreign Keys**.
  - Show the 4-tier visual architecture diagram: React 19 → FastAPI → SQLAlchemy → PostgreSQL 18.6.

#### Tab 2: Tables Explorer
- Click through tables (e.g., `events`, `bookings`, `venue_seats`, `audit_logs`).
- Show column definitions, primary keys, check constraints (`subtotal >= 0`, `status IN (...)`), and estimated live row counts retrieved directly from `pg_class` and `information_schema`.

#### Tab 3: Relationship / ER Graph
- Expand the visual Entity-Relationship hierarchy:
  - Demonstrate 1:N relations (`users` → `bookings` → `booking_items` → `tickets`).
  - Explain the decoupling of physical venue geometry (`venue_seats`) from transient event inventory (`event_seats`).

#### Tab 4: Normalization (1NF → 2NF → 3NF)
- Walk through the visual schema decomposition diagram:
  - Explain how unnormalized booking records suffer from insertion, update, and deletion anomalies.
  - Show how EVENTHUB achieves 3NF with zero redundancy while preserving referential integrity.

#### Tab 5: Analytical Views
- Display the 5 PostgreSQL views:
  - `v_event_sales_summary`, `v_event_occupancy`, `v_organizer_revenue`, `v_monthly_booking_summary`, `v_event_rating_summary`.
  - Click **Run Query** on `v_event_occupancy` to show live database results with venue capacity fill rates.

#### Tab 6: Functions & Triggers
- Explain the custom PostgreSQL stored procedures:
  - `calculate_booking_total()`: Procedural booking math.
  - `release_expired_holds()`: Janitor procedure clearing expired reservations.
- Explain the 18 active database triggers:
  - `validate_event_seat_state`: Prevents illegal seat transitions (`BOOKED` → `HELD`).
  - `update_ticket_type_sold_count`: Synchronously keeps ticket inventory in sync.

#### Tab 7: Concurrency & Row-Level Locking
- Walk through the step-by-step visual transaction timeline:
  - `BEGIN TRANSACTION` → `SELECT FOR UPDATE` → `VALIDATE` → `INSERT` → `COMMIT`.

#### Tab 8: Query Showcase (15 Pre-Crafted Queries)
- Highlight advanced SQL features:
  - **Window Functions**: Running cumulative revenue by day (`SUM(...) OVER (ORDER BY ...)`).
  - **CTEs (Common Table Expressions)**: Top 5 VIP Attendees by Spend.
  - **HAVING Clause**: High-demand events with booking threshold filtering.
  - Click the **Copy SQL** button to demonstrate the zero-arbitrary-SQL safety model.

#### Tab 9: Exports
- Demonstrate 1-click download of `eventhub_demo.sql` (86.4 KB) and `eventhub_csv_dataset.zip` (18.1 KB).

---

### Minute 6:30 – 8:00 • Summary & Viva Q&A Defense

Wrap up the demonstration by summarizing the engineering achievements and inviting questions.

---

## 3. Top Viva Defense Questions & Answers

### Q1: Why did you implement row-level locking (`SELECT ... FOR UPDATE`) instead of table locking or optimistic locking?
**Answer**:  
*"Table locking serializes all bookings across an entire event or platform, bottlenecking throughput and killing user concurrency. Optimistic locking with a version column works well for low-contention scenarios, but in high-demand ticket drops where thousands of attendees compete for the same front-row seats, optimistic locking causes mass rollbacks and terrible user experience. `SELECT ... FOR UPDATE` row-level locking locks only the specific seat row being purchased, allowing concurrent bookings on all other seats to proceed simultaneously with guaranteed ACID atomicity."*

---

### Q2: How does your database prevent double-booking at the schema level versus the application level?
**Answer**:  
*"We enforce defense-in-depth on both layers:*
*1. **Schema Level**: We enforce a composite unique constraint `uq_event_seat (event_id, venue_seat_id)` on the `event_seats` table, combined with check constraints on valid seat states. Furthermore, the `validate_event_seat_state` trigger function rejects any UPDATE attempting to transition an already `BOOKED` seat back to `HELD` or `AVAILABLE`.*
*2. **Application / Transaction Level**: The FastAPI transaction service uses `SELECT ... FOR UPDATE` to acquire an exclusive lock, verifies status, transitions the state, and commits atomically. Any concurrent claimant encounters the lock, detects the updated status, and receives an HTTP 409 Conflict."*

---

### Q3: What normal form is the EVENTHUB schema in?
**Answer**:  
*"The EVENTHUB schema is designed in **Third Normal Form (3NF)**:*
*- **1NF**: All columns contain atomic, scalar values (no comma-separated lists of ticket IDs or repeating groups), with uniquely identified records via surrogate primary keys (`BIGINT IDENTITY`).*
*- **2NF**: All non-key attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies.*
*- **3NF**: Non-key attributes depend solely on candidate keys with no transitive dependencies (for example, `venue` details like address and total capacity belong to `venues`, not transitively duplicated on `events` or `bookings`).*
*We intentionally avoid claiming BCNF or 4NF unless formally proven, focusing on textbook relational decomposition."*

---

### Q4: Why use PostgreSQL Views instead of calculating analytics on the fly in Python?
**Answer**:  
*"PostgreSQL analytical views (`v_event_sales_summary`, `v_organizer_revenue`, etc.) push aggregations down to the relational query planner. The database engine optimizes joins using indexed hash and merge joins, avoiding the need to transfer thousands of raw transaction rows over the network to Python. Furthermore, views create a single reusable definition of metrics like 'gross revenue' and 'occupancy rate' accessible across multiple backend services and the Database Portal."*

---

### Q5: How do you guarantee zero credential leaks in audit logs and metadata endpoints?
**Answer**:  
*"First, user passwords are encrypted using bcrypt before ever reaching the database. Second, the PostgreSQL trigger function `audit_user_change` specifically scrubs `password_hash` from the JSONB diff payload before writing to `audit_logs`. Third, on the backend metadata API, our database service filters all columns through `SENSITIVE_COLUMNS = {'password_hash', 'access_token', 'refresh_token'}` and replaces sensitive values with `[PROTECTED]`."*

---

### Q6: Why does the Database Portal NOT provide an open SQL query console?
**Answer**:  
*"An unrestricted SQL query console in a web browser violates fundamental security principles by exposing the database to arbitrary data manipulation (DDL/DML injections, `DROP TABLE`, data theft, or denial of service). Instead, EVENTHUB implements a **Zero Arbitrary SQL Architecture**: all portal metrics, views, and the 15 SQL query cards are pre-crafted, read-only, allowlisted, and executed through backend-controlled queries. Evaluators can copy the SQL and run it directly in psql/pgAdmin, but the browser never executes unverified SQL."*

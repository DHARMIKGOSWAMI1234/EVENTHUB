import React, { useState } from 'react';

interface ConceptItem {
  id: string;
  title: string;
  category: string;
  whatItIs: string;
  whyEventhubUsesIt: string;
  eventhubExample: string;
}

export const DatabaseConceptsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const concepts: ConceptItem[] = [
    {
      id: 'relational-db',
      title: 'Relational Database Management System (RDBMS)',
      category: 'Foundation',
      whatItIs: 'A database system based on E.F. Codd’s relational model that organizes data into tables (relations) of rows (tuples) and columns (attributes) linked by logical relationships.',
      whyEventhubUsesIt: 'Ensures structured consistency, declarative query capabilities via SQL, and strict referential integrity between users, events, and bookings.',
      eventhubExample: 'PostgreSQL 18.6 hosting 16 normalized tables interconnected with foreign keys and check constraints.',
    },
    {
      id: 'primary-key',
      title: 'Primary Key (PK)',
      category: 'Integrity',
      whatItIs: 'A column or combination of columns that uniquely and non-nullably identifies each row in a database table.',
      whyEventhubUsesIt: 'Guarantees entity uniqueness, powers fast B-tree index lookups, and provides target anchors for foreign key references.',
      eventhubExample: 'Every table in EVENTHUB utilizes `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`.',
    },
    {
      id: 'foreign-key',
      title: 'Foreign Key (FK) & Referential Integrity',
      category: 'Integrity',
      whatItIs: 'A field in one table that references the primary key of another table, ensuring that child rows cannot point to non-existent parent rows.',
      whyEventhubUsesIt: 'Prevents orphaned records (e.g., tickets with no booking, or bookings for deleted users).',
      eventhubExample: '`bookings.user_id REFERENCES users(id)` and `bookings.event_id REFERENCES events(id) ON DELETE RESTRICT`.',
    },
    {
      id: 'normalization',
      title: 'Database Normalization (1NF, 2NF, 3NF)',
      category: 'Schema Design',
      whatItIs: 'A formal systematic technique for structuring relational schemas to minimize data redundancy and prevent insertion, update, and deletion anomalies.',
      whyEventhubUsesIt: 'Eliminates repetitive data storage, accelerates writes, and simplifies schema updates.',
      eventhubExample: 'Separates `venues`, `venue_seats`, `events`, and `event_seats` into dedicated 3NF tables instead of one flat spreadsheet.',
    },
    {
      id: 'constraints',
      title: 'Integrity Constraints (UNIQUE, CHECK, NOT NULL)',
      category: 'Integrity',
      whatItIs: 'Declarative rules defined directly on columns or tables that the DBMS engine evaluates before allowing any INSERT or UPDATE.',
      whyEventhubUsesIt: 'Guarantees business rules at the lowest storage layer, independent of application code.',
      eventhubExample: '`CHECK (rating BETWEEN 1 AND 5)`, `CHECK (price >= 0.00)`, and `UNIQUE (user_id, event_id)` on reviews.',
    },
    {
      id: 'indexes',
      title: 'B-Tree Indexes',
      category: 'Performance',
      whatItIs: 'Self-balancing tree data structures maintained on disk that provide logarithmic O(log N) search and range scan performance.',
      whyEventhubUsesIt: 'Accelerates frequent queries such as looking up customer bookings, scanning event dates, or verifying unique emails.',
      eventhubExample: '55 B-tree indexes across 16 tables, including `idx_events_status` and `idx_bookings_user_id`.',
    },
    {
      id: 'joins',
      title: 'SQL JOIN Operations (INNER, LEFT, FULL)',
      category: 'Querying',
      whatItIs: 'Query clauses that combine rows from two or more tables based on a related common attribute.',
      whyEventhubUsesIt: 'Reconstructs comprehensive business views from normalized entities on demand.',
      eventhubExample: '`bookings b JOIN users u ON b.user_id = u.id JOIN events e ON b.event_id = e.id`.',
    },
    {
      id: 'aggregation',
      title: 'Aggregation & GROUP BY',
      category: 'Querying',
      whatItIs: 'Functions (COUNT, SUM, AVG, MIN, MAX) that calculate summary values over multiple rows grouped by common column values.',
      whyEventhubUsesIt: 'Calculates total organizer revenue, category sales distribution, and venue occupancy metrics.',
      eventhubExample: '`SELECT c.name, count(b.id), sum(b.total_amount) FROM categories c JOIN ... GROUP BY c.name`.',
    },
    {
      id: 'subqueries',
      title: 'Subqueries (Scalar & Correlated)',
      category: 'Querying',
      whatItIs: 'A query nested inside another SQL statement. Scalar subqueries return a single value; correlated subqueries reference columns from the outer query.',
      whyEventhubUsesIt: 'Enables complex filtering based on dynamic aggregate thresholds.',
      eventhubExample: 'Filtering tickets whose price exceeds the platform-wide average: `WHERE price > (SELECT avg(price) FROM ticket_types)`.',
    },
    {
      id: 'cte',
      title: 'Common Table Expressions (WITH Clause / CTE)',
      category: 'Querying',
      whatItIs: 'Temporary named result sets defined at the beginning of an SQL statement to simplify complex queries and improve modularity.',
      whyEventhubUsesIt: 'Breaks multi-step analytics into clean, human-readable pipelines.',
      eventhubExample: '`WITH organizer_stats AS (...) SELECT organization_name, gross_revenue FROM organizer_stats ORDER BY gross_revenue DESC`.',
    },
    {
      id: 'window-functions',
      title: 'Window Functions (DENSE_RANK, OVER)',
      category: 'Analytics',
      whatItIs: 'Analytical functions that perform calculations across a set of table rows related to the current row without collapsing the rows like GROUP BY does.',
      whyEventhubUsesIt: 'Ranks top events within each specific category while keeping individual event titles intact.',
      eventhubExample: '`DENSE_RANK() OVER (PARTITION BY category_name ORDER BY revenue DESC) AS category_rank`.',
    },
    {
      id: 'views',
      title: 'PostgreSQL Views (Virtual Tables)',
      category: 'Abstractions',
      whatItIs: 'Pre-compiled stored query definitions that act as virtual tables for querying without storing duplicate data.',
      whyEventhubUsesIt: 'Shields frontend and business services from underlying multi-table schema complexity.',
      eventhubExample: '`v_event_sales_summary`, `v_event_occupancy`, `v_organizer_revenue`, and `v_monthly_booking_summary`.',
    },
    {
      id: 'stored-procedures',
      title: 'Stored Functions (PL/pgSQL)',
      category: 'Procedural Logic',
      whatItIs: 'Compiled procedural code routines executed directly inside the database engine.',
      whyEventhubUsesIt: 'Guarantees that monetary calculations and seat releases run close to data with minimal round-trip latency.',
      eventhubExample: '`calculate_booking_total(p_booking_id)` and `release_expired_holds()`.',
    },
    {
      id: 'triggers',
      title: 'Database Triggers',
      category: 'Procedural Logic',
      whatItIs: 'Event-driven database procedures that automatically execute BEFORE or AFTER specific INSERT, UPDATE, or DELETE operations.',
      whyEventhubUsesIt: 'Guarantees audit trails, timestamp maintenance, and inventory synchronization regardless of how data was modified.',
      eventhubExample: '18 active triggers including `audit_booking_change` and `seat_state_consistency_trigger`.',
    },
    {
      id: 'acid',
      title: 'ACID Transaction Properties',
      category: 'Transactions',
      whatItIs: 'Four fundamental guarantees: Atomicity (all or nothing), Consistency (preserves invariants), Isolation (transactions do not interfere), Durability (committed changes survive crashes).',
      whyEventhubUsesIt: 'Ensures that ticket booking, seat reservation, and payment records succeed or fail as a single unit.',
      eventhubExample: '`BEGIN; ... COMMIT;` blocks wrapping seat state update, booking insertion, and ticket generation.',
    },
    {
      id: 'row-locking',
      title: 'Pessimistic Concurrency & Row-Level Locking',
      category: 'Transactions',
      whatItIs: 'Acquiring an exclusive lock on targeted rows (`SELECT ... FOR UPDATE`) during a transaction to prevent concurrent processes from modifying them.',
      whyEventhubUsesIt: 'Completely eliminates double-booking race conditions during high-demand event ticketing.',
      eventhubExample: '`SELECT id, status FROM event_seats WHERE id = :seat_id FOR UPDATE;`.',
    },
    {
      id: 'audit-logging',
      title: 'Immutable Audit Logging',
      category: 'Security',
      whatItIs: 'A dedicated ledger table where trigger functions record historical mutations with before-and-after snapshots.',
      whyEventhubUsesIt: 'Provides complete accountability and forensic traceability for sensitive profile or booking updates.',
      eventhubExample: '`audit_logs` storing JSON snapshots with automatic redaction of password hashes.',
    },
  ];

  const categories = ['All', 'Foundation', 'Integrity', 'Schema Design', 'Performance', 'Querying', 'Analytics', 'Abstractions', 'Procedural Logic', 'Transactions', 'Security'];

  const filteredConcepts = concepts.filter((c) => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.whatItIs.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.whyEventhubUsesIt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.eventhubExample.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Academic Viva & Interview Reference
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            DBMS Core Concepts & EVENTHUB Implementation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            A comprehensive viva / presentation cheat-sheet mapping fundamental relational database management system principles to concrete implementations in EVENTHUB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Concepts Grid */}
      <div className="space-y-4">
        {filteredConcepts.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {item.title}
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {item.category}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  1. WHAT IT IS
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {item.whatItIs}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  2. WHY EVENTHUB USES IT
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {item.whyEventhubUsesIt}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 font-mono">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1 font-sans">
                  3. EVENTHUB CONCRETE EXAMPLE
                </span>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed text-[11px]">
                  {item.eventhubExample}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';

export const DatabaseNormalizationPage: React.FC = () => {
  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Relational Theory & Integrity Rules
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Database Normalization & Constraints Showcase
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Demonstrates how EVENTHUB transforms an error-prone, redundant flat data structure into a normalized Third Normal Form (3NF) relational design reinforced by declarative schema constraints.
        </p>
      </div>

      {/* Normalization Stages: 0NF -> 1NF -> 2NF -> 3NF */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          Normalization Progression: From Flat Records to 3NF
        </h3>

        <div className="space-y-6">
          {/* Unnormalized / Problem */}
          <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                0NF: UNNORMALIZED / DENORMALIZED TABLE
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Severe Redundancy & Anomalies</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Imagine storing an entire booking in a single spreadsheet table:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 text-rose-300 font-mono text-xs overflow-x-auto mb-3">
              booking_flat(customer_name, customer_email, event_title, event_date, venue_name, venue_city, venue_capacity, tier_name, tier_price, seat_row, seat_number, payment_method, amount)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/40">
                <strong className="text-rose-600 dark:text-rose-400 block mb-0.5">Insertion Anomaly:</strong>
                Cannot add a venue or ticket tier without an existing customer booking.
              </div>
              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/40">
                <strong className="text-rose-600 dark:text-rose-400 block mb-0.5">Update Anomaly:</strong>
                Changing an event date requires updating thousands of duplicated booking rows.
              </div>
              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/40">
                <strong className="text-rose-600 dark:text-rose-400 block mb-0.5">Deletion Anomaly:</strong>
                Cancelling the only booking for an event accidentally deletes the event & venue details.
              </div>
            </div>
          </div>

          {/* 1NF */}
          <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                1NF: FIRST NORMAL FORM
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Atomic Attributes & No Repeating Groups</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              Each column holds atomic (indivisible) scalar values. No comma-separated seat lists or repeating columns (<code className="font-mono">seat1, seat2, seat3</code>). Every table has a primary key.
            </p>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 p-2.5 rounded border border-amber-200 dark:border-amber-800">
              ✓ Multi-seat bookings decomposed into discrete line items: <code className="text-indigo-600 dark:text-indigo-400">booking_items</code>
            </div>
          </div>

          {/* 2NF */}
          <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                2NF: SECOND NORMAL FORM
              </span>
              <span className="text-xs text-sky-700 dark:text-sky-300 font-semibold">Full Functional Dependency on Candidate Keys</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              Eliminates partial dependencies. Non-key attributes must depend on the whole candidate key, not just a subset of a composite key.
            </p>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 p-2.5 rounded border border-sky-200 dark:border-sky-800">
              ✓ Separates <code className="text-indigo-600 dark:text-indigo-400">ticket_types</code> (tier pricing) from <code className="text-indigo-600 dark:text-indigo-400">tickets</code> (individual customer admission pass).
            </div>
          </div>

          {/* 3NF */}
          <div className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                3NF: THIRD NORMAL FORM (EVENTHUB TARGET)
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Zero Transitive Dependencies</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Non-key attributes depend <strong className="text-slate-900 dark:text-white">only</strong> on the primary key: <em>"The key, the whole key, and nothing but the key"</em>.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
              users(id) → organizers(user_id) → events(organizer_id, venue_id) → ticket_types(event_id) → bookings(user_id, event_id) → booking_items(booking_id)
            </div>
          </div>
        </div>
      </div>

      {/* Constraints Showcase Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
          Declarative Constraint Rules in EVENTHUB
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* PRIMARY KEY */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <strong className="font-bold text-slate-900 dark:text-white text-sm">PRIMARY KEY Constraints</strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                Entity Identity
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Every table features a surrogate <code className="font-mono text-purple-600 dark:text-purple-400">BIGINT GENERATED ALWAYS AS IDENTITY</code> primary key.
            </p>
            <code className="block p-2 rounded bg-slate-900 text-indigo-300 font-mono text-[11px]">
              CONSTRAINT pk_events PRIMARY KEY (id)
            </code>
          </div>

          {/* FOREIGN KEY */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <strong className="font-bold text-slate-900 dark:text-white text-sm">FOREIGN KEY Referential Integrity</strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-semibold">
                17 Relationships
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Enforces valid parent-child relationships with <code className="font-mono text-pink-600 dark:text-pink-400">ON DELETE RESTRICT</code> or <code className="font-mono text-pink-600 dark:text-pink-400">CASCADE</code>.
            </p>
            <code className="block p-2 rounded bg-slate-900 text-pink-300 font-mono text-[11px]">
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
            </code>
          </div>

          {/* UNIQUE CONSTRAINTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <strong className="font-bold text-slate-900 dark:text-white text-sm">UNIQUE Constraints</strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                Candidate Keys
              </span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px] mb-2">
              <li>• <code className="text-indigo-600 dark:text-indigo-400">users(email)</code> UNIQUE</li>
              <li>• <code className="text-indigo-600 dark:text-indigo-400">categories(name)</code> UNIQUE</li>
              <li>• <code className="text-indigo-600 dark:text-indigo-400">venue_seats(venue_id, seat_label)</code> UNIQUE</li>
              <li>• <code className="text-indigo-600 dark:text-indigo-400">reviews(user_id, event_id)</code> UNIQUE</li>
              <li>• <code className="text-indigo-600 dark:text-indigo-400">tickets(ticket_code, qr_token)</code> UNIQUE</li>
            </ul>
          </div>

          {/* CHECK CONSTRAINTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <strong className="font-bold text-slate-900 dark:text-white text-sm">CHECK Constraints</strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                Domain Invariants
              </span>
            </div>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px] mb-2">
              <li>• <code className="text-amber-600 dark:text-amber-400">CHECK (capacity &gt; 0)</code></li>
              <li>• <code className="text-amber-600 dark:text-amber-400">CHECK (price &gt;= 0.00)</code></li>
              <li>• <code className="text-amber-600 dark:text-amber-400">CHECK (total_amount &gt;= 0.00)</code></li>
              <li>• <code className="text-amber-600 dark:text-amber-400">CHECK (rating BETWEEN 1 AND 5)</code></li>
              <li>• <code className="text-amber-600 dark:text-amber-400">CHECK (role IN ('CUSTOMER', 'ORGANIZER', 'ADMIN'))</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

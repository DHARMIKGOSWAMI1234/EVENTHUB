import React from 'react';
import { SQLCodeBlock } from '../../components/database/SQLCodeBlock';

export const DatabaseConcurrencyPage: React.FC = () => {
  const transactionSQL = `BEGIN;

-- 1. Acquire exclusive pessimistic row lock on the requested seat
SELECT id, event_id, status 
FROM event_seats 
WHERE id = :seat_id AND event_id = :event_id
FOR UPDATE;

-- 2. Validate seat state inside the isolated transaction
-- If status != 'AVAILABLE', ROLLBACK and return 409 CONFLICT

-- 3. Transition seat state to 'BOOKED'
UPDATE event_seats 
SET status = 'BOOKED', updated_at = CURRENT_TIMESTAMP
WHERE id = :seat_id;

-- 4. Create authoritative booking header
INSERT INTO bookings (user_id, event_id, booking_reference, total_amount, status)
VALUES (:user_id, :event_id, :booking_ref, :total_amt, 'CONFIRMED')
RETURNING id;

-- 5. Insert line item & issue admission ticket pass
INSERT INTO booking_items (booking_id, ticket_type_id, seat_id, unit_price, quantity, subtotal)
VALUES (:booking_id, :ticket_type_id, :seat_id, :price, 1, :price);

INSERT INTO tickets (booking_id, ticket_type_id, seat_id, ticket_code, qr_token, status)
VALUES (:booking_id, :ticket_type_id, :seat_id, :ticket_code, :qr_token, 'ACTIVE');

-- 6. Trigger update_ticket_type_sold_count fires automatically
-- 7. Trigger audit_booking_change captures state into audit_logs

COMMIT;`;

  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          ACID Transactions & Race Condition Defense
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Transactions, Row-Level Locking & Audit Trails
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          How PostgreSQL row-level locks (<code className="font-mono text-rose-600 dark:text-rose-400">SELECT ... FOR UPDATE</code>) and event triggers protect EVENTHUB against double-booking anomalies, race conditions, and unauthorized data tampering.
        </p>
      </div>

      {/* Visual Concurrency Conflict Scenario */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          The Double-Booking Problem vs. Row-Level Locking
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Without Locking (Danger) */}
          <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs">
            <span className="font-bold text-rose-700 dark:text-rose-300 text-sm block mb-2">
              ❌ Without Concurrency Control (Race Condition)
            </span>
            <ol className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              <li>1. <strong>Customer A</strong> reads Seat #42: Status is <code>AVAILABLE</code>.</li>
              <li>2. <strong>Customer B</strong> simultaneously reads Seat #42: Status is <code>AVAILABLE</code>.</li>
              <li>3. Customer A pays and writes <code>BOOKED</code>.</li>
              <li>4. Customer B pays and overwrites with <code>BOOKED</code>!</li>
              <li className="text-rose-600 dark:text-rose-400 font-bold pt-1">
                💥 Result: Double-booking disaster. Two customers arrive for the exact same seat.
              </li>
            </ol>
          </div>

          {/* With SELECT FOR UPDATE (EVENTHUB) */}
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm block mb-2">
              ✓ With EVENTHUB Row-Level Locking (ACID Protected)
            </span>
            <ol className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              <li>1. <strong>Customer A</strong> starts transaction with <code>SELECT ... FOR UPDATE</code>.</li>
              <li>2. PostgreSQL grants exclusive row lock on Seat #42 to Transaction A.</li>
              <li>3. <strong>Customer B</strong> attempts to book Seat #42 and waits or evaluates current state.</li>
              <li>4. Transaction A books seat and commits. Seat #42 is now <code>BOOKED</code>.</li>
              <li className="text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                🛡️ Result: Transaction B safely receives HTTP 409 Conflict. Zero double-booking!
              </li>
            </ol>
          </div>
        </div>

        {/* Transaction Flow Timeline */}
        <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 block mb-3">
            Execution Flow of an Atomic Booking Transaction
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-[10px] text-indigo-400 font-mono block">STEP 1</span>
              <strong className="text-white font-mono">BEGIN</strong>
              <p className="text-[10px] text-slate-400 mt-0.5">ACID boundary</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60">
              <span className="text-[10px] text-rose-400 font-mono block">STEP 2</span>
              <strong className="text-rose-200 font-mono">FOR UPDATE</strong>
              <p className="text-[10px] text-slate-400 mt-0.5">Row locked</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800/60">
              <span className="text-[10px] text-amber-400 font-mono block">STEP 3</span>
              <strong className="text-amber-200 font-mono">CHECK STATE</strong>
              <p className="text-[10px] text-slate-400 mt-0.5">Available?</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/60">
              <span className="text-[10px] text-indigo-400 font-mono block">STEP 4</span>
              <strong className="text-indigo-200 font-mono">INSERT DATA</strong>
              <p className="text-[10px] text-slate-400 mt-0.5">Order & items</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/60">
              <span className="text-[10px] text-purple-400 font-mono block">STEP 5</span>
              <strong className="text-purple-200 font-mono">TRIGGERS</strong>
              <p className="text-[10px] text-slate-400 mt-0.5">Audit & sync</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
              <span className="text-[10px] text-emerald-400 font-mono block">STEP 6</span>
              <strong className="text-emerald-200 font-mono">COMMIT</strong>
              <p className="text-[10px] text-slate-400 mt-0.5">Lock released</p>
            </div>
          </div>
        </div>

        {/* Transaction SQL Code */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Production Transaction SQL Execution Block
          </h4>
          <SQLCodeBlock sql={transactionSQL} title="PostgreSQL ACID Transaction" />
        </div>
      </div>

      {/* Audit Logging Architecture */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          Immutable Audit Logging via PostgreSQL Triggers
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Whenever a user profile, account role, or booking state is mutated, dedicated PostgreSQL triggers (<code className="font-mono text-indigo-600 dark:text-indigo-400">audit_booking_change</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">audit_user_change</code>) capture old and new row states into JSONB columns in the immutable <code className="font-mono text-emerald-600 dark:text-emerald-400">audit_logs</code> table.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <strong className="font-bold text-slate-900 dark:text-white block mb-2">
              🛡️ Zero Secret Leakage Guarantee
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              The trigger function explicitly strips or redacts sensitive attributes (<code className="font-mono text-rose-500">password_hash</code>) before serializing data into JSONB. Even if an audit log row is inspected, password hashes are never exposed.
            </p>
            <code className="block p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[11px]">
              v_old_data := v_old_data - 'password_hash';<br />
              v_new_data := v_new_data - 'password_hash';
            </code>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <strong className="font-bold text-slate-900 dark:text-white block mb-2">
              🔍 Administrative Traceability
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              The audit trail records who made the change, when it occurred, the entity type, and exact before/after field values. This satisfies enterprise governance and DBMS auditability standards.
            </p>
            <div className="p-2 rounded bg-slate-900 text-indigo-300 font-mono text-[11px]">
              action: "UPDATE" • entity: "bookings" • status: "PENDING" → "CONFIRMED"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

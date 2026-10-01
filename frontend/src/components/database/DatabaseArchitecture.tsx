import React from 'react';

export const DatabaseArchitecture: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            System Topology
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            End-to-End DBMS Architecture
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            3-Tier Client-Server Architecture
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Tier 1: Client */}
        <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                TIER 1
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Client Presentation</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">React 19 + TypeScript</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Vite, Tailwind CSS, role-based interfaces (Customer, Organizer, Admin) and read-only Database Portal.
            </p>
          </div>
          <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Port 5173 • Zero Secrets
          </div>
        </div>

        {/* Tier 2: REST API */}
        <div className="p-5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                TIER 2
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Application Server</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">FastAPI REST Gateway</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Asynchronous request validation, JWT security, transaction management, and 64 business REST endpoints.
            </p>
          </div>
          <div className="pt-3 border-t border-purple-200/60 dark:border-purple-900/40 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Port 8000 • /api/v1
          </div>
        </div>

        {/* Tier 3: ORM / Driver */}
        <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                TIER 3
              </span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Data Access Layer</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">SQLAlchemy + Alembic</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Connection pooling, schema declarations, ACID transaction boundaries, and declarative migration tracking.
            </p>
          </div>
          <div className="pt-3 border-t border-sky-200/60 dark:border-sky-900/40 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            psycopg3 Driver • Pooling
          </div>
        </div>

        {/* Core DBMS: PostgreSQL 18.6 */}
        <div className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                DBMS CORE
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Relational Engine</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">PostgreSQL 18.6</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Authoritative data store with ACID durability, row-level locking, 18 triggers, 5 views, and 55 indexes.
            </p>
          </div>
          <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Port 5432 • eventhub DB
          </div>
        </div>
      </div>

      {/* Database Internal Subsystem Grid */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          PostgreSQL Database Internal Subsystems
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-indigo-600 dark:text-indigo-400">16</span> Tables
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-purple-600 dark:text-purple-400">5</span> Views
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-amber-600 dark:text-amber-400">18</span> Triggers
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-emerald-600 dark:text-emerald-400">9</span> Procedures
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-sky-600 dark:text-sky-400">55</span> Indexes
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-pink-600 dark:text-pink-400">17</span> Foreign Keys
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-cyan-600 dark:text-cyan-400">ACID</span> Transactions
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-medium">
            <span className="block font-bold text-rose-600 dark:text-rose-400">JSONB</span> Audit Trail
          </div>
        </div>
      </div>
    </div>
  );
};

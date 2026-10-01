import React from 'react';
import type { DatabaseOverviewData } from '../../types/database';

interface DatabaseHeroProps {
  overview?: DatabaseOverviewData | null;
}

export const DatabaseHero: React.FC<DatabaseHeroProps> = ({ overview }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 border border-indigo-900/50 shadow-2xl mb-8">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            DBMS Showcase & Relational Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            EVENTHUB <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">DATABASE PORTAL</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 font-normal">
            A production-style relational database architecture built on <strong className="text-white font-semibold">{overview?.engine || 'PostgreSQL 18.6'}</strong>.
            Demonstrates 3NF normalization, integrity constraints, ACID transactions with row-level locking (<code className="text-indigo-300 text-sm bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">SELECT FOR UPDATE</code>),
            automated triggers, analytical views, and audit logging.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 font-mono">
              Database: <span className="text-emerald-400 font-bold">{overview?.database_name || 'eventhub'}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 font-mono">
              Engine: <span className="text-indigo-300 font-bold">{overview?.engine || 'PostgreSQL 18.6'}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 font-mono">
              Status: <span className="text-emerald-400 font-bold">● Active & Connected</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 font-mono">
              Access: <span className="text-amber-300 font-bold">Read-Only Safe Mode</span>
            </span>
          </div>
        </div>

        {/* PostgreSQL visual seal badge */}
        <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 backdrop-blur-md shadow-xl text-center min-w-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3">
            <svg className="w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">PostgreSQL</span>
          <span className="text-indigo-400 text-xs font-mono">18.6 Enterprise</span>
          <span className="text-slate-400 text-[11px] mt-1 font-mono">ACID Compliant</span>
        </div>
      </div>
    </div>
  );
};

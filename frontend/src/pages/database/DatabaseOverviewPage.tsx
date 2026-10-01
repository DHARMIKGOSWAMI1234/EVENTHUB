import React from 'react';
import type { DatabaseOverviewData, DatabaseStatisticsData } from '../../types/database';
import { DatabaseHero } from '../../components/database/DatabaseHero';
import { DatabaseStats } from '../../components/database/DatabaseStats';
import { DatabaseArchitecture } from '../../components/database/DatabaseArchitecture';

interface DatabaseOverviewPageProps {
  overview: DatabaseOverviewData | null;
  statistics: DatabaseStatisticsData | null;
  onNavigateTab: (tab: any) => void;
}

export const DatabaseOverviewPage: React.FC<DatabaseOverviewPageProps> = ({
  overview,
  statistics,
  onNavigateTab,
}) => {
  return (
    <div>
      <DatabaseHero overview={overview} />
      <DatabaseStats overview={overview} />
      <DatabaseArchitecture />

      {/* Database Highlights & Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Relational Integrity & Schema Design
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            EVENTHUB decomposes event scheduling, reserved seating, ticketing quotas, customer orders, and financial transactions into 16 normalized 3NF tables. Every relationship is enforced by PostgreSQL foreign keys with appropriate cascade or restrict rules.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('tables')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Explore 16 Tables →
            </button>
            <button
              onClick={() => onNavigateTab('relationships')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 transition-colors cursor-pointer"
            >
              View ER Diagram →
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Concurrency & Transaction Isolation
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Under high-volume ticket sales, race conditions could cause the same seat to be booked twice. EVENTHUB uses PostgreSQL row-level locks (<code className="font-mono text-indigo-600 dark:text-indigo-400">SELECT ... FOR UPDATE</code>) within strict ACID transaction blocks to guarantee exclusive seat allocation.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('concurrency')}
              className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100 transition-colors cursor-pointer"
            >
              See Concurrency Mechanics →
            </button>
            <button
              onClick={() => onNavigateTab('queries')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Run Showcase Queries →
            </button>
          </div>
        </div>
      </div>

      {/* Storage and Record Distribution Quick Glance */}
      {statistics && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Database Physical Storage & Record Volume
            </h3>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Total Size: {statistics.database_size_pretty}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-xs">
            {statistics.largest_tables_by_rows.slice(0, 8).map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="font-mono font-bold text-slate-900 dark:text-white truncate mb-1">
                  {t.table}
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                  {t.row_count} rows
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{t.size_pretty}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

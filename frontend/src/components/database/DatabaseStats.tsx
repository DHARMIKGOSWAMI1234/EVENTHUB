import React from 'react';
import type { DatabaseOverviewData } from '../../types/database';

interface DatabaseStatsProps {
  overview?: DatabaseOverviewData | null;
}

export const DatabaseStats: React.FC<DatabaseStatsProps> = ({ overview }) => {
  const stats = [
    {
      label: 'Relational Tables',
      value: overview?.table_count || 16,
      sub: 'Normalized 3NF',
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 11h16M10 4v16" />
        </svg>
      ),
      color: 'border-indigo-500/20 bg-indigo-950/20',
    },
    {
      label: 'Analytical Views',
      value: overview?.view_count || 5,
      sub: 'Materialized Abstractions',
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'border-purple-500/20 bg-purple-950/20',
    },
    {
      label: 'Active Triggers',
      value: overview?.trigger_count || 18,
      sub: 'Audit & State Guards',
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'border-amber-500/20 bg-amber-950/20',
    },
    {
      label: 'Stored & Trigger Routines',
      value: (overview?.function_count || 4) + (overview?.trigger_function_count || 5),
      sub: '4 Logic + 5 Triggers',
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'border-emerald-500/20 bg-emerald-950/20',
    },
    {
      label: 'B-Tree Indexes',
      value: overview?.index_count || 55,
      sub: 'Optimized Lookups',
      icon: (
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'border-sky-500/20 bg-sky-950/20',
    },
    {
      label: 'Foreign Key Constraints',
      value: overview?.foreign_key_count || 17,
      sub: 'Referential Integrity',
      icon: (
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      color: 'border-pink-500/20 bg-pink-950/20',
    },
    {
      label: 'Total Active Records',
      value: overview?.total_records?.toLocaleString() || '1,500+',
      sub: 'Verified Demo Dataset',
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'border-cyan-500/20 bg-cyan-950/20',
    },
    {
      label: 'Concurrency Control',
      value: 'FOR UPDATE',
      sub: 'Pessimistic Row Locks',
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'border-rose-500/20 bg-rose-950/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border ${s.color} backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:shadow-lg`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 truncate">{s.label}</span>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">{s.icon}</div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {s.value}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
};

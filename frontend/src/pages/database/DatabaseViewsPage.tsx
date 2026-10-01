import React, { useState, useEffect } from 'react';
import type { ViewInfoData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { SQLCodeBlock } from '../../components/database/SQLCodeBlock';
import { Feedback } from '../../components/common/Feedback';

export const DatabaseViewsPage: React.FC = () => {
  const [views, setViews] = useState<ViewInfoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<string>('v_event_sales_summary');

  useEffect(() => {
    loadViews();
  }, []);

  const loadViews = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getViews();
      setViews(data);
    } catch (err) {
      console.error('Failed to load database views', err);
    } finally {
      setLoading(false);
    }
  };

  const activeView = views.find((v) => v.name === selectedView) || views[0];

  if (loading) {
    return <Feedback state="loading" title="Loading analytical PostgreSQL views..." />;
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Database Abstractions & BI
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Analytical PostgreSQL Views (5)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          A database view stores a pre-compiled query definition in the DBMS catalog. Views provide a consistent, high-performance abstraction for business intelligence, reducing complex joins to simple <code className="font-mono text-purple-600 dark:text-purple-400">SELECT * FROM view_name</code> statements.
        </p>
      </div>

      {/* View Selector Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {views.map((v) => (
          <button
            key={v.name}
            onClick={() => setSelectedView(v.name)}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              selectedView === v.name
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-purple-300'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Active View Deep Dive */}
      {activeView && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                  {activeView.name}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                  PostgreSQL View
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {activeView.description}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Source Relational Tables
              </span>
              <div className="flex flex-wrap gap-1 justify-end">
                {activeView.underlying_tables.map((tbl) => (
                  <span
                    key={tbl}
                    className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {tbl}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Architectural Purpose Note */}
          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="block font-semibold mb-0.5">Why This View is Useful:</strong>
              {activeView.purpose}
            </div>
          </div>

          {/* Columns & Definition Grid */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              View Columns ({activeView.columns.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {activeView.columns.map((c) => (
                <span
                  key={c}
                  className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  {c}
                </span>
              ))}
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              SQL View Definition
            </h3>
            <SQLCodeBlock sql={activeView.definition_sql} title={`DDL: ${activeView.name}`} />
          </div>

          {/* Real Live Sample Data Table */}
          {activeView.sample_data && activeView.sample_data.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Materialized Output ({activeView.sample_data.length} sample rows)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Direct from PostgreSQL view
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {Object.keys(activeView.sample_data[0]).map((key) => (
                        <th key={key} className="py-2.5 px-3 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeView.sample_data.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-800 dark:text-slate-300">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

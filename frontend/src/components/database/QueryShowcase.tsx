import React, { useState } from 'react';
import type { QueryShowcaseItemData } from '../../types/database';
import { SQLCodeBlock } from './SQLCodeBlock';
import { databaseApi } from '../../services/databaseApi';

interface QueryShowcaseProps {
  query: QueryShowcaseItemData;
}

export const QueryShowcase: React.FC<QueryShowcaseProps> = ({ query }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryShowcaseItemData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await databaseApi.executeQuery(query.key);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to execute predefined query.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {query.category}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {query.concept}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {query.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {running ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Executing Query...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Run Predefined Query</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
        {query.purpose}
      </p>

      {/* SQL Code Block */}
      <SQLCodeBlock sql={query.sql} title={`SQL: ${query.key}`} />

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 mt-3">
          {error}
        </div>
      )}

      {/* Live Result Output */}
      {result && result.sample_rows && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Execution Output ({result.sample_rows.length} rows)
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              ⚡ {result.execution_time_ms} ms
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {(result.columns || Object.keys(result.sample_rows[0] || {})).map((col) => (
                    <th key={col} className="py-2 px-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.sample_rows.map((row, rIdx) => (
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
  );
};

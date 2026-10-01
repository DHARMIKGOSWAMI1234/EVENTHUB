import React from 'react';
import type { TableDetailData } from '../../types/database';

interface DatabaseSchemaViewerProps {
  table: TableDetailData;
  onClose?: () => void;
}

export const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({ table, onClose }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-8">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xl sm:text-2xl font-black text-indigo-300">
              {table.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PK: {table.primary_key}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-slate-300 bg-slate-800 border border-slate-700">
              {table.row_count.toLocaleString()} rows
            </span>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {table.description}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close detail"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Columns Section */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Column Definitions ({table.columns.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Column</th>
                  <th className="py-2.5 px-4">Data Type</th>
                  <th className="py-2.5 px-4">Nullable</th>
                  <th className="py-2.5 px-4">Default</th>
                  <th className="py-2.5 px-4">Key / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {table.columns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {col.name}
                      {col.is_primary_key && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          PK
                        </span>
                      )}
                      {col.is_foreign_key && (
                        <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                          FK
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-purple-600 dark:text-purple-400 font-medium">{col.data_type}</td>
                    <td className="py-2.5 px-4">
                      {col.is_nullable ? (
                        <span className="text-slate-400 font-sans">NULL</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-sans font-bold">NOT NULL</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {col.column_default || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-xs">
                      {col.foreign_key_target ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                          → {col.foreign_key_target}
                        </span>
                      ) : col.is_primary_key ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Primary Key</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Check Constraints & Indexes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Indexes */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Indexes ({table.indexes.length})
            </h3>
            <div className="space-y-2">
              {table.indexes.map((idx, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                  <div className="flex items-center justify-between font-mono font-semibold text-slate-900 dark:text-white mb-1">
                    <span>{idx.name}</span>
                    {idx.is_unique && (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                        UNIQUE
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    Columns: {idx.columns.join(', ') || 'table'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Triggers & Constraints */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Triggers & Check Constraints
            </h3>
            <div className="space-y-2">
              {table.triggers.map((trig, i) => (
                <div key={i} className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-xs">
                  <div className="flex items-center justify-between font-mono font-semibold text-amber-900 dark:text-amber-300 mb-1">
                    <span>{trig.name}</span>
                    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      {trig.timing} {trig.event}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
                    Function: <code className="font-mono text-indigo-600 dark:text-indigo-400">{trig.trigger_function}</code>
                  </div>
                </div>
              ))}

              {table.check_constraints.map((cc, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">
                    CHECK Constraint
                  </span>
                  <code className="text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                    CHECK ({cc})
                  </code>
                </div>
              ))}

              {table.triggers.length === 0 && table.check_constraints.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No active triggers or check constraints on this table.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sanitized Sample Data */}
        {table.sample_rows && table.sample_rows.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Sanitized Sample Records (Limit 3)
              </h3>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                🔒 Sensitive fields masked ([PROTECTED])
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {Object.keys(table.sample_rows[0]).map((key) => (
                      <th key={key} className="py-2 px-3 whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {table.sample_rows.map((row, rIdx) => (
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
    </div>
  );
};

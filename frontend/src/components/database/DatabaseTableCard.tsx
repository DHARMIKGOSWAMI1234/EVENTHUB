import React from 'react';
import type { TableSummaryData } from '../../types/database';

interface DatabaseTableCardProps {
  table: TableSummaryData;
  onSelect: (tableName: string) => void;
  isSelected?: boolean;
}

export const DatabaseTableCard: React.FC<DatabaseTableCardProps> = ({
  table,
  onSelect,
  isSelected = false,
}) => {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Core Identity':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Catalog & Venues':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Events & Ticketing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Bookings & Payments':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Engagement & System':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      onClick={() => onSelect(table.name)}
      className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
              {table.name}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
              PK: {table.primary_key}
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(
              table.category
            )}`}
          >
            {table.category}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {table.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span title="Columns count">
            <strong className="text-slate-700 dark:text-slate-300">{table.column_count}</strong> cols
          </span>
          <span title="Foreign keys count">
            <strong className="text-slate-700 dark:text-slate-300">{table.foreign_key_count}</strong> FKs
          </span>
          <span title="Indexes count">
            <strong className="text-slate-700 dark:text-slate-300">{table.index_count}</strong> idx
          </span>
        </div>
        <div className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
          {table.row_count.toLocaleString()} rows
        </div>
      </div>
    </div>
  );
};

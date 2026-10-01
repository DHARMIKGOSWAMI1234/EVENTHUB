import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner, EmptyState } from './Feedback';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display.',
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12">
        <LoadingSpinner message="Loading records..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden border border-slate-800 rounded-2xl bg-slate-900/60 shadow-xl ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {columns.map((col) => (
                <th key={col.key} className={`py-3.5 px-4 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-800/40 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-3.5 px-4 align-middle ${col.className || ''}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-3 text-xs text-slate-400 ${className}`}>
      {totalItems !== undefined && (
        <span>
          Showing page <strong className="text-white">{currentPage}</strong> of{' '}
          <strong className="text-white">{totalPages}</strong> ({totalItems} total items)
        </span>
      )}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
          {currentPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

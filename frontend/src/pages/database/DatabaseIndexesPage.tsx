import React, { useState, useEffect } from 'react';
import type { IndexSummaryData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { Feedback } from '../../components/common/Feedback';

export const DatabaseIndexesPage: React.FC = () => {
  const [indexes, setIndexes] = useState<IndexSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('ALL');
  const [filterUniqueOnly, setFilterUniqueOnly] = useState(false);

  useEffect(() => {
    loadIndexes();
  }, []);

  const loadIndexes = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getIndexes();
      setIndexes(data);
    } catch (err) {
      console.error('Failed to load indexes', err);
    } finally {
      setLoading(false);
    }
  };

  const tables = Array.from(new Set(indexes.map((idx) => idx.table))).sort();

  const filteredIndexes = indexes.filter((idx) => {
    const matchesTable = selectedTable === 'ALL' || idx.table === selectedTable;
    const matchesUnique = !filterUniqueOnly || idx.is_unique;
    return matchesTable && matchesUnique;
  });

  if (loading) {
    return <Feedback state="loading" title="Loading PostgreSQL B-tree indexes..." />;
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          Query Optimization & Physical Storage
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          PostgreSQL B-Tree Indexes ({indexes.length})
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Indexes accelerate data retrieval without scanning every page in a table. In EVENTHUB, B-tree indexes optimize foreign key joins, email lookups, booking reference matching, category filtering, and status checks.
        </p>
      </div>

      {/* Rationale Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 text-xs">
          <strong className="block font-bold text-sky-900 dark:text-sky-300 text-sm mb-1">
            ⚡ O(log N) Lookups
          </strong>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Unique indexes on <code className="font-mono">users.email</code>, <code className="font-mono">tickets.ticket_code</code>, and <code className="font-mono">bookings.booking_reference</code> provide logarithmic point lookups.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs">
          <strong className="block font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-1">
            🔗 High-Speed JOINs
          </strong>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Indexes on foreign key columns (<code className="font-mono">event_id</code>, <code className="font-mono">user_id</code>, <code className="font-mono">venue_id</code>) eliminate full table scans during nested loop and hash joins.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
          <strong className="block font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1">
            🛡️ Uniqueness Enforcement
          </strong>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Composite unique indexes on <code className="font-mono">(venue_id, seat_label)</code>, <code className="font-mono">(user_id, event_id)</code> prevent duplicates directly at the storage engine level.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTable('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              selectedTable === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Tables ({indexes.length})
          </button>
          {tables.map((tbl) => (
            <button
              key={tbl}
              onClick={() => setSelectedTable(tbl)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
                selectedTable === tbl
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tbl}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filterUniqueOnly}
            onChange={(e) => setFilterUniqueOnly(e.target.checked)}
            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          Show Unique Indexes Only
        </label>
      </div>

      {/* Indexes Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold font-sans">
            <tr>
              <th className="py-3 px-4">Index Name</th>
              <th className="py-3 px-4">Table</th>
              <th className="py-3 px-4">Indexed Column(s)</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 font-sans">Architectural Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredIndexes.map((idx, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  {idx.name}
                </td>
                <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {idx.table}
                </td>
                <td className="py-3 px-4 text-purple-600 dark:text-purple-400">
                  ({idx.columns.join(', ')})
                </td>
                <td className="py-3 px-4 font-sans">
                  {idx.is_unique ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                      UNIQUE BTREE
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      BTREE
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                  {idx.purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

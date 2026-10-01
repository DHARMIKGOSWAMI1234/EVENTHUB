import React, { useState } from 'react';
import type { SchemaRelationshipsData } from '../../types/database';

interface DatabaseRelationshipGraphProps {
  data: SchemaRelationshipsData;
  onSelectTable?: (tableName: string) => void;
}

export const DatabaseRelationshipGraph: React.FC<DatabaseRelationshipGraphProps> = ({
  data,
  onSelectTable,
}) => {
  const [selectedTable, setSelectedTable] = useState<string | null>('events');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTables = data.tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeRelationships = data.relationships.filter(
    (r) => !selectedTable || r.from_table === selectedTable || r.to_table === selectedTable
  );

  const outgoing = data.relationships.filter((r) => r.from_table === selectedTable);
  const incoming = data.relationships.filter((r) => r.to_table === selectedTable);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Relational Mapping
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Entity-Relationship (ER) Diagram & Foreign Keys
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            16 Normalized relational entities connected by 17 referential integrity constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {selectedTable && (
            <button
              onClick={() => setSelectedTable(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              Clear Focus
            </button>
          )}
        </div>
      </div>

      {/* Interactive Entity Nodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 mb-6">
        {filteredTables.map((t) => {
          const isCurrent = selectedTable === t.name;
          const isConnected =
            selectedTable &&
            data.relationships.some(
              (r) =>
                (r.from_table === selectedTable && r.to_table === t.name) ||
                (r.to_table === selectedTable && r.from_table === t.name)
            );

          return (
            <button
              key={t.name}
              onClick={() => {
                setSelectedTable(t.name);
                if (onSelectTable) onSelectTable(t.name);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isCurrent
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-105'
                  : isConnected
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono opacity-80 mb-0.5">
                {t.row_count} rows
              </div>
              <div className="font-mono font-bold text-xs truncate">{t.name}</div>
            </button>
          );
        })}
      </div>

      {/* Relationship Graph Viewer Panel */}
      {selectedTable ? (
        <div className="p-6 rounded-2xl bg-slate-950 text-white border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-indigo-400 font-mono font-semibold uppercase tracking-wider">
                Selected Entity Node
              </span>
              <h3 className="text-2xl font-black font-mono text-white flex items-center gap-3 mt-1">
                {selectedTable}
                <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {outgoing.length} Outgoing FKs • {incoming.length} Incoming FKs
                </span>
              </h3>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Table PK: <span className="text-emerald-400 font-bold">id</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outgoing Relationships (This table references others) */}
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Outgoing References (Foreign Keys in {selectedTable})
              </h4>
              {outgoing.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-500 font-mono">
                  No outgoing foreign keys (Parent / Root Entity)
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outgoing.map((rel, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedTable(rel.to_table)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-purple-300 font-bold">{rel.from_column}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-purple-900/60 text-purple-200">
                          {rel.cardinality}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span>points to</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {rel.to_table}.{rel.to_column}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Relationships (Other tables reference this table) */}
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Incoming References (Referenced by other tables)
              </h4>
              {incoming.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-500 font-mono">
                  No incoming foreign keys (Leaf Entity)
                </div>
              ) : (
                <div className="space-y-2.5">
                  {incoming.map((rel, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedTable(rel.from_table)}
                      className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-emerald-300 font-bold">
                          {rel.from_table}.{rel.from_column}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-900/60 text-emerald-200">
                          {rel.cardinality}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span>references</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {rel.to_table}.{rel.to_column}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Full Schema Foreign Key Matrix */
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">From Table</th>
                <th className="py-2.5 px-4">Foreign Column</th>
                <th className="py-2.5 px-4">Target Table</th>
                <th className="py-2.5 px-4">Target Column</th>
                <th className="py-2.5 px-4">Cardinality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeRelationships.map((r, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedTable(r.from_table)}
                  className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{r.from_table}</td>
                  <td className="py-2.5 px-4 text-purple-600 dark:text-purple-400">{r.from_column}</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{r.to_table}</td>
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{r.to_column}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {r.cardinality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

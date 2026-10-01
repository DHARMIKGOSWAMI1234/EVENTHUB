import React, { useState, useEffect } from 'react';
import type { TriggerInfoData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { Feedback } from '../../components/common/Feedback';

export const DatabaseTriggersPage: React.FC = () => {
  const [triggers, setTriggers] = useState<TriggerInfoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('ALL');

  useEffect(() => {
    loadTriggers();
  }, []);

  const loadTriggers = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getTriggers();
      setTriggers(data);
    } catch (err) {
      console.error('Failed to load triggers', err);
    } finally {
      setLoading(false);
    }
  };

  const tablesWithTriggers = Array.from(new Set(triggers.map((t) => t.table))).sort();

  const filteredTriggers = triggers.filter(
    (t) => selectedTable === 'ALL' || t.table === selectedTable
  );

  if (loading) {
    return <Feedback state="loading" title="Loading active PostgreSQL triggers..." />;
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Automated Event Listeners & Integrity
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Active Database Triggers ({triggers.length})
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          PostgreSQL triggers execute automatically in response to specified database events (<code className="font-mono text-amber-600 dark:text-amber-400">INSERT</code>, <code className="font-mono text-amber-600 dark:text-amber-400">UPDATE</code>, <code className="font-mono text-amber-600 dark:text-amber-400">DELETE</code>). EVENTHUB relies on triggers for automated timestamp updates, audit logging into the ledger, state-machine validation, and real-time inventory count synchronization.
        </p>
      </div>

      {/* Trigger Workflow Concept Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 mb-8 shadow-sm">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 mb-4">
          Trigger Execution Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-xs font-mono text-slate-400 block mb-1">1. DML Action</span>
            <strong className="text-sm text-white font-mono">INSERT / UPDATE / DELETE</strong>
            <p className="text-[11px] text-slate-400 mt-1">Caller executes mutation</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50">
            <span className="text-xs font-mono text-amber-400 block mb-1">2. Event Interception</span>
            <strong className="text-sm text-amber-300 font-mono">BEFORE or AFTER</strong>
            <p className="text-[11px] text-slate-400 mt-1">Trigger condition fires</p>
          </div>
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
            <span className="text-xs font-mono text-indigo-400 block mb-1">3. Function Execution</span>
            <strong className="text-sm text-indigo-300 font-mono">PL/pgSQL Trigger Routine</strong>
            <p className="text-[11px] text-slate-400 mt-1">Checks or updates state</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
            <span className="text-xs font-mono text-emerald-400 block mb-1">4. Atomic Effect</span>
            <strong className="text-sm text-emerald-300 font-mono">Audit / Sync / Pass / Abort</strong>
            <p className="text-[11px] text-slate-400 mt-1">Guarantees consistency</p>
          </div>
        </div>
      </div>

      {/* Table Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedTable('ALL')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
            selectedTable === 'ALL'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Tables ({triggers.length})
        </button>
        {tablesWithTriggers.map((tbl) => (
          <button
            key={tbl}
            onClick={() => setSelectedTable(tbl)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium font-mono transition-all cursor-pointer ${
              selectedTable === tbl
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {tbl}
          </button>
        ))}
      </div>

      {/* Triggers Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Trigger Name</th>
              <th className="py-3 px-4">Target Table</th>
              <th className="py-3 px-4">Timing & Event</th>
              <th className="py-3 px-4">Trigger Procedure</th>
              <th className="py-3 px-4">Architectural Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTriggers.map((trig, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  {trig.name}
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {trig.table}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {trig.timing} {trig.event}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400 font-medium">
                  {trig.trigger_function}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-sans leading-relaxed max-w-md">
                  {trig.purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

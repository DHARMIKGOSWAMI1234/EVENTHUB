import React, { useState, useEffect } from 'react';
import type { FunctionInfoData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { SQLCodeBlock } from '../../components/database/SQLCodeBlock';
import { Feedback } from '../../components/common/Feedback';

export const DatabaseFunctionsPage: React.FC = () => {
  const [functions, setFunctions] = useState<FunctionInfoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'BUSINESS_LOGIC' | 'TRIGGER_FUNCTION'>('ALL');

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getFunctions();
      setFunctions(data);
    } catch (err) {
      console.error('Failed to load database functions', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFunctions = functions.filter(
    (f) => activeCategory === 'ALL' || f.category === activeCategory
  );

  if (loading) {
    return <Feedback state="loading" title="Loading stored database procedures..." />;
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          PL/pgSQL Procedural Programming
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Stored Procedures & Trigger Functions ({functions.length})
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Stored functions execute procedural PL/pgSQL logic directly within PostgreSQL. By computing monetary sums, inventory quotas, and hold releases on the database server, EVENTHUB eliminates network latency and ensures transactional consistency.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeCategory === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Procedures ({functions.length})
        </button>
        <button
          onClick={() => setActiveCategory('BUSINESS_LOGIC')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeCategory === 'BUSINESS_LOGIC'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Business Logic Functions (4)
        </button>
        <button
          onClick={() => setActiveCategory('TRIGGER_FUNCTION')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeCategory === 'TRIGGER_FUNCTION'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Trigger Procedures (5)
        </button>
      </div>

      {/* Functions Grid */}
      <div className="space-y-6">
        {filteredFunctions.map((fn) => (
          <div
            key={fn.name}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      fn.category === 'BUSINESS_LOGIC'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {fn.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Returns: <strong className="text-purple-600 dark:text-purple-400">{fn.return_type}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {fn.name}(<span className="text-slate-500 font-normal">{fn.arguments}</span>)
                </h3>
              </div>

              <div className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Example:</span> {fn.example_usage}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              {fn.description}
            </p>

            {/* SQL Definition */}
            <SQLCodeBlock sql={fn.definition_sql} title={`PL/pgSQL: ${fn.name}()`} />
          </div>
        ))}
      </div>
    </div>
  );
};

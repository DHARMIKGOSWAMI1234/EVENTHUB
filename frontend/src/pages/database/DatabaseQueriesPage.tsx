import React, { useState, useEffect } from 'react';
import type { QueryShowcaseItemData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { QueryShowcase } from '../../components/database/QueryShowcase';
import { Feedback } from '../../components/common/Feedback';

export const DatabaseQueriesPage: React.FC = () => {
  const [queries, setQueries] = useState<QueryShowcaseItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getQueries();
      setQueries(data);
    } catch (err) {
      console.error('Failed to load query showcase', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'JOIN Operations',
    'Aggregation',
    'Subqueries',
    'Advanced SQL',
    'Views',
    'Stored Functions',
    'Transactions',
    'Concurrency',
  ];

  const filteredQueries = queries.filter((q) => {
    const matchesCategory =
      selectedCategory === 'All' || q.category === selectedCategory;
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <Feedback state="loading" title="Loading SQL query showcase..." />;
  }

  return (
    <div>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Interactive SQL Workbench
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            DBMS Query Showcase (15 Live Queries)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Demonstrates core DBMS query mechanisms on real EVENTHUB data: multi-table JOINs, subqueries, CTEs, window functions (<code className="font-mono text-indigo-600 dark:text-indigo-400">DENSE_RANK</code>), conditional aggregates, and row-level locks. Predefined and execute-safe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 mb-6 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Read-Only Query Execution:</strong> All queries are parameter-safe and allowlisted. You can copy the SQL or click <strong>Run Predefined Query</strong> to execute them against the live PostgreSQL database.
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Queries List */}
      <div className="space-y-6">
        {filteredQueries.map((q) => (
          <QueryShowcase key={q.key} query={q} />
        ))}

        {filteredQueries.length === 0 && (
          <div className="p-12 text-center">
            <Feedback
              state="empty"
              title="No queries found"
              message="No queries matched your search or category filter."
            />
          </div>
        )}
      </div>
    </div>
  );
};

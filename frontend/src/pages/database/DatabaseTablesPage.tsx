import React, { useState, useEffect } from 'react';
import type { TableSummaryData, TableDetailData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { DatabaseTableCard } from '../../components/database/DatabaseTableCard';
import { DatabaseSchemaViewer } from '../../components/database/DatabaseSchemaViewer';
import { Feedback } from '../../components/common/Feedback';

interface DatabaseTablesPageProps {
  tables: TableSummaryData[];
  initialSelectedTable?: string | null;
}

export const DatabaseTablesPage: React.FC<DatabaseTablesPageProps> = ({
  tables,
  initialSelectedTable,
}) => {
  const [selectedTableName, setSelectedTableName] = useState<string | null>(
    initialSelectedTable || 'events'
  );
  const [tableDetail, setTableDetail] = useState<TableDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (selectedTableName) {
      loadDetail(selectedTableName);
    }
  }, [selectedTableName]);

  const loadDetail = async (tbl: string) => {
    try {
      setLoadingDetail(true);
      const detail = await databaseApi.getTableDetail(tbl);
      setTableDetail(detail);
    } catch (err) {
      console.error('Failed to load table detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const categories = [
    'All',
    'Core Identity',
    'Catalog & Venues',
    'Events & Ticketing',
    'Bookings & Payments',
    'Engagement & System',
  ];

  const filteredTables = tables.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            PostgreSQL Relational Schema
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Core Database Tables (16)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Normalized 3NF relational structure enforcing referential integrity and entity state transitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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

      {/* Detail Viewer */}
      {selectedTableName && (
        <div id="table-detail-section">
          {loadingDetail ? (
            <div className="p-12 text-center">
              <Feedback state="loading" title={`Loading schema for ${selectedTableName}...`} />
            </div>
          ) : tableDetail ? (
            <DatabaseSchemaViewer
              table={tableDetail}
              onClose={() => setSelectedTableName(null)}
            />
          ) : null}
        </div>
      )}

      {/* 16 Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((t) => (
          <DatabaseTableCard
            key={t.name}
            table={t}
            isSelected={selectedTableName === t.name}
            onSelect={(name) => {
              setSelectedTableName(name);
              // Smooth scroll to detail if on mobile
              const el = document.getElementById('table-detail-section');
              if (el && window.innerWidth < 768) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="p-12 text-center">
          <Feedback
            state="empty"
            title="No matching tables found"
            message="Try adjusting your search query or category filter."
          />
        </div>
      )}
    </div>
  );
};

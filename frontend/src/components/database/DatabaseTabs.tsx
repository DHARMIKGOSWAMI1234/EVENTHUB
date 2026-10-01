import React from 'react';

export type DatabaseTabKey =
  | 'overview'
  | 'tables'
  | 'relationships'
  | 'views'
  | 'functions'
  | 'triggers'
  | 'indexes'
  | 'normalization'
  | 'concurrency'
  | 'queries'
  | 'concepts'
  | 'exports';

interface DatabaseTabsProps {
  activeTab: DatabaseTabKey;
  onTabChange: (tab: DatabaseTabKey) => void;
  counts?: {
    tables?: number;
    views?: number;
    triggers?: number;
    functions?: number;
    indexes?: number;
  };
}

export const DatabaseTabs: React.FC<DatabaseTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs: Array<{ key: DatabaseTabKey; label: string; badge?: number | string }> = [
    { key: 'overview', label: 'Overview & Architecture' },
    { key: 'tables', label: 'Tables', badge: counts?.tables || 16 },
    { key: 'relationships', label: 'ER Diagram & FKs' },
    { key: 'views', label: 'Views', badge: counts?.views || 5 },
    { key: 'functions', label: 'Functions', badge: counts?.functions || 9 },
    { key: 'triggers', label: 'Triggers', badge: counts?.triggers || 18 },
    { key: 'indexes', label: 'Indexes', badge: counts?.indexes || 55 },
    { key: 'normalization', label: 'Normalization & Rules' },
    { key: 'concurrency', label: 'ACID & Concurrency' },
    { key: 'queries', label: 'Query Showcase', badge: '15' },
    { key: 'concepts', label: 'DBMS Concepts & Viva' },
    { key: 'exports', label: 'Exports' },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto scrollbar-none">
      <nav className="flex space-x-1 sm:space-x-2 min-w-max pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-800 text-indigo-100'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import type {
  DatabaseOverviewData,
  TableSummaryData,
  SchemaRelationshipsData,
  DatabaseStatisticsData,
} from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { DatabaseTabs, type DatabaseTabKey } from '../../components/database/DatabaseTabs';
import { DatabaseOverviewPage } from './DatabaseOverviewPage';
import { DatabaseTablesPage } from './DatabaseTablesPage';
import { DatabaseRelationshipGraph } from '../../components/database/DatabaseRelationshipGraph';
import { DatabaseViewsPage } from './DatabaseViewsPage';
import { DatabaseFunctionsPage } from './DatabaseFunctionsPage';
import { DatabaseTriggersPage } from './DatabaseTriggersPage';
import { DatabaseIndexesPage } from './DatabaseIndexesPage';
import { DatabaseNormalizationPage } from './DatabaseNormalizationPage';
import { DatabaseConcurrencyPage } from './DatabaseConcurrencyPage';
import { DatabaseQueriesPage } from './DatabaseQueriesPage';
import { DatabaseConceptsPage } from './DatabaseConceptsPage';
import { DatabaseExportsPage } from './DatabaseExportsPage';
import { Feedback } from '../../components/common/Feedback';

export const DatabasePortalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab: pathTab } = useParams<{ tab?: string }>();

  const initialTab =
    (pathTab as DatabaseTabKey) || (searchParams.get('tab') as DatabaseTabKey) || 'overview';

  const [activeTab, setActiveTab] = useState<DatabaseTabKey>(initialTab);
  const [overview, setOverview] = useState<DatabaseOverviewData | null>(null);
  const [tables, setTables] = useState<TableSummaryData[]>([]);
  const [relationships, setRelationships] = useState<SchemaRelationshipsData | null>(null);
  const [statistics, setStatistics] = useState<DatabaseStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const urlTab = (pathTab as DatabaseTabKey) || (searchParams.get('tab') as DatabaseTabKey);
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [pathTab, searchParams]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ov, tbls, rels, stats] = await Promise.all([
        databaseApi.getOverview(),
        databaseApi.getTables(),
        databaseApi.getRelationships(),
        databaseApi.getStatistics(),
      ]);
      setOverview(ov);
      setTables(tbls);
      setRelationships(rels);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to load database metadata', err);
      setError(err?.response?.data?.detail || 'Failed to connect to the PostgreSQL database.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: DatabaseTabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    try {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // ignore in tests
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Feedback state="loading" title="Connecting to PostgreSQL 18.6 & reading catalog metadata..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Feedback
          state="error"
          title="Database Portal Connection Error"
          message={error}
          actionLabel="Retry Connection"
          onAction={loadInitialData}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Tab Switcher */}
      <DatabaseTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={{
          tables: tables.length,
          views: overview?.view_count || 5,
          triggers: overview?.trigger_count || 18,
          functions: (overview?.function_count || 4) + (overview?.trigger_function_count || 5),
          indexes: overview?.index_count || 55,
        }}
      />

      {/* Main Tab View */}
      {activeTab === 'overview' && (
        <DatabaseOverviewPage
          overview={overview}
          statistics={statistics}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'tables' && (
        <DatabaseTablesPage tables={tables} />
      )}

      {activeTab === 'relationships' && relationships && (
        <DatabaseRelationshipGraph data={relationships} />
      )}

      {activeTab === 'views' && <DatabaseViewsPage />}

      {activeTab === 'functions' && <DatabaseFunctionsPage />}

      {activeTab === 'triggers' && <DatabaseTriggersPage />}

      {activeTab === 'indexes' && <DatabaseIndexesPage />}

      {activeTab === 'normalization' && <DatabaseNormalizationPage />}

      {activeTab === 'concurrency' && <DatabaseConcurrencyPage />}

      {activeTab === 'queries' && <DatabaseQueriesPage />}

      {activeTab === 'concepts' && <DatabaseConceptsPage />}

      {activeTab === 'exports' && <DatabaseExportsPage />}
    </div>
  );
};

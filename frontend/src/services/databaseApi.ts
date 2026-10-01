import { apiClient } from './api';
import type {
  DatabaseOverviewData,
  TableSummaryData,
  TableDetailData,
  SchemaRelationshipsData,
  ViewInfoData,
  FunctionInfoData,
  TriggerInfoData,
  IndexSummaryData,
  DatabaseStatisticsData,
  QueryShowcaseItemData,
  ExportItemData,
} from '../types/database';

export const databaseApi = {
  getOverview: (): Promise<DatabaseOverviewData> =>
    apiClient<DatabaseOverviewData>('/database/overview'),

  getTables: (): Promise<TableSummaryData[]> =>
    apiClient<TableSummaryData[]>('/database/tables'),

  getTableDetail: (tableName: string): Promise<TableDetailData> =>
    apiClient<TableDetailData>(`/database/tables/${tableName}`),

  getRelationships: (): Promise<SchemaRelationshipsData> =>
    apiClient<SchemaRelationshipsData>('/database/relationships'),

  getViews: (): Promise<ViewInfoData[]> =>
    apiClient<ViewInfoData[]>('/database/views'),

  getViewDetail: (viewName: string): Promise<ViewInfoData> =>
    apiClient<ViewInfoData>(`/database/views/${viewName}`),

  getFunctions: (): Promise<FunctionInfoData[]> =>
    apiClient<FunctionInfoData[]>('/database/functions'),

  getTriggers: (): Promise<TriggerInfoData[]> =>
    apiClient<TriggerInfoData[]>('/database/triggers'),

  getIndexes: (): Promise<IndexSummaryData[]> =>
    apiClient<IndexSummaryData[]>('/database/indexes'),

  getStatistics: (): Promise<DatabaseStatisticsData> =>
    apiClient<DatabaseStatisticsData>('/database/statistics'),

  getQueries: (): Promise<QueryShowcaseItemData[]> =>
    apiClient<QueryShowcaseItemData[]>('/database/queries'),

  executeQuery: (queryKey: string): Promise<QueryShowcaseItemData> =>
    apiClient<QueryShowcaseItemData>(`/database/queries/${queryKey}`),

  getExports: (): Promise<ExportItemData[]> =>
    apiClient<ExportItemData[]>('/database/exports'),

  getExportDownloadUrl: (filename: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${baseUrl}/database/exports/download/${filename}`;
  },
};

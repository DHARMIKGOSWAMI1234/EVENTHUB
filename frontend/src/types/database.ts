/**
 * EVENTHUB Database Portal & Showcase Types
 */

export interface DatabaseOverviewData {
  engine: string;
  database_name: string;
  table_count: number;
  view_count: number;
  trigger_count: number;
  function_count: number;
  trigger_function_count: number;
  foreign_key_count: number;
  index_count: number;
  total_records: number;
  features: string[];
  architecture: {
    client_layer: string;
    api_layer: string;
    orm_layer: string;
    dbms_engine: string;
    features: string[];
  };
}

export interface TableColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  column_default?: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_key_target?: string | null;
  check_constraint?: string | null;
}

export interface TableIndexInfo {
  name: string;
  columns: string[];
  is_unique: boolean;
  index_type: string;
  definition: string;
  purpose?: string | null;
}

export interface TableForeignKeyInfo {
  constraint_name: string;
  column: string;
  foreign_table: string;
  foreign_column: string;
}

export interface TableTriggerInfo {
  name: string;
  event: string;
  timing: string;
  trigger_function: string;
  purpose?: string | null;
}

export interface TableSummaryData {
  name: string;
  description: string;
  row_count: number;
  column_count: number;
  primary_key: string;
  foreign_key_count: number;
  index_count: number;
  category: string;
}

export interface TableDetailData {
  name: string;
  description: string;
  row_count: number;
  primary_key: string;
  columns: TableColumnInfo[];
  indexes: TableIndexInfo[];
  foreign_keys: TableForeignKeyInfo[];
  triggers: TableTriggerInfo[];
  check_constraints: string[];
  sample_rows: Record<string, any>[];
}

export interface RelationshipEdge {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  constraint_name: string;
  cardinality: string;
}

export interface SchemaRelationshipsData {
  tables: TableSummaryData[];
  relationships: RelationshipEdge[];
}

export interface ViewInfoData {
  name: string;
  description: string;
  purpose: string;
  underlying_tables: string[];
  columns: string[];
  definition_sql: string;
  sample_data?: Record<string, any>[];
}

export interface FunctionInfoData {
  name: string;
  return_type: string;
  arguments: string;
  category: "BUSINESS_LOGIC" | "TRIGGER_FUNCTION";
  description: string;
  definition_sql: string;
  example_usage: string;
}

export interface TriggerInfoData {
  name: string;
  table: string;
  event: string;
  timing: string;
  trigger_function: string;
  purpose: string;
}

export interface IndexSummaryData {
  name: string;
  table: string;
  columns: string[];
  is_unique: boolean;
  index_type: string;
  purpose: string;
  definition: string;
}

export interface DatabaseStatisticsData {
  engine_version: string;
  database_size_bytes: number;
  database_size_pretty: string;
  table_sizes: Array<{
    table: string;
    row_count: number;
    size_pretty: string;
    size_bytes: number;
  }>;
  largest_tables_by_rows: Array<{
    table: string;
    row_count: number;
    size_pretty: string;
    size_bytes: number;
  }>;
  total_records: number;
  summary_counts: Record<string, number>;
}

export interface QueryShowcaseItemData {
  key: string;
  title: string;
  category: string;
  concept: string;
  purpose: string;
  sql: string;
  columns?: string[];
  sample_rows?: Record<string, any>[];
  execution_time_ms?: number;
  row_count?: number;
}

export interface ExportItemData {
  filename: string;
  title: string;
  description: string;
  file_size_bytes: number;
  file_size_formatted: string;
  format: string;
  download_url: string;
}

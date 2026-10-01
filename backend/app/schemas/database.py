"""EVENTHUB Database Portal Schemas

Defines Pydantic models for read-only database metadata, schema introspection,
views, stored functions, triggers, indexes, and predefined DBMS queries.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DatabaseOverview(BaseModel):
    engine: str = "PostgreSQL 18.6"
    database_name: str = "eventhub"
    table_count: int = 16
    view_count: int = 5
    trigger_count: int = 18
    function_count: int = 4
    trigger_function_count: int = 5
    foreign_key_count: int = 17
    index_count: int = 55
    total_records: int
    features: List[str]
    architecture: Dict[str, Any]


class TableColumnInfo(BaseModel):
    name: str
    data_type: str
    is_nullable: bool
    column_default: Optional[str] = None
    is_primary_key: bool = False
    is_foreign_key: bool = False
    foreign_key_target: Optional[str] = None
    check_constraint: Optional[str] = None


class TableIndexInfo(BaseModel):
    name: str
    columns: List[str]
    is_unique: bool
    index_type: str = "btree"
    definition: str
    purpose: Optional[str] = None


class TableForeignKeyInfo(BaseModel):
    constraint_name: str
    column: str
    foreign_table: str
    foreign_column: str


class TableTriggerInfo(BaseModel):
    name: str
    event: str
    timing: str
    trigger_function: str
    purpose: Optional[str] = None


class TableSummary(BaseModel):
    name: str
    description: str
    row_count: int
    column_count: int
    primary_key: str
    foreign_key_count: int
    index_count: int
    category: str  # Core, Booking, Catalog, System


class TableDetail(BaseModel):
    name: str
    description: str
    row_count: int
    primary_key: str
    columns: List[TableColumnInfo]
    indexes: List[TableIndexInfo]
    foreign_keys: List[TableForeignKeyInfo]
    triggers: List[TableTriggerInfo]
    check_constraints: List[str]
    sample_rows: List[Dict[str, Any]]


class RelationshipEdge(BaseModel):
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    constraint_name: str
    cardinality: str  # "many-to-one", "one-to-many", "one-to-one"


class SchemaRelationships(BaseModel):
    tables: List[TableSummary]
    relationships: List[RelationshipEdge]


class ViewInfo(BaseModel):
    name: str
    description: str
    purpose: str
    underlying_tables: List[str]
    columns: List[str]
    definition_sql: str
    sample_data: Optional[List[Dict[str, Any]]] = None


class FunctionInfo(BaseModel):
    name: str
    return_type: str
    arguments: str
    category: str  # "BUSINESS_LOGIC" or "TRIGGER_FUNCTION"
    description: str
    definition_sql: str
    example_usage: str


class TriggerInfo(BaseModel):
    name: str
    table: str
    event: str
    timing: str
    trigger_function: str
    purpose: str


class IndexSummary(BaseModel):
    name: str
    table: str
    columns: List[str]
    is_unique: bool
    index_type: str
    purpose: str
    definition: str


class DatabaseStatistics(BaseModel):
    engine_version: str
    database_size_bytes: int
    database_size_pretty: str
    table_sizes: List[Dict[str, Any]]
    largest_tables_by_rows: List[Dict[str, Any]]
    total_records: int
    summary_counts: Dict[str, int]


class QueryShowcaseItem(BaseModel):
    key: str
    title: str
    category: str
    concept: str
    purpose: str
    sql: str
    columns: Optional[List[str]] = None
    sample_rows: Optional[List[Dict[str, Any]]] = None
    execution_time_ms: Optional[float] = None
    row_count: Optional[int] = None


class ExportItem(BaseModel):
    filename: str
    title: str
    description: str
    file_size_bytes: int
    file_size_formatted: str
    format: str
    download_url: str

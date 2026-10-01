"""EVENTHUB Database Portal Router

Exposes read-only database metadata, schema information, analytical view definitions,
stored functions, active triggers, indexes, and predefined DBMS query demonstrations.

CRITICAL SECURITY RULES:
- Read-only endpoints only (GET).
- No arbitrary SQL console.
- Parameter allowlisting for table names, view names, query keys, and export filenames.
- Automatic masking of sensitive user fields (passwords, tokens).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.database import (
    DatabaseOverview,
    TableSummary,
    TableDetail,
    SchemaRelationships,
    ViewInfo,
    FunctionInfo,
    TriggerInfo,
    IndexSummary,
    DatabaseStatistics,
    QueryShowcaseItem,
    ExportItem,
)
from app.services import database_service

router = APIRouter(prefix="/database", tags=["Database Portal"])


@router.get(
    "/overview",
    response_model=DatabaseOverview,
    summary="Get database architecture and high-level DBMS metrics",
)
def get_overview(db: Session = Depends(get_db)) -> DatabaseOverview:
    """Returns database engine details, counts of tables, views, triggers, and architectural components."""
    return database_service.get_database_overview(db)


@router.get(
    "/tables",
    response_model=List[TableSummary],
    summary="List all 16 core relational tables with summary metrics",
)
def list_tables(db: Session = Depends(get_db)) -> List[TableSummary]:
    """Returns all 16 relational database tables with row counts, primary keys, and constraint counts."""
    return database_service.get_tables_summary(db)


@router.get(
    "/tables/{table_name}",
    response_model=TableDetail,
    summary="Get detailed schema, columns, constraints, and sample data for a table",
)
def get_table(table_name: str, db: Session = Depends(get_db)) -> TableDetail:
    """Returns column types, nullable status, defaults, foreign keys, indexes, triggers, and sanitized sample rows."""
    detail = database_service.get_table_detail(db, table_name.lower())
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table '{table_name}' not found in core EVENTHUB schema.",
        )
    return detail


@router.get(
    "/relationships",
    response_model=SchemaRelationships,
    summary="Get table-to-table foreign key relationships for ER diagrams",
)
def get_relationships(db: Session = Depends(get_db)) -> SchemaRelationships:
    """Returns relational foreign key graph edges and table metadata for Entity-Relationship diagrams."""
    return database_service.get_schema_relationships(db)


@router.get(
    "/views",
    response_model=List[ViewInfo],
    summary="List the 5 analytical PostgreSQL views",
)
def list_views(db: Session = Depends(get_db)) -> List[ViewInfo]:
    """Returns metadata, column definitions, and sample rows for the 5 analytical views."""
    return database_service.get_views_metadata(db)


@router.get(
    "/views/{view_name}",
    response_model=ViewInfo,
    summary="Get definition SQL and sample data for a specific view",
)
def get_view(view_name: str, db: Session = Depends(get_db)) -> ViewInfo:
    """Returns SQL definition and sample rows for an allowlisted PostgreSQL view."""
    view_info = database_service.get_view_detail(db, view_name.lower())
    if not view_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"View '{view_name}' not found in analytical views catalog.",
        )
    return view_info


@router.get(
    "/functions",
    response_model=List[FunctionInfo],
    summary="List stored business functions and trigger procedures",
)
def list_functions(db: Session = Depends(get_db)) -> List[FunctionInfo]:
    """Returns stored business functions and trigger procedures with SQL source and usage examples."""
    return database_service.get_stored_functions(db)


@router.get(
    "/triggers",
    response_model=List[TriggerInfo],
    summary="List all 18 active database triggers",
)
def list_triggers(db: Session = Depends(get_db)) -> List[TriggerInfo]:
    """Returns all 18 PostgreSQL triggers with events, timings, target tables, and trigger functions."""
    return database_service.get_triggers_list(db)


@router.get(
    "/indexes",
    response_model=List[IndexSummary],
    summary="List all B-tree indexes across the schema",
)
def list_indexes(db: Session = Depends(get_db)) -> List[IndexSummary]:
    """Returns index definitions, indexed columns, uniqueness constraints, and architectural purposes."""
    return database_service.get_indexes_list(db)


@router.get(
    "/statistics",
    response_model=DatabaseStatistics,
    summary="Get real PostgreSQL storage, table sizes, and row distributions",
)
def get_statistics(db: Session = Depends(get_db)) -> DatabaseStatistics:
    """Returns database size, table sizes from pg_total_relation_size, and record volume distributions."""
    return database_service.get_database_statistics(db)


@router.get(
    "/queries",
    response_model=List[QueryShowcaseItem],
    summary="List the 15 predefined DBMS educational query cards",
)
def list_queries() -> List[QueryShowcaseItem]:
    """Returns allowlisted query cards covering JOINs, Subqueries, CTEs, Window Functions, and Transactions."""
    return database_service.get_queries_catalog()


@router.get(
    "/queries/{query_key}",
    response_model=QueryShowcaseItem,
    summary="Execute a predefined, allowlisted DBMS showcase query",
)
def execute_query(query_key: str, db: Session = Depends(get_db)) -> QueryShowcaseItem:
    """Executes an allowlisted educational query safely and returns execution time, columns, and results."""
    item = database_service.execute_predefined_query(db, query_key.lower())
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query key '{query_key}' not found in educational query showcase.",
        )
    return item


@router.get(
    "/exports",
    response_model=List[ExportItem],
    summary="List available database dump and CSV export files",
)
def list_exports() -> List[ExportItem]:
    """Lists verifiable database export files available for download."""
    return database_service.get_available_exports()


@router.get(
    "/exports/download/{filename}",
    summary="Download an allowlisted database export file",
)
def download_export(filename: str) -> FileResponse:
    """Safely downloads an allowlisted export archive (SQL dump, CSV ZIP, or DDL script)."""
    file_path = database_service.get_export_file_path(filename)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Export file '{filename}' not found or access denied.",
        )

    # Determine media type
    media_type = "application/octet-stream"
    if filename.endswith(".sql"):
        media_type = "application/sql"
    elif filename.endswith(".zip"):
        media_type = "application/zip"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
    )

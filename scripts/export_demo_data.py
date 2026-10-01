"""EVENTHUB — Demo Dataset Exporter

Generates:
1. database/exports/eventhub_demo.sql (Combined DDL + Fictional Data Inserts)
2. database/exports/csv/*.csv (16 individual table CSV exports)
3. database/exports/eventhub_csv_dataset.zip (ZIP archive of all 16 CSVs)

Safe: Contains exclusively fictional demo data.
"""

import os
import sys
import csv
import zipfile
import json
from decimal import Decimal
from datetime import datetime, date, time

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from app.core.config import settings

TABLE_ORDER = [
    "users",
    "organizers",
    "categories",
    "venues",
    "venue_seats",
    "events",
    "ticket_types",
    "bookings",
    "event_seats",
    "booking_items",
    "payments",
    "tickets",
    "reviews",
    "notifications",
    "audit_logs",
    "favorites",
]


def format_sql_value(val) -> str:
    """Format Python value into standard SQL literal."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float, Decimal)):
        return str(val)
    if isinstance(val, (datetime, date, time)):
        return f"'{val.isoformat()}'"
    if isinstance(val, (dict, list)):
        escaped = json.dumps(val).replace("'", "''")
        return f"'{escaped}'::jsonb"
    # String
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"


def export_demo_data():
    engine = create_engine(settings.DATABASE_URL)
    exports_dir = os.path.join(root_dir, "database", "exports")
    csv_dir = os.path.join(exports_dir, "csv")
    os.makedirs(csv_dir, exist_ok=True)

    print("Exporting CSV files...")
    csv_paths = []
    table_data = {}

    with engine.connect() as conn:
        for tbl in TABLE_ORDER:
            res = conn.execute(text(f"SELECT * FROM {tbl} ORDER BY id;"))
            cols = list(res.keys())
            rows = res.fetchall()
            table_data[tbl] = (cols, rows)

            csv_file = os.path.join(csv_dir, f"{tbl}.csv")
            with open(csv_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(cols)
                for r in rows:
                    writer.writerow([
                        json.dumps(val) if isinstance(val, (dict, list)) else val
                        for val in r
                    ])
            csv_paths.append(csv_file)
            print(f"  [OK] {tbl}.csv ({len(rows)} rows)")

    # Create ZIP archive
    zip_path = os.path.join(exports_dir, "eventhub_csv_dataset.zip")
    print(f"\nCompressing CSVs into {zip_path}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for p in csv_paths:
            arcname = os.path.join("csv", os.path.basename(p))
            zipf.write(p, arcname=arcname)
    print("  [OK] eventhub_csv_dataset.zip created successfully.")

    # Generate eventhub_demo.sql
    demo_sql_path = os.path.join(exports_dir, "eventhub_demo.sql")
    schema_sql_path = os.path.join(root_dir, "database", "schema", "eventhub_schema.sql")

    print(f"\nGenerating SQL export at {demo_sql_path}...")
    with open(schema_sql_path, "r", encoding="utf-8") as sf:
        schema_ddl = sf.read()

    with open(demo_sql_path, "w", encoding="utf-8") as out:
        out.write("-- ============================================================================\n")
        out.write("-- EVENTHUB — Complete Demo Database Export (Schema + Fictional Dataset)\n")
        out.write("-- Database: PostgreSQL 18.6+\n")
        out.write(f"-- Generated At: {datetime.now(tz=None).strftime('%Y-%m-%d %H:%M:%S')}\n")
        out.write("-- Note: Contains ONLY fictional demo data for development and demonstration.\n")
        out.write("-- ============================================================================\n\n")
        out.write("BEGIN;\n\n")
        out.write("-- ----------------------------------------------------------------------------\n")
        out.write("-- 1. Schema DDL Definitions\n")
        out.write("-- ----------------------------------------------------------------------------\n")
        out.write(schema_ddl)
        out.write("\n\n")

        out.write("-- ----------------------------------------------------------------------------\n")
        out.write("-- 2. Fictional Demo Data Inserts\n")
        out.write("-- ----------------------------------------------------------------------------\n\n")

        for tbl in TABLE_ORDER:
            cols, rows = table_data[tbl]
            if not rows:
                continue
            col_list_str = ", ".join(cols)
            out.write(f"-- Data for table: {tbl} ({len(rows)} records)\n")
            out.write(f"INSERT INTO {tbl} ({col_list_str}) VALUES\n")
            
            row_strs = []
            for r in rows:
                vals = [format_sql_value(v) for v in r]
                row_strs.append(f"  ({', '.join(vals)})")
            
            out.write(",\n".join(row_strs))
            out.write(";\n\n")

            # Reset sequence to max id
            out.write(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), coalesce(max(id), 1), true) FROM {tbl};\n\n")

        out.write("COMMIT;\n")
    print("  [OK] eventhub_demo.sql created successfully.")


if __name__ == "__main__":
    export_demo_data()

import React, { useState, useEffect } from 'react';
import type { ExportItemData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';
import { ExportCard } from '../../components/database/ExportCard';
import { Feedback } from '../../components/common/Feedback';
import { SQLCodeBlock } from '../../components/database/SQLCodeBlock';

export const DatabaseExportsPage: React.FC = () => {
  const [exportsList, setExportsList] = useState<ExportItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await databaseApi.getExports();
      setExportsList(data);
    } catch (err) {
      console.error('Failed to load export files', err);
    } finally {
      setLoading(false);
    }
  };

  const restoreScript = `# Restore PostgreSQL Dump locally using psql
createdb -U postgres eventhub_local
psql -U postgres -d eventhub_local -f eventhub_demo.sql

# Or inspect the normalized CSV tables using Python / Pandas:
import pandas as pd
import zipfile

with zipfile.ZipFile("eventhub_csv_dataset.zip") as z:
    with z.open("csv/events.csv") as f:
        events_df = pd.read_csv(f)
        print(events_df.head())`;

  if (loading) {
    return <Feedback state="loading" title="Inspecting database export files..." />;
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Reproducibility & Open Data Artifacts
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Database Exports & Data Artifacts ({exportsList.length})
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Verifiable database exports generated directly from the EVENTHUB PostgreSQL 18.6 database. All exports contain relationally consistent, completely fictional demo records suitable for standalone local analysis or evaluation.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 mb-8 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <strong className="block font-semibold mb-0.5">Strict Privacy & Security Guarantee:</strong>
          These export archives contain only synthetic demo records with zero production credentials, private user data, or sensitive tokens. The downloads are strictly allowlisted against directory traversal attempts.
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {exportsList.map((item) => (
          <ExportCard key={item.filename} exportItem={item} />
        ))}
      </div>

      {/* Local Restoration Instructions */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
          How to Restore and Inspect the Exports Locally
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Use standard PostgreSQL command-line tools (<code className="font-mono text-indigo-600 dark:text-indigo-400">psql</code>) or data science environments to inspect the dataset:
        </p>
        <SQLCodeBlock sql={restoreScript} title="Bash / Python: Local Restoration" />
      </div>
    </div>
  );
};

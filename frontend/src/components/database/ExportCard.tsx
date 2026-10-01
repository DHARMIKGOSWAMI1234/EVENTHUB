import React from 'react';
import type { ExportItemData } from '../../types/database';
import { databaseApi } from '../../services/databaseApi';

interface ExportCardProps {
  exportItem: ExportItemData;
}

export const ExportCard: React.FC<ExportCardProps> = ({ exportItem }) => {
  const downloadUrl = databaseApi.getExportDownloadUrl(exportItem.filename);

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {exportItem.filename.endsWith('.sql') ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 11h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {exportItem.format}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
          {exportItem.title}
        </h3>
        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mb-2">
          File: {exportItem.filename} • {exportItem.file_size_formatted}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {exportItem.description}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          Fictional Demo Data
        </span>
        <a
          href={downloadUrl}
          download={exportItem.filename}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
};

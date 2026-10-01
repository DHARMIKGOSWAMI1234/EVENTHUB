import React, { useState } from 'react';

interface SQLCodeBlockProps {
  sql: string;
  title?: string;
  maxHeight?: string;
}

export const SQLCodeBlock: React.FC<SQLCodeBlockProps> = ({
  sql,
  title,
  maxHeight = 'max-h-96',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-md text-sm font-mono my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          <span className="text-xs font-medium text-slate-400 ml-2 tracking-wide">
            {title || 'PostgreSQL SQL'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Copy SQL to clipboard"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy SQL</span>
            </>
          )}
        </button>
      </div>
      <div className={`p-4 overflow-x-auto ${maxHeight} text-xs leading-relaxed`}>
        <pre className="text-indigo-300 font-mono">
          <code>{sql.trim()}</code>
        </pre>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react'

interface HealthResponse {
  status: string
  timestamp?: string
}

export function App() {
  const [apiHealth, setApiHealth] = useState<'checking' | 'online' | 'offline'>('checking')
  const [latency, setLatency] = useState<number | null>(null)

  const checkBackendHealth = async () => {
    setApiHealth('checking')
    const start = performance.now()
    try {
      const response = await fetch('http://localhost:8000/health', {
        headers: { Accept: 'application/json' },
      })
      if (response.ok) {
        const data: HealthResponse = await response.json()
        if (data.status === 'ok') {
          setApiHealth('online')
          setLatency(Math.round(performance.now() - start))
          return
        }
      }
      setApiHealth('offline')
    } catch {
      setApiHealth('offline')
    }
  }

  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <main className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <span className="text-xl">🎫</span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-none">EVENTHUB</span>
            <span className="text-[10px] font-medium tracking-widest text-indigo-400 uppercase">Phase 1 Foundation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            id="backend-health-pill"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs font-medium"
          >
            <span className="relative flex h-2 w-2">
              {apiHealth === 'online' && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              )}
              {apiHealth === 'checking' && (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse"></span>
              )}
              {apiHealth === 'offline' && (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
              )}
            </span>
            <span className="text-slate-300">
              API:{' '}
              {apiHealth === 'online' ? (
                <span className="text-emerald-400 font-semibold">Online {latency !== null ? `(${latency}ms)` : ''}</span>
              ) : apiHealth === 'checking' ? (
                <span className="text-amber-400">Checking...</span>
              ) : (
                <span className="text-slate-400">Standby (:8000)</span>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Card */}
      <section className="max-w-4xl w-full mx-auto my-auto py-12 z-10 flex flex-col items-center text-center">
        {/* Phase Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          DBMS Project Foundation Active
        </div>

        {/* Primary Heading */}
        <h1
          id="eventhub-title"
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-4 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
        >
          EVENTHUB
        </h1>

        {/* Subtitle */}
        <p
          id="eventhub-subtitle"
          className="text-lg sm:text-2xl font-medium text-slate-300 max-w-2xl mb-8 leading-relaxed"
        >
          Event &amp; Ticket Booking Management System
        </p>

        {/* Interactive connection check */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <button
            id="btn-recheck-api"
            onClick={checkBackendHealth}
            type="button"
            className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-medium text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Verify API Connection</span>
          </button>
          <a
            id="btn-view-docs"
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition-all flex items-center gap-2"
          >
            <span>📖</span>
            <span>FastAPI Docs (:8000/docs)</span>
          </a>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold mb-3 border border-blue-500/20">
              PG
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">PostgreSQL 18.6</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Database <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">eventhub</code> on port 5432 with psycopg 3 &amp; SQLAlchemy 2.0 ORM.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold mb-3 border border-emerald-500/20">
              ⚡
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">FastAPI Backend</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Asynchronous Python REST API with health check, Pydantic v2 schemas, and Alembic versioning.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm font-bold mb-3 border border-indigo-500/20">
              ⚛
            </div>
            <h2 className="text-sm font-semibold text-white mb-1">React + TypeScript</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vite-powered single-page application with modern utility styling via Tailwind CSS.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 z-10">
        <div>EVENTHUB Architecture &amp; System Foundation &copy; {new Date().getFullYear()}</div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Phase 1 Completed
          </span>
          <span className="text-slate-700">&bull;</span>
          <span>Awaiting Phase 2: Schema Modeling</span>
        </div>
      </footer>
    </main>
  )
}

export default App

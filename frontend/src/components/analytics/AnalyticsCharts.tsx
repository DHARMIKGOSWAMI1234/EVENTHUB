// frontend/src/components/analytics/AnalyticsCharts.tsx
import React from 'react'
import { formatCurrency } from '../../utils/formatters'

interface BarChartItem {
  label: string
  value: number
  color?: string
  sublabel?: string
}

interface BarChartProps {
  title?: string
  data: BarChartItem[]
  height?: number
  valuePrefix?: string
  isCurrency?: boolean
}

export const SimpleBarChart: React.FC<BarChartProps> = ({
  title,
  data,
  height = 200,
  valuePrefix = '',
  isCurrency = false,
}) => {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-500">
        No chart data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="w-full space-y-3">
      {title && <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>}
      <div
        style={{ height: `${height}px` }}
        className="flex items-end gap-2 pt-6 pb-2 px-2 bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-x-auto"
      >
        {data.map((item, idx) => {
          const percentage = Math.round((item.value / maxValue) * 100)
          return (
            <div key={idx} className="flex-1 min-w-[36px] max-w-[64px] flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
                {isCurrency ? formatCurrency(item.value) : `${valuePrefix}${item.value.toLocaleString()}`}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${Math.max(percentage, 6)}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  item.color || 'bg-gradient-to-t from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400'
                }`}
              />

              {/* Label */}
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-full mt-2 text-center">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose'
  trend?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
}) => {
  const colorStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="text-2xl font-black text-white tracking-tight font-mono truncate">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 text-xs">
            {trend && <span className="font-semibold text-emerald-400">{trend}</span>}
            {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          </div>
        )}
      </div>

      <div className={`p-3 rounded-xl border ${colorStyles[color]} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

interface ProgressRingProps {
  label: string
  percentage: number
  color?: string
  description?: string
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  label,
  percentage,
  color = 'stroke-indigo-500',
  description,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage))
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            className={`${color} transition-all duration-500 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xs font-mono font-bold text-white">
          {Math.round(clamped)}%
        </span>
      </div>
      <div>
        <h5 className="text-sm font-bold text-white">{label}</h5>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

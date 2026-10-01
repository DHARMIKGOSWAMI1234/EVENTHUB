// frontend/src/utils/formatters.ts

/**
 * Format currency in Indian Rupees (INR) or standard currency
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00'
  }
  const numeric = Number(amount)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(numeric)
}

/**
 * Format ISO datetime string to readable local format
 */
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return 'N/A'
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return String(isoString)
  }
}

/**
 * Format date only (e.g. "Thu, 15 Oct 2026")
 */
export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return 'N/A'
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return String(isoString)
  }
}

/**
 * Format time only (e.g. "7:30 PM")
 */
export function formatTime(isoString: string | undefined | null): string {
  if (!isoString) return 'N/A'
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return String(isoString)
  }
}

/**
 * Truncate long text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

/**
 * Clean status label (e.g. "IN_PROGRESS" -> "In Progress")
 */
export function formatStatusLabel(status: string): string {
  if (!status) return ''
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Generate a deterministic avatar color based on name/string
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Return curated background placeholder images for categories
 */
export function getCategoryGradient(categoryName?: string): string {
  const cat = (categoryName || '').toLowerCase()
  if (cat.includes('music') || cat.includes('concert')) {
    return 'from-purple-900/60 via-indigo-900/40 to-slate-900'
  }
  if (cat.includes('tech') || cat.includes('hackathon')) {
    return 'from-blue-900/60 via-cyan-900/40 to-slate-900'
  }
  if (cat.includes('sport') || cat.includes('fitness')) {
    return 'from-emerald-900/60 via-teal-900/40 to-slate-900'
  }
  if (cat.includes('theatre') || cat.includes('drama') || cat.includes('comedy')) {
    return 'from-amber-900/60 via-rose-900/40 to-slate-900'
  }
  return 'from-indigo-900/60 via-slate-900/50 to-slate-950'
}

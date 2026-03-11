const cssVar = (name, fallback) => {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value?.trim() || fallback
}

const DEFAULT_PALETTE = [
  cssVar('--hex-violet-600', '#7C3AED'), // violet
  cssVar('--hex-cyan-500', '#06B6D4'), // cyan
  cssVar('--hex-green-600', '#22C55E'), // green
  cssVar('--hex-amber-500b', '#F59E0B'), // amber
  cssVar('--hex-red-500', '#EF4444'), // red
  cssVar('--hex-blue-500', '#3B82F6'), // blue
  cssVar('--hex-purple-500', '#A855F7'), // purple
  cssVar('--hex-teal-500', '#14B8A6'), // teal
]

export function formatInt(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value))
}

export function toSydneyTime(utcDate) {
  if (!utcDate) return "";

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(utcDate));
}



export function formatPct(value, { digits = 1 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(digits)}%`
}

export function formatScore(value, { digits = 3 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

export function shortId(value, { left = 8 } = {}) {
  if (!value) return '—'
  const text = String(value)
  return text.length <= left ? text : text.slice(0, left)
}

export function objectToSeries(counts = {}, pcts = {}, { countKey = 'count', pctKey = 'pct' } = {}) {
  const keys = Object.keys(counts ?? {})
  const rows = keys.map((key) => ({
    category: key,
    [countKey]: Number(counts[key] ?? 0),
    [pctKey]: Number(pcts?.[key] ?? 0),
  }))

  rows.sort((a, b) => (b[countKey] ?? 0) - (a[countKey] ?? 0))
  return rows
}

export function pairsToRows(pairs, { keyName = 'label', valueName = 'value' } = {}) {
  if (!Array.isArray(pairs)) return []
  return pairs.map(([key, value]) => ({ [keyName]: key, [valueName]: value }))
}

export function pivotHourlyByCategory(hourlyRows, { maxSeries = 6 } = {}) {
  const rows = Array.isArray(hourlyRows) ? hourlyRows : []
  if (rows.length === 0) return { data: [], categories: [] }

  const totalsByCategory = new Map()
  for (const r of rows) {
    const category = String(r.category ?? 'Unknown')
    const messages = Number(r.messages ?? 0)
    totalsByCategory.set(category, (totalsByCategory.get(category) ?? 0) + messages)
  }

  const categoriesSorted = [...totalsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)

  const primary = categoriesSorted.slice(0, Math.max(1, maxSeries))
  const longTail = new Set(categoriesSorted.slice(primary.length))

  const byHour = new Map()
  for (const r of rows) {
    const hour = String(r.hour_bucket_utc ?? '')
    if (!hour) continue

    const categoryRaw = String(r.category ?? 'Unknown')
    const category = longTail.has(categoryRaw) ? 'Other' : categoryRaw
    const messages = Number(r.messages ?? 0)

    if (!byHour.has(hour)) byHour.set(hour, { hour_bucket_utc: hour })
    const obj = byHour.get(hour)
    obj[category] = (obj[category] ?? 0) + messages
  }

  const categories = [...new Set([...primary, longTail.size > 0 ? 'Other' : null].filter(Boolean))]

  const data = [...byHour.values()].sort((a, b) => String(a.hour_bucket_utc).localeCompare(String(b.hour_bucket_utc)))
  return { data, categories }
}

export function paletteForKeys(keys, palette = DEFAULT_PALETTE) {
  const result = {}
  for (let i = 0; i < (keys?.length ?? 0); i += 1) {
    result[keys[i]] = palette[i % palette.length]
  }
  return result
}

export function safeArray(value) {
  return Array.isArray(value) ? value : []
}

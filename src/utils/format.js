export function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(d)
  return `${date}, ${time} WIB`
}

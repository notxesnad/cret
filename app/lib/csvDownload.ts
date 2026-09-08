export type CsvResponse = {
  date?: string
  answers?: Record<string, string | number>
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function csvFilename(prefix: string, label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'export'
  return `${prefix}-${slug}.csv`
}

export function formatCsvDate(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

export function downloadResponsesCsv(
  filename: string,
  columns: { header: string; get: (response: CsvResponse) => string }[],
  responses: CsvResponse[],
) {
  const lines = [
    columns.map(column => csvEscape(column.header)).join(','),
    ...responses.map(response =>
      columns.map(column => csvEscape(column.get(response) || '')).join(',')
    ),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

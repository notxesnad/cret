'use client'

export type SheetColumn<T> = {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'select'
  options?: { value: string; label: string }[]
  get: (row: T) => string
  set?: (row: T, value: string) => T
}

export function CrmSpreadsheet<T extends { id: string }>({
  rows,
  columns,
  onChange,
  onRowOpen,
}: {
  rows: T[]
  columns: SheetColumn<T>[]
  onChange: (row: T) => void
  onRowOpen?: (row: T) => void
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-3 whitespace-nowrap">{col.label}</th>
            ))}
            {onRowOpen ? <th className="px-3 py-3 w-16"></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onRowOpen ? 1 : 0)} className="px-3 py-10 text-center text-slate-500">
                Nothing in this list yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1.5 align-middle">
                    {col.type === 'select' ? (
                      <select
                        value={col.get(row)}
                        onChange={(e) => col.set && onChange(col.set(row, e.target.value))}
                        className="w-full min-w-[120px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        {(col.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : col.set ? (
                      <input
                        type={col.type || 'text'}
                        value={col.get(row)}
                        onChange={(e) => onChange(col.set!(row, e.target.value))}
                        className="w-full min-w-[140px] bg-transparent border border-transparent hover:border-slate-700 focus:border-emerald-500 rounded-lg px-2 py-2 text-white focus:outline-none"
                      />
                    ) : (
                      <span className="block px-2 py-2 text-slate-300">{col.get(row) || '—'}</span>
                    )}
                  </td>
                ))}
                {onRowOpen ? (
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onRowOpen(row)}
                      className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 px-2 py-2"
                    >
                      Open
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function CrmModeBar({
  mode,
  onMode,
  showArchived,
  onShowArchived,
  archivedCount,
}: {
  mode: 'list' | 'sheet'
  onMode: (mode: 'list' | 'sheet') => void
  showArchived: boolean
  onShowArchived: (next: boolean) => void
  archivedCount: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex rounded-full border border-slate-700 p-1 bg-slate-900">
        <button
          type="button"
          onClick={() => onMode('list')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${mode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Cards
        </button>
        <button
          type="button"
          onClick={() => onMode('sheet')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${mode === 'sheet' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
        >
          Spreadsheet
        </button>
      </div>
      <button
        type="button"
        onClick={() => onShowArchived(!showArchived)}
        className={`text-xs font-bold uppercase tracking-wider ${showArchived ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
      >
        {showArchived ? 'Viewing archived' : `Archived${archivedCount ? ` (${archivedCount})` : ''}`}
      </button>
    </div>
  )
}

'use client'

export function ConfirmDeleteDialog({
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Keep it',
  onCancel,
  onConfirm,
}: {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
        <p className="text-base font-bold text-white">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-black py-3 rounded-xl transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

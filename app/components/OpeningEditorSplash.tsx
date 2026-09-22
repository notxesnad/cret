export function OpeningEditorSplash({
  message = 'Opening your report editor…',
}: {
  message?: string
}) {
  return (
    <div className="fixed inset-0 z-[80] min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-black mb-2">Cool Real Estate Tools</h1>
        <p className="text-slate-400">{message}</p>
      </div>
    </div>
  )
}

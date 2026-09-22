export function TemplatePickCard({
  title,
  description,
  questionCount,
  extraPills = [],
  onUse,
  onPreview,
  hoverBorderClass,
  useClass,
}: {
  title: string
  description: string
  questionCount: number
  extraPills?: string[]
  onUse: () => void
  onPreview?: () => void
  hoverBorderClass: string
  useClass: string
}) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 transition ${hoverBorderClass}`}>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">
          {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
        </span>
        {extraPills.map(pill => (
          <span key={pill} className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded">
            {pill}
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-400 mt-3">{description}</p>
      <div className="flex items-end justify-between gap-3 mt-4">
        {onPreview ? (
          <button
            type="button"
            onClick={onPreview}
            className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Preview
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onUse}
          className={`text-xs font-black px-4 py-2 rounded-lg ${useClass}`}
        >
          Use This One
        </button>
      </div>
    </div>
  )
}

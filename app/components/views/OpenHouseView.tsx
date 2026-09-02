export function OpenHouseView({ switchView }: { switchView: (view: string) => void }) {
  return (
    <div id="view-openhouse" className="app-view active space-y-4">
      <div className="text-center mb-6">
        <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase font-openhouse">Open House Tools</span>
        <h1 className="text-2xl font-black mt-1">Host like a pro</h1>
        <p className="text-base text-slate-400 mt-1">Sign-in sheets and anonymous visitor feedback.</p>
      </div>

      <div
        onClick={() => switchView('ohfeedback')}
        className="group relative bg-indigo-100 hover:bg-white text-slate-900 p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-300"
      >
        <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:-rotate-6">🗳️</div>
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">QR signs &amp; anonymous quizzes</span>
        <h2 className="font-openhouse text-2xl md:text-3xl mt-1">Anonymous Feedback</h2>
      </div>

      <div
        onClick={() => switchView('ohsignin')}
        className="group relative bg-indigo-600 hover:bg-indigo-500 text-white p-6 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex flex-col justify-between min-h-[120px] overflow-hidden cursor-pointer"
      >
        <div className="absolute right-6 top-6 text-3xl opacity-20 group-hover:opacity-40 transition transform group-hover:scale-110">🏡</div>
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">iPad Sign-In &amp; Text-Back</span>
        <h2 className="font-openhouse text-2xl md:text-3xl mt-1">Guest Sign-In</h2>
      </div>
    </div>
  )
}

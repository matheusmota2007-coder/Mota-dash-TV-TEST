import React from "react";

export default function AppLayout({
  title,
  subtitle,
  badge,
  children,
  footer,
  onPrevScreen,
  onNextScreen,
  progress,
}) {
  return (
    <div className="min-h-screen bg-mota-dark text-slate-200 overflow-hidden flex flex-col">
      <header className="bg-mota-panel border-b-2 border-blue-500 p-4 flex justify-between items-center shadow-2xl z-10">
        <div className="min-w-0">
          <h1 className="text-white text-2xl font-black tracking-widest uppercase truncate">
            {title}
          </h1>
          <div className="text-xs text-slate-400 mt-1 truncate">{subtitle}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">
              Monitoramento em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!onPrevScreen || !onNextScreen ? null : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevScreen}
                className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/70 text-slate-100 text-sm font-black hover:bg-slate-800 transition-colors"
                aria-label="Voltar"
              >
                ←
              </button>
              <button
                type="button"
                onClick={onNextScreen}
                className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/70 text-slate-100 text-sm font-black hover:bg-slate-800 transition-colors"
                aria-label="Avançar"
              >
                →
              </button>
            </div>
          )}
          {!badge ? null : (
            <div className="bg-blue-600 px-6 py-2 rounded-lg shadow-lg border border-blue-400">
              <span className="text-white font-black text-xl italic uppercase tracking-widest">
                {badge}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="relative grow min-h-0">{children}</main>

      {!footer ? null : (
        <footer className="bg-slate-900 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em] border-t border-slate-800">
          <div className="h-1 w-full bg-slate-800">
            <div
              className="h-full bg-linear-to-r from-emerald-400 via-lime-400 to-cyan-400 transition-[width] duration-100"
              style={{ width: `${Math.max(0, Math.min(1, progress ?? 1)) * 100}%` }}
            />
          </div>
          <div className="p-2">{footer}</div>
        </footer>
      )}
    </div>
  );
}

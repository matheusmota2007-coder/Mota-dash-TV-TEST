import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, Pause, Play } from "lucide-react";

function AutoFitSingleLine({ text, maxPx, minPx = 10, className = "" }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxPx);

  const fitText = useCallback(() => {
    const container = containerRef.current;
    const textNode = textRef.current;
    if (!container || !textNode) return;

    let nextSize = maxPx;
    textNode.style.fontSize = `${nextSize}px`;

    while (nextSize > minPx && textNode.scrollWidth > container.clientWidth) {
      nextSize -= 1;
      textNode.style.fontSize = `${nextSize}px`;
    }
    setFontSize(nextSize);
  }, [maxPx, minPx, text]);

  useLayoutEffect(() => {
    fitText();
  }, [fitText]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => fitText());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitText]);

  return (
    <span ref={containerRef} className={`block w-full overflow-hidden whitespace-nowrap ${className}`}>
      <span ref={textRef} style={{ fontSize: `${fontSize}px`, lineHeight: 1 }} className="block">
        {text}
      </span>
    </span>
  );
}

function parseYmd(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isPastYmd(value) {
  const date = parseYmd(value);
  if (!date) return false;
  const selected = startOfDay(date).getTime();
  const today = startOfDay(new Date()).getTime();
  return selected < today;
}

function formatYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
  return (
    a instanceof Date &&
    b instanceof Date &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthDays(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = start.getDay();
  const gridStart = new Date(start.getFullYear(), start.getMonth(), 1 - offset);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    days.push(day);
  }
  return days;
}

function SummaryCalendar({
  selectedDateValue,
  onChange,
  onClose,
  isMobileView = false,
  mobileTopPx = 96,
}) {
  const today = startOfDay(new Date());
  const selectedDate = parseYmd(selectedDateValue);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = selectedDate || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    const base = parseYmd(selectedDateValue) || today;
    setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [selectedDateValue]);

  const days = buildMonthDays(visibleMonth);

  const containerClassName = isMobileView
    ? "fixed left-1/2 z-[60] w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 rounded-xl border border-slate-600 bg-[#0f172a] shadow-2xl p-3 overflow-auto"
    : "absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-600 bg-[#0f172a] shadow-2xl p-3";
  const mobileStyle = isMobileView
    ? { top: `${mobileTopPx}px`, maxHeight: `calc(100vh - ${mobileTopPx + 8}px)` }
    : undefined;

  return (
    <div className={containerClassName} style={mobileStyle}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
          className="h-7 w-7 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700/60"
          aria-label="Mês anterior"
        >
          ←
        </button>
        <div className="text-sm font-bold text-white capitalize">
          {visibleMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          onClick={() =>
            setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
          className="h-7 w-7 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700/60"
          aria-label="Próximo mês"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] font-bold text-slate-400 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((label) => (
          <div key={`weekday-${label}`}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isFuture = startOfDay(day).getTime() > today.getTime();
          return (
            <button
              key={formatYmd(day)}
              type="button"
              disabled={isFuture}
              onClick={() => {
                onChange?.(formatYmd(day));
                onClose?.();
              }}
              className={`h-8 rounded-md text-xs font-semibold transition-colors ${isFuture
                ? "text-slate-600 border border-transparent cursor-not-allowed"
                : isSelected
                  ? "bg-blue-600 text-white"
                  : inCurrentMonth
                    ? "text-slate-200 hover:bg-slate-700/70"
                    : "text-slate-500 hover:bg-slate-800/50"
                } ${isToday && !isSelected && !isFuture ? "border border-blue-400/80" : "border border-transparent"}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            onChange?.(formatYmd(today));
            onClose?.();
          }}
          className="px-2 py-1 text-xs rounded-md border border-blue-500 text-blue-300 hover:bg-blue-500/20"
        >
          Hoje
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({
  title,
  subtitle,
  badge,
  onGoSummaryScreen,
  children,
  footer,
  onPrevScreen,
  onNextScreen,
  onTogglePresentationMode,
  progress,
  showScreenTimer = true,
  isSummaryScreen = false,
  isMobileView = false,
  isPresentationMode = false,
  showSummaryDatePicker = false,
  summaryDateValue = "",
  onSummaryDateChange,
}) {
  const showMobileSummarySubtitle = !(isMobileView && isSummaryScreen);
  const hideSummaryBadgeOnMobile = isMobileView && isSummaryScreen;
  const dateControlRef = useRef(null);
  const canOpenSummaryDatePicker = showSummaryDatePicker && typeof onSummaryDateChange === "function";
  const [isSummaryCalendarOpen, setIsSummaryCalendarOpen] = useState(false);
  const [mobileCalendarTopPx, setMobileCalendarTopPx] = useState(96);
  const isViewingPastDate = isSummaryScreen && isPastYmd(summaryDateValue);
  const statusText = isViewingPastDate ? "Visualizando data anterior" : "Monitoramento em tempo real";
  const subtitleClassName = isSummaryScreen
    ? "text-xs text-slate-400 truncate leading-none"
    : "text-xs text-slate-400 truncate";
  const statusRowClassName = isSummaryScreen
    ? `flex items-end gap-2 ${isMobileView ? "mt-0.5" : "-mt-px"}`
    : "flex items-end gap-2 mt-1";

  const toggleSummaryDatePicker = useCallback((event) => {
    if (!canOpenSummaryDatePicker) return;
    if (isMobileView) {
      const rect = event?.currentTarget?.getBoundingClientRect?.();
      if (rect) {
        setMobileCalendarTopPx(Math.max(56, Math.round(rect.bottom + 8)));
      }
    }
    setIsSummaryCalendarOpen((prev) => !prev);
  }, [canOpenSummaryDatePicker, isMobileView]);

  useEffect(() => {
    if (!isSummaryCalendarOpen) return undefined;
    const onMouseDown = (event) => {
      if (!dateControlRef.current?.contains(event.target)) {
        setIsSummaryCalendarOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSummaryCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isSummaryCalendarOpen]);

  useEffect(() => {
    if (!canOpenSummaryDatePicker && isSummaryCalendarOpen) {
      setIsSummaryCalendarOpen(false);
    }
  }, [canOpenSummaryDatePicker, isSummaryCalendarOpen]);

  return (
    <div className="h-screen min-h-screen bg-mota-dark text-slate-200 overflow-hidden flex flex-col">
      <header className="sticky top-0 bg-mota-panel border-b-2 border-blue-500 p-3 lg:p-4 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center shadow-2xl z-30">
        <div className="min-w-0">
          <h1 className="mota-title-mobile-clamp text-white text-[clamp(0.8rem,3.4vw,1.08rem)] lg:text-2xl font-black tracking-normal lg:tracking-widest uppercase lg:truncate">
            {title}
          </h1>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {!showMobileSummarySubtitle ? null : (
                <div className={subtitleClassName}>{subtitle}</div>
              )}
              <div className={statusRowClassName}>
                <span className="relative flex h-3 w-3">
                  {!isViewingPastDate ? (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  ) : null}
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isViewingPastDate ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                </span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter leading-none">
                  {statusText}
                </p>
                {!canOpenSummaryDatePicker || isMobileView ? null : (
                  <div className="relative ml-0.5 self-end translate-y-px" ref={dateControlRef}>
                    <button
                      type="button"
                      onClick={toggleSummaryDatePicker}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white text-white bg-transparent hover:bg-white/10 transition-colors align-middle"
                      aria-label="Selecionar data do gerencial"
                      title="Selecionar data do gerencial"
                    >
                      <CalendarDays size={13} strokeWidth={2.3} />
                    </button>
                    {!isSummaryCalendarOpen ? null : (
                      <SummaryCalendar
                        selectedDateValue={summaryDateValue}
                        onChange={onSummaryDateChange}
                        onClose={() => setIsSummaryCalendarOpen(false)}
                        isMobileView={isMobileView}
                        mobileTopPx={mobileCalendarTopPx}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden lg:flex shrink-0 lg:mr-[22%] scale-[0.85] items-center gap-2">
              {!onGoSummaryScreen || isSummaryScreen ? null : (
                <button
                  type="button"
                  onClick={onGoSummaryScreen}
                  className="inline-flex items-center justify-center bg-blue-600 text-white font-black italic uppercase tracking-wide px-4 py-1.5 rounded-lg border border-blue-400 shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-500 hover:shadow-[0_10px_28px_rgba(59,130,246,0.4)] active:translate-y-px transition-all duration-150"
                >
                  Gerencial
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 w-full lg:w-auto">
          {!onPrevScreen || !onNextScreen ? null : (
            <div className="flex items-center gap-2 w-full lg:w-auto">
              {!onTogglePresentationMode ? null : (
                <button
                  type="button"
                  onClick={onTogglePresentationMode}
                  className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#22c55e] text-[#22c55e] bg-transparent hover:bg-[#22c55e]/10 transition-colors"
                  aria-label={isPresentationMode ? "Pausar modo apresentação" : "Iniciar modo apresentação"}
                  title={isPresentationMode ? "Pausar modo apresentação" : "Iniciar modo apresentação"}
                >
                  {isPresentationMode ? <Pause size={14} strokeWidth={2.4} /> : <Play size={14} strokeWidth={2.4} />}
                </button>
              )}
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
              {!canOpenSummaryDatePicker || !isMobileView ? null : (
                <div className="relative" ref={dateControlRef}>
                  <button
                    type="button"
                    onClick={toggleSummaryDatePicker}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white text-white bg-transparent hover:bg-white/10 transition-colors"
                    aria-label="Selecionar data do gerencial"
                    title="Selecionar data do gerencial"
                  >
                    <CalendarDays size={15} strokeWidth={2.3} />
                  </button>
                  {!isSummaryCalendarOpen ? null : (
                    <SummaryCalendar
                      selectedDateValue={summaryDateValue}
                      onChange={onSummaryDateChange}
                      onClose={() => setIsSummaryCalendarOpen(false)}
                      isMobileView={isMobileView}
                      mobileTopPx={mobileCalendarTopPx}
                    />
                  )}
                </div>
              )}
              {!onGoSummaryScreen ? null : isSummaryScreen ? (
                <div className="ml-auto inline-flex lg:hidden items-center justify-center bg-blue-600 text-white font-black italic uppercase tracking-wide px-2 py-1.5 rounded-lg border border-blue-400 shadow-[0_8px_24px_rgba(37,99,235,0.35)] text-xs">
                  Gerencial
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onGoSummaryScreen}
                  className="inline-flex lg:hidden items-center justify-center bg-blue-600 text-white font-black italic uppercase tracking-wide px-2 py-1.5 rounded-lg border border-blue-400 shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-500 hover:shadow-[0_10px_28px_rgba(59,130,246,0.4)] active:translate-y-px transition-all duration-150 text-xs"
                >
                  Gerencial
                </button>
              )}
            </div>
          )}
          {!badge || hideSummaryBadgeOnMobile ? null : (
            <div className="bg-blue-600 px-3 lg:px-4 py-2 rounded-lg shadow-lg border border-blue-400 w-44 lg:w-52 text-center">
              <AutoFitSingleLine
                text={badge}
                maxPx={18}
                minPx={9}
                className="text-white font-black italic uppercase tracking-wide lg:tracking-widest"
              />
            </div>
          )}
        </div>
      </header>

      <main className="relative grow min-h-0">{children}</main>

      {!footer ? null : (
        <footer className="bg-slate-900 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em] border-t border-slate-800">
          {!showScreenTimer ? null : (
            <div className="h-1 w-full bg-slate-800">
              <div
                className="h-full bg-linear-to-r from-emerald-400 via-lime-400 to-cyan-400 transition-[width] duration-100"
                style={{ width: `${Math.max(0, Math.min(1, progress ?? 1)) * 100}%` }}
              />
            </div>
          )}
          <div className="p-2">{footer}</div>
        </footer>
      )}
    </div>
  );
}

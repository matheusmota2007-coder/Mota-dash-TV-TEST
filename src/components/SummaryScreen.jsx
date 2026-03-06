import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
} from "recharts";
import { formatMinutesAsHMS } from "../lib/timeFormat";

function formatPieces(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
}

function formatHours(value) {
  const n = Number(value) || 0;
  return `${Math.round(n * 10) / 10}h`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${Math.round(value * 10) / 10}%`;
}

function splitLastDigit(formattedValue) {
  const match = /^(.*?)(\d)$/.exec(String(formattedValue));
  if (!match) {
    return { prefix: String(formattedValue), digit: null };
  }
  return { prefix: match[1], digit: match[2] };
}

function AnimatedLastDigitPieces({ value }) {
  const pieces = Math.max(0, Math.round(Number(value) || 0));
  const [stableParts, setStableParts] = useState(() => splitLastDigit(formatPieces(pieces)));
  const stablePartsRef = useRef(stableParts);
  const prevPiecesRef = useRef(pieces);
  const frameRef = useRef(null);
  const timeoutRef = useRef(null);
  const [transition, setTransition] = useState(null);

  useEffect(() => {
    stablePartsRef.current = stableParts;
  }, [stableParts]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const nextParts = splitLastDigit(formatPieces(pieces));
    const previousPieces = prevPiecesRef.current;
    const previousParts = stablePartsRef.current;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (pieces > previousPieces && previousParts.digit !== null && nextParts.digit !== null) {
      setTransition({
        prefix: nextParts.prefix,
        fromDigit: previousParts.digit,
        toDigit: nextParts.digit,
        phase: "prepare",
      });
      frameRef.current = requestAnimationFrame(() => {
        setTransition((current) => (current ? { ...current, phase: "run" } : null));
      });
      timeoutRef.current = setTimeout(() => {
        setTransition(null);
        setStableParts(nextParts);
      }, 340);
    } else {
      setTransition(null);
      setStableParts(nextParts);
    }

    prevPiecesRef.current = pieces;
  }, [pieces]);

  if (!transition) {
    return (
      <span className="inline-flex items-baseline tabular-nums">
        <span>{stableParts.prefix}</span>
        {stableParts.digit === null ? null : <span>{stableParts.digit}</span>}
      </span>
    );
  }

  const fromClass =
    transition.phase === "run" ? "-translate-y-[1.15em] opacity-0" : "translate-y-0 opacity-100";
  const toClass =
    transition.phase === "run" ? "translate-y-0 opacity-100" : "translate-y-[1.15em] opacity-0";

  return (
    <span className="inline-flex items-baseline tabular-nums">
      <span>{transition.prefix}</span>
      <span className="relative inline-block h-[1.2em] w-[0.75em] overflow-hidden align-[-0.12em]">
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${fromClass}`}
        >
          {transition.fromDigit}
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${toClass}`}
        >
          {transition.toDigit}
        </span>
      </span>
    </span>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-mota-panel rounded-xl border border-slate-700/50 shadow-2xl p-4 flex flex-col min-h-55 lg:min-h-0 ${className}`}
    >
      <div className="text-slate-100 font-bold text-center mb-2">{title}</div>
      <div className="grow min-h-0">{children}</div>
    </div>
  );
}

export default function SummaryScreen({ summary, isMobileView = false, onSelectSector }) {
  const pieces = Number(summary?.totals?.pieces) || 0;

  const hoursData = useMemo(() => {
    const running = summary?.totals?.runningHours || 0;
    const stopped = summary?.totals?.stoppedHours || 0;
    return [
      { name: "Funcionando", value: Math.max(0, running), fill: "#22c55e" },
      { name: "Parado", value: Math.max(0, stopped), fill: "#ef4444" },
    ];
  }, [summary]);
  const totalHours = useMemo(() => {
    const running = summary?.totals?.runningHours || 0;
    const stopped = summary?.totals?.stoppedHours || 0;
    return Math.max(0, running) + Math.max(0, stopped);
  }, [summary]);

  const perSectorBars = useMemo(() => {
    const rows = summary?.perSector || [];
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      pieces: s.pieces || 0,
      utilization: Number.isFinite(s.utilizationPercent) ? s.utilizationPercent : 0,
      tc: Number.isFinite(s.tcMedioMinPerPiece) ? s.tcMedioMinPerPiece : 0,
    }));
  }, [summary]);

  const utilizationPercent = summary?.utilizationPercent;
  const targetPercent = summary?.targetUtilizationPercent;
  const maxReferencePercent = Number.isFinite(summary?.targetUtilizationPercent)
    ? summary.targetUtilizationPercent
    : 85;
  const minReferencePercent = Number.isFinite(summary?.minUtilizationPercent)
    ? summary.minUtilizationPercent
    : 60;

  return (
    <div className="p-3 lg:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 lg:auto-rows-[1fr] gap-3 bg-mota-dark h-full min-h-0">
      <Card title="Visão Geral (Hoje)" className="sm:col-span-2 lg:col-span-1 min-h-45">
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="text-sky-400 text-4xl font-black">
            <AnimatedLastDigitPieces value={pieces} /> peças
          </div>
          <div className="text-slate-300 mt-2">{formatHours(summary?.totals?.runningHours)} funcionando</div>
          <div className="text-slate-400">{formatHours(summary?.totals?.stoppedHours)} paradas</div>
        </div>
      </Card>

      <Card title="Distribuição de horas" className="min-h-65">
        <div className="w-full h-full min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hoursData}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="82%"
                stroke="none"
                isAnimationActive={false}
                label={(entry) => `${Math.round(entry.value)}h`}
              >
                {hoursData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [formatHours(v), n]}
                contentStyle={{ backgroundColor: "#0b1220", border: "1px solid #334155" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-white text-2xl font-black">{formatHours(totalHours)}</div>
              <div className="text-slate-400 text-xs uppercase tracking-wide">Total</div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Utilização atual (geral)" className="min-h-65">
        <div className="w-full h-full min-h-0 flex items-center justify-center">
          <SemiGauge valuePercent={utilizationPercent} targetPercent={targetPercent} />
        </div>
      </Card>

      <Card title="Peças por setor" className={isMobileView ? "min-h-70 sm:col-span-2 lg:col-span-1" : ""}>
        <MiniBar
          data={perSectorBars}
          dataKey="pieces"
          color="#3b82f6"
          formatter={(v) => formatPieces(v)}
          isMobileView={isMobileView}
          onRowClick={onSelectSector}
        />
      </Card>

      <Card
        title="Utilização média por setor"
        className={isMobileView ? "min-h-70 sm:col-span-2 lg:col-span-1" : ""}
      >
        <MiniBar
          data={perSectorBars}
          dataKey="utilization"
          color="rgba(74, 222, 128, 0.85)"
          formatter={(v) => formatPercent(v)}
          domain={[0, 100]}
          referenceLines={[
            {
              value: minReferencePercent,
              color: "rgba(248, 113, 113, 0.72)",
              label: `Mínimo ${formatPercent(minReferencePercent)}`,
            },
            {
              value: maxReferencePercent,
              color: "rgba(74, 222, 128, 0.72)",
              label: `Máximo ${formatPercent(maxReferencePercent)}`,
            },
          ]}
          isMobileView={isMobileView}
          onRowClick={onSelectSector}
        />
      </Card>

      <Card title="TC médio por setor (HH:MM:SS/peça)" className={isMobileView ? "min-h-70 sm:col-span-2 lg:col-span-1" : ""}>
        <MiniBar
          data={perSectorBars}
          dataKey="tc"
          color="#f59e0b"
          formatter={formatMinutesAsHMS}
          isMobileView={isMobileView}
          onRowClick={onSelectSector}
        />
      </Card>
    </div>
  );
}

function MiniBar({
  data,
  dataKey,
  color,
  formatter,
  domain,
  referenceLines = [],
  isMobileView = false,
  onRowClick,
}) {
  const rows = useMemo(() => {
    const rawRows = Array.isArray(data) ? data : [];
    return [...rawRows]
      .map((row) => ({
        ...row,
        name: String(row?.name ?? "")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      }))
      .sort((a, b) => {
        const aValue = Number(a?.[dataKey]) || 0;
        const bValue = Number(b?.[dataKey]) || 0;
        return bValue - aValue;
      });
  }, [data, dataKey]);

  const itemCount = rows.length;
  const rowHeight = isMobileView
    ? itemCount <= 6
      ? 18
      : itemCount <= 10
        ? 20
        : 24
    : itemCount <= 6
      ? 20
      : itemCount <= 10
        ? 24
        : 28;
  const minChartHeight = isMobileView ? 180 : 200;
  const chartHeight = Math.max(minChartHeight, rows.length * rowHeight + 36);
  const barCategoryGap = isMobileView
    ? itemCount <= 6
      ? "8%"
      : "18%"
    : itemCount <= 6
      ? "10%"
      : "22%";

  const longestNameLength = useMemo(
    () => rows.reduce((max, row) => Math.max(max, String(row?.name || "").length), 0),
    [rows]
  );
  const yAxisWidth = isMobileView
    ? Math.min(130, Math.max(90, longestNameLength * 5 + 20))
    : Math.min(180, Math.max(120, longestNameLength * 6 + 20));

  const longestValueLength = useMemo(
    () =>
      rows.reduce((max, row) => {
        const value = Number(row?.[dataKey]) || 0;
        const label = formatter ? String(formatter(value)) : String(value);
        return Math.max(max, label.length);
      }, 0),
    [dataKey, formatter, rows]
  );
  const rightMargin = Math.min(120, Math.max(48, longestValueLength * 7 + 12));

  const onSectorClick = useCallback(
    (sectorId) => {
      if (!sectorId || typeof onRowClick !== "function") return;
      onRowClick(sectorId);
    },
    [onRowClick]
  );

  const rowIdByName = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      if (!row?.name) continue;
      map.set(row.name, row.id);
    }
    return map;
  }, [rows]);

  const renderYAxisTick = useCallback(
    ({ x, y, payload }) => {
      const name = payload?.value;
      const sectorId = rowIdByName.get(name);
      const safeX = Number.isFinite(x) ? x : 0;
      const safeY = Number.isFinite(y) ? y : 0;

      return (
        <g className={sectorId ? "cursor-pointer" : ""} onClick={() => onSectorClick(sectorId)}>
          <text
            x={safeX}
            y={safeY}
            dy={4}
            fill="#cbd5e1"
            fontSize={isMobileView ? 10 : 12}
            textAnchor="end"
          >
            {name}
          </text>
        </g>
      );
    },
    [isMobileView, onSectorClick, rowIdByName]
  );

  const renderValueLabel = ({ x, y, width, height, value }) => {
    const label = formatter ? formatter(value) : value;
    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;
    const safeWidth = Number.isFinite(width) ? width : 0;
    const safeHeight = Number.isFinite(height) ? height : 0;
    return (
      <text
        x={safeX + safeWidth + 8}
        y={safeY + safeHeight / 2}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={700}
        textAnchor="start"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {label}
      </text>
    );
  };

  const handleChartClick = useCallback(
    (state) => {
      const sectorId =
        state?.activePayload?.[0]?.payload?.id ??
        (state?.activeLabel ? rowIdByName.get(state.activeLabel) : undefined);
      onSectorClick(sectorId);
    },
    [onSectorClick, rowIdByName]
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="min-h-0 grow overflow-y-auto pr-1">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            className={typeof onRowClick === "function" ? "mini-bar-chart mini-bar-chart--clickable" : "mini-bar-chart"}
            data={rows}
            layout="vertical"
            barSize={isMobileView ? 12 : 14}
            barCategoryGap={barCategoryGap}
            margin={{ left: isMobileView ? 8 : 12, right: rightMargin, top: 6, bottom: 6 }}
            onClick={handleChartClick}
          >
            <BackgroundReferenceLines
              referenceLines={referenceLines}
              domain={domain}
              fallbackMax={Math.max(
                1,
                ...rows.map((row) => Number(row?.[dataKey]) || 0),
                ...referenceLines.map((line) => Number(line?.value) || 0)
              )}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={10}
              domain={domain}
              tickFormatter={formatter}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#cbd5e1"
              fontSize={isMobileView ? 10 : 12}
              width={yAxisWidth}
              tick={renderYAxisTick}
            />
            <Tooltip
              formatter={(v) => [formatter(v), dataKey]}
              contentStyle={{ backgroundColor: "#0b1220", border: "1px solid #334155" }}
              wrapperStyle={{ pointerEvents: "none" }}
              cursor={{ fill: "rgba(148, 163, 184, 0.22)", stroke: "none" }}
            />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[6, 6, 6, 6]}
              isAnimationActive={false}
              activeBar={false}
            >
              {rows.map((row) => (
                <Cell key={`cell-${row.id || row.name}`} />
              ))}
              <LabelList content={renderValueLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!referenceLines.length ? null : (
        <div className="mt-1 flex flex-wrap items-center justify-end gap-3 text-[11px]">
          {referenceLines.map((line) => (
            <div key={`legend-${line.label}-${line.value}`} className="inline-flex items-center gap-1.5 text-slate-300">
              <span
                className="inline-block w-5 border-t-2"
                style={{ borderTopColor: line.color, borderTopStyle: "dashed" }}
              />
              <span style={{ color: line.color }}>{line.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackgroundReferenceLines({ referenceLines, domain, fallbackMax }) {
  const plotArea = usePlotArea();

  if (!plotArea || !referenceLines.length) return null;

  const minDomain = Array.isArray(domain) && Number.isFinite(domain[0]) ? Number(domain[0]) : 0;
  const maxDomain = Array.isArray(domain) && Number.isFinite(domain[1]) ? Number(domain[1]) : fallbackMax;
  const span = maxDomain - minDomain;

  const toX = (rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return null;

    if (!(span > 0)) return null;
    const ratio = (value - minDomain) / span;
    const scaled = plotArea.x + ratio * plotArea.width;
    return Number.isFinite(scaled) ? scaled : null;
  };

  return (
    <g aria-hidden="true">
      {referenceLines.map((line) => {
        const x = toX(line.value);
        if (!Number.isFinite(x)) return null;
        const clampedX = Math.max(plotArea.x, Math.min(plotArea.x + plotArea.width, x));
        return (
          <line
            key={`bg-line-${line.label}-${line.value}`}
            x1={clampedX}
            y1={plotArea.y}
            x2={clampedX}
            y2={plotArea.y + plotArea.height}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray="8 6"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function SemiGauge({ valuePercent, targetPercent }) {
  const value = Number.isFinite(valuePercent) ? Math.max(0, Math.min(100, valuePercent)) : 0;
  const rest = Math.max(0, 100 - value);
  const data = [
    { name: "value", v: value, fill: "#ef4444" },
    { name: "rest", v: rest, fill: "#334155" },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="v"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="88%"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 top-[58%] text-center">
          <div className="text-white text-3xl font-black">{formatPercent(valuePercent)}</div>
          <div className="text-slate-400 text-sm">Meta {formatPercent(targetPercent)}</div>
        </div>
      </div>
    </div>
  );
}

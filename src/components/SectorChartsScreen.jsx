import React, { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMinutesCompact } from "../lib/timeFormat";

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-mota-panel rounded-xl border border-slate-700/50 shadow-2xl p-4 flex flex-col min-h-65 lg:min-h-0 ${className}`}
    >
      <div className="text-slate-300 text-sm font-black uppercase tracking-wide text-center mb-3">
        {title}
      </div>
      <div className="grow min-h-0">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#0b1220",
  border: "1px solid #334155",
  borderRadius: 8,
};

function formatRoundedPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${Math.round(value)}%`;
}

function formatPiecesValue(value) {
  if (!Number.isFinite(value)) return "-";
  return String(Math.round(value));
}

function formatHoursValue(value) {
  if (!Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}h`;
}

function shouldRenderValueLabel(value) {
  return Number.isFinite(value) && Math.abs(value) > 0;
}

function renderAngledLineLabel(formatter) {
  return ({ x, y, value }) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !shouldRenderValueLabel(value)) return null;
    const text = formatter(value);
    return (
      <text
        x={x}
        y={y - 9}
        fill="#cbd5e1"
        fontSize={9}
        fontWeight={600}
        textAnchor="middle"
        transform={`rotate(-24 ${x} ${y - 9})`}
      >
        {text}
      </text>
    );
  };
}

function renderAngledBarLabel(formatter) {
  return ({ x, y, width, value }) => {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !shouldRenderValueLabel(value)
    ) {
      return null;
    }
    const textX = x + width / 2;
    const textY = y - 7;
    const text = formatter(value);
    return (
      <text
        x={textX}
        y={textY}
        fill="#cbd5e1"
        fontSize={9}
        fontWeight={600}
        textAnchor="middle"
        transform={`rotate(-24 ${textX} ${textY})`}
      >
        {text}
      </text>
    );
  };
}

function SectorChartsScreen({ series, isMobileView = false }) {
  const data = useMemo(() => {
    if (!Array.isArray(series)) return [];
    const maxPoints = isMobileView ? 24 : 40;
    return series.length > maxPoints ? series.slice(0, maxPoints) : series;
  }, [isMobileView, series]);

  const xAxisInterval = 1;

  const shouldShowLabels = true;

  const utilizationLabelRenderer = useMemo(
    () => renderAngledLineLabel(formatRoundedPercent),
    []
  );
  const piecesLabelRenderer = useMemo(
    () => renderAngledBarLabel(formatPiecesValue),
    []
  );
  const hoursLabelRenderer = useMemo(
    () => renderAngledBarLabel(formatHoursValue),
    []
  );
  const tcLabelRenderer = useMemo(
    () => renderAngledLineLabel(formatMinutesCompact),
    []
  );

  const xAxisProps = {
    dataKey: "label",
    stroke: "#64748b",
    fontSize: 10,
    interval: xAxisInterval,
    tick: { angle: isMobileView ? -40 : -30, textAnchor: "end" },
    height: isMobileView ? 40 : 32,
    minTickGap: isMobileView ? 8 : 12,
  };

  return (
    <div className="p-3 lg:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:grid-rows-2 lg:auto-rows-[1fr] gap-3 lg:gap-4 bg-mota-dark h-full min-h-0">
      <Card title="Utilização de Máquina (%)" className={isMobileView ? "sm:col-span-2" : ""}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#64748b" fontSize={10} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="utilizationPercent"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#0a0e19" }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            >
              {!shouldShowLabels ? null : <LabelList content={utilizationLabelRenderer} />}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Peças Fabricadas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="pieces" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {!shouldShowLabels ? null : <LabelList content={piecesLabelRenderer} />}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Horas Funcionando / Parado">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#64748b" fontSize={10} unit="h" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar
              dataKey="runningHours"
              stackId="a"
              fill="#22c55e"
              name="Funcionando"
              isAnimationActive={false}
            >
              {!shouldShowLabels ? null : <LabelList content={hoursLabelRenderer} />}
            </Bar>
            <Bar
              dataKey="stoppedHours"
              stackId="a"
              fill="#ef4444"
              name="Parado"
              isAnimationActive={false}
            >
              {!shouldShowLabels ? null : <LabelList content={hoursLabelRenderer} />}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="TC Médio (HH:MM:SS/peça)" className={isMobileView ? "sm:col-span-2" : ""}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#64748b" fontSize={10} tickFormatter={formatMinutesCompact} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [formatMinutesCompact(value), name]}
            />
            <Line
              type="monotone"
              dataKey="tcMedioMinPerPiece"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#0a0e19" }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            >
              {!shouldShowLabels ? null : <LabelList content={tcLabelRenderer} />}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export default memo(SectorChartsScreen);

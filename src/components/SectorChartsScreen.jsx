import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-mota-panel rounded-xl border border-slate-700/50 shadow-2xl p-4 flex flex-col min-h-[260px] lg:min-h-0 ${className}`}
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

export default function SectorChartsScreen({ series, isMobileView = false }) {
  const data = Array.isArray(series) ? series : [];
  const xAxisInterval = isMobileView ? 2 : 1;

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
              isAnimationActive
            />
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
            <Bar dataKey="pieces" fill="#22c55e" radius={[6, 6, 0, 0]} />
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
            <Bar dataKey="runningHours" stackId="a" fill="#22c55e" name="Funcionando" />
            <Bar dataKey="stoppedHours" stackId="a" fill="#ef4444" name="Parado" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="TC Médio (min/peça)" className={isMobileView ? "sm:col-span-2" : ""}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#64748b" fontSize={10} unit=" min" />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="tcMedioMinPerPiece"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#0a0e19" }}
              activeDot={{ r: 6 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

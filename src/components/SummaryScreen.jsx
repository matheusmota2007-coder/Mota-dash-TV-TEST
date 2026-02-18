import React, { useMemo } from "react";
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
} from "recharts";

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

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-mota-panel rounded-xl border border-slate-700/50 shadow-2xl p-4 flex flex-col min-h-[220px] lg:min-h-0 ${className}`}
    >
      <div className="text-slate-100 font-bold text-center mb-2">{title}</div>
      <div className="grow min-h-0">{children}</div>
    </div>
  );
}

export default function SummaryScreen({ summary, isMobileView = false }) {
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
      name: s.name,
      pieces: s.pieces || 0,
      utilization: Number.isFinite(s.utilizationPercent) ? s.utilizationPercent : 0,
      tc: Number.isFinite(s.tcMedioMinPerPiece) ? s.tcMedioMinPerPiece : 0,
    }));
  }, [summary]);

  const utilizationPercent = summary?.utilizationPercent;
  const targetPercent = summary?.targetUtilizationPercent;

  return (
    <div className="p-3 lg:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 lg:auto-rows-[1fr] gap-3 bg-mota-dark h-full min-h-0">
      <Card title="Visão Geral (Hoje)" className="sm:col-span-2 lg:col-span-1 min-h-[180px]">
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="text-sky-400 text-4xl font-black">
            {formatPieces(summary?.totals?.pieces)} peças
          </div>
          <div className="text-slate-300 mt-2">{formatHours(summary?.totals?.runningHours)} funcionando</div>
          <div className="text-slate-400">{formatHours(summary?.totals?.stoppedHours)} paradas</div>
        </div>
      </Card>

      <Card title="Distribuição de horas" className="min-h-[260px]">
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

      <Card title="Utilização atual (geral)" className="min-h-[260px]">
        <div className="w-full h-full min-h-0 flex items-center justify-center">
          <SemiGauge valuePercent={utilizationPercent} targetPercent={targetPercent} />
        </div>
      </Card>

      <Card title="Peças por setor" className={isMobileView ? "min-h-[280px] sm:col-span-2 lg:col-span-1" : ""}>
        <MiniBar
          data={perSectorBars}
          dataKey="pieces"
          color="#3b82f6"
          formatter={(v) => formatPieces(v)}
          isMobileView={isMobileView}
        />
      </Card>

      <Card
        title="Utilização média por setor"
        className={isMobileView ? "min-h-[280px] sm:col-span-2 lg:col-span-1" : ""}
      >
        <MiniBar
          data={perSectorBars}
          dataKey="utilization"
          color="#22c55e"
          formatter={(v) => formatPercent(v)}
          domain={[0, 100]}
          isMobileView={isMobileView}
        />
      </Card>

      <Card title="TC médio por setor (min/peça)" className={isMobileView ? "min-h-[280px] sm:col-span-2 lg:col-span-1" : ""}>
        <MiniBar
          data={perSectorBars}
          dataKey="tc"
          color="#f59e0b"
          formatter={(v) => (Number.isFinite(v) ? `${Math.round(v * 10) / 10}` : "-")}
          isMobileView={isMobileView}
        />
      </Card>
    </div>
  );
}

function MiniBar({ data, dataKey, color, formatter, domain, isMobileView = false }) {
  const rows = Array.isArray(data) ? data : [];
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
      >
        {label}
      </text>
    );
  };
  return (
    <div className="w-full h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: isMobileView ? 8 : 28, right: 16, top: 6, bottom: 6 }}
        >
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
            fontSize={isMobileView ? 10 : 11}
            width={isMobileView ? 52 : 70}
          />
          <Tooltip
            formatter={(v) => [formatter(v), dataKey]}
            contentStyle={{ backgroundColor: "#0b1220", border: "1px solid #334155" }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 6, 6]} isAnimationActive={false}>
            <LabelList content={renderValueLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
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

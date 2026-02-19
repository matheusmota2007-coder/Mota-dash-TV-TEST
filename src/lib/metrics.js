import { pickTodayOrLatest } from "./parseDisplayTable";

function round1(value) {
  return Math.round(value * 10) / 10;
}

export function computeSectorSnapshot(series, now = new Date()) {
  const row = pickTodayOrLatest(series, now);
  if (!row) {
    return {
      pieces: 0,
      runningHours: 0,
      stoppedHours: 0,
      utilizationPercent: null,
      targetUtilizationPercent: null,
      minUtilizationPercent: null,
      tcMedioMinPerPiece: null,
      dateStr: "",
    };
  }

  return {
    pieces: row.pieces || 0,
    runningHours: row.runningHours || 0,
    stoppedHours: row.stoppedHours || 0,
    utilizationPercent: row.utilizationPercent,
    targetUtilizationPercent: row.targetUtilizationPercent,
    minUtilizationPercent: row.minUtilizationPercent,
    tcMedioMinPerPiece: row.tcMedioMinPerPiece,
    dateStr: row.dateStr || "",
  };
}

export function computeSummary(sectorsData, now = new Date()) {
  const perSector = sectorsData.map((s) => {
    const snap = computeSectorSnapshot(s.series, now);
    return {
      id: s.id,
      name: s.name,
      ...snap,
      totalHours: snap.runningHours + snap.stoppedHours,
    };
  });

  const totals = perSector.reduce(
    (acc, s) => {
      acc.pieces += s.pieces || 0;
      acc.runningHours += s.runningHours || 0;
      acc.stoppedHours += s.stoppedHours || 0;
      acc.totalHours += s.totalHours || 0;
      return acc;
    },
    { pieces: 0, runningHours: 0, stoppedHours: 0, totalHours: 0 }
  );

  const weightedUtil = perSector.reduce((acc, s) => {
    if (!Number.isFinite(s.utilizationPercent)) return acc;
    const w = s.totalHours || 0;
    if (!w) return acc;
    acc.sum += s.utilizationPercent * w;
    acc.w += w;
    return acc;
  }, { sum: 0, w: 0 });

  const weightedTarget = perSector.reduce((acc, s) => {
    if (!Number.isFinite(s.targetUtilizationPercent)) return acc;
    const w = s.totalHours || 0;
    if (!w) return acc;
    acc.sum += s.targetUtilizationPercent * w;
    acc.w += w;
    return acc;
  }, { sum: 0, w: 0 });
  const weightedMin = perSector.reduce((acc, s) => {
    if (!Number.isFinite(s.minUtilizationPercent)) return acc;
    const w = s.totalHours || 0;
    if (!w) return acc;
    acc.sum += s.minUtilizationPercent * w;
    acc.w += w;
    return acc;
  }, { sum: 0, w: 0 });

  const utilizationPercent =
    weightedUtil.w > 0 ? round1(weightedUtil.sum / weightedUtil.w) : null;
  const targetUtilizationPercent =
    weightedTarget.w > 0 ? round1(weightedTarget.sum / weightedTarget.w) : null;
  const minUtilizationPercent = weightedMin.w > 0 ? round1(weightedMin.sum / weightedMin.w) : null;

  const tcAvg = perSector.reduce((acc, s) => {
    if (!Number.isFinite(s.tcMedioMinPerPiece)) return acc;
    acc.sum += s.tcMedioMinPerPiece;
    acc.n += 1;
    return acc;
  }, { sum: 0, n: 0 });
  const tcMedioAvgMinPerPiece = tcAvg.n ? round1(tcAvg.sum / tcAvg.n) : null;

  const dateStr = perSector.find((s) => s.dateStr)?.dateStr || "";

  return {
    perSector,
    totals,
    utilizationPercent,
    targetUtilizationPercent,
    minUtilizationPercent,
    tcMedioAvgMinPerPiece,
    dateStr,
  };
}

function parseNumberPtBR(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

function parsePercentPtBR(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const normalized = s.replace("%", "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

export function parseHMS(value) {
  try {
    if (!value) return 0;
    const parts = String(value).trim().split(":");
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    const total = hours + minutes / 60 + seconds / 3600;
    return Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
}

function parseDatePtBR(value) {
  const s = String(value || "").trim();
  // Expected: dd/mm/yyyy
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!match) return null;
  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);
  const date = new Date(yyyy, mm - 1, dd);
  return Number.isFinite(date.getTime()) ? date : null;
}

function parseDurationToMinutes(value) {
  // TC MEDIO on the sheet tends to be HH:MM:SS (e.g. 00:00:39)
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const hours = parseHMS(raw);
  if (Number.isFinite(hours) && hours > 0) return hours * 60;

  const mmss = /^(\d+):(\d{1,2})$/.exec(raw);
  if (mmss) {
    const minutes = Number(mmss[1]);
    const seconds = Number(mmss[2]);
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes + Math.min(Math.max(seconds, 0), 59) / 60;
    }
  }

  // Legacy inputs can come as "0,40"/"0.40", meaning 00:00:40.
  const mmCommaSs = /^(\d+)[,.](\d{2})$/.exec(raw);
  if (mmCommaSs) {
    const minutes = Number(mmCommaSs[1]);
    const seconds = Number(mmCommaSs[2]);
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes + Math.min(Math.max(seconds, 0), 59) / 60;
    }
  }

  const decimalMinutes = parseNumberPtBR(raw);
  return Number.isFinite(decimalMinutes) && decimalMinutes > 0 ? decimalMinutes : null;
}

export function parseDisplayTableToSeries(json, columns) {
  const headers = json?.headers || [];
  const rows = json?.rows || [];
  const headerIndexMap = new Map(headers.map((header, index) => [header, index]));

  const maxColumn = columns.maximumUtilization || columns.targetUtilization || "maximo";
  const minColumn = columns.minimumUtilization || "minimo";

  const dateIndex = headerIndexMap.get(columns.date) ?? -1;
  const piecesIndex = headerIndexMap.get(columns.pieces) ?? -1;
  const runningIndex = headerIndexMap.get(columns.running) ?? -1;
  const stoppedIndex = headerIndexMap.get(columns.stopped) ?? -1;
  const utilizationIndex = headerIndexMap.get(columns.utilization) ?? -1;
  const targetUtilizationIndex = headerIndexMap.get(maxColumn) ?? -1;
  const minUtilizationIndex = headerIndexMap.get(minColumn) ?? -1;
  const tcMedioIndex = headerIndexMap.get(columns.tcMedio) ?? -1;

  const readCell = (row, index) => (index >= 0 && index < row.length ? row[index] : undefined);
  const result = [];

  for (const row of rows) {
    const dateStr = readCell(row, dateIndex);
    const date = parseDatePtBR(dateStr);

    const pieces = parseNumberPtBR(readCell(row, piecesIndex)) ?? 0;
    const runningHours = parseHMS(readCell(row, runningIndex));
    const stoppedHours = parseHMS(readCell(row, stoppedIndex));
    const utilizationPercent = parsePercentPtBR(readCell(row, utilizationIndex));
    const targetUtilizationPercent = parsePercentPtBR(readCell(row, targetUtilizationIndex));
    const minUtilizationPercent = parsePercentPtBR(readCell(row, minUtilizationIndex));

    let tcMedioMinPerPiece = parseDurationToMinutes(readCell(row, tcMedioIndex));
    if (tcMedioMinPerPiece === null && pieces > 0 && runningHours > 0) {
      const computed = (runningHours * 60) / pieces;
      tcMedioMinPerPiece = Number.isFinite(computed) ? computed : null;
    }

    result.push({
      date,
      dateStr: dateStr ? String(dateStr) : "",
      label: dateStr ? String(dateStr).substring(0, 5) : "",
      pieces,
      runningHours,
      stoppedHours,
      utilizationPercent: Number.isFinite(utilizationPercent) ? utilizationPercent : null,
      targetUtilizationPercent: Number.isFinite(targetUtilizationPercent)
        ? targetUtilizationPercent
        : null,
      minUtilizationPercent: Number.isFinite(minUtilizationPercent) ? minUtilizationPercent : null,
      tcMedioMinPerPiece,
    });
  }

  return result;
}

export function pickTodayOrLatest(series, now = new Date()) {
  if (!Array.isArray(series) || series.length === 0) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isSameDay = (d1, d2) =>
    d1 &&
    d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const todayRow = series.find((r) => isSameDay(r.date, today));
  return todayRow || series[0];
}

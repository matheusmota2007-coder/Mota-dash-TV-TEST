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

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getColumnIndex(headerIndexMap, normalizedHeaderIndexMap, configuredColumn, fallbackColumns = []) {
  if (configuredColumn) {
    const direct = headerIndexMap.get(configuredColumn);
    if (direct !== undefined) return direct;

    const normalized = normalizedHeaderIndexMap.get(normalizeHeader(configuredColumn));
    if (normalized !== undefined) return normalized;
  }

  for (const fallback of fallbackColumns) {
    const direct = headerIndexMap.get(fallback);
    if (direct !== undefined) return direct;

    const normalized = normalizedHeaderIndexMap.get(normalizeHeader(fallback));
    if (normalized !== undefined) return normalized;
  }

  return -1;
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

function parseHours(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const hhmmss = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(raw);
  if (hhmmss) {
    const hours = Number(hhmmss[1]);
    const minutes = Number(hhmmss[2]);
    const seconds = hhmmss[3] ? Number(hhmmss[3]) : 0;
    if (Number.isFinite(hours) && Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return Math.max(0, hours) + Math.min(Math.max(minutes, 0), 59) / 60 + Math.min(Math.max(seconds, 0), 59) / 3600;
    }
  }

  const parsed = parseNumberPtBR(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
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
  const normalizedHeaderIndexMap = new Map(
    headers.map((header, index) => [normalizeHeader(header), index])
  );

  const maxColumn = columns.maximumUtilization || columns.targetUtilization || "maximo";
  const minColumn = columns.minimumUtilization || "minimo";

  const dateIndex = getColumnIndex(headerIndexMap, normalizedHeaderIndexMap, columns.date, ["data"]);
  const piecesIndex = getColumnIndex(headerIndexMap, normalizedHeaderIndexMap, columns.pieces, ["pecas fabric."]);
  const runningIndex = getColumnIndex(headerIndexMap, normalizedHeaderIndexMap, columns.running, ["funcionando"]);
  const stoppedIndex = getColumnIndex(headerIndexMap, normalizedHeaderIndexMap, columns.stopped, ["parado"]);
  const workingHoursIndex = getColumnIndex(
    headerIndexMap,
    normalizedHeaderIndexMap,
    columns.workingHours || columns.workHours,
    ["horas de trabalho", "hora de trabalho", "jornada", "jornada diaria", "carga horaria"]
  );
  const utilizationIndex = getColumnIndex(
    headerIndexMap,
    normalizedHeaderIndexMap,
    columns.utilization
  );
  const targetUtilizationIndex = getColumnIndex(
    headerIndexMap,
    normalizedHeaderIndexMap,
    maxColumn
  );
  const minUtilizationIndex = getColumnIndex(
    headerIndexMap,
    normalizedHeaderIndexMap,
    minColumn
  );
  const tcMedioIndex = getColumnIndex(headerIndexMap, normalizedHeaderIndexMap, columns.tcMedio);

  const readCell = (row, index) => (index >= 0 && index < row.length ? row[index] : undefined);
  const result = [];

  for (const row of rows) {
    const dateStr = readCell(row, dateIndex);
    const date = parseDatePtBR(dateStr);

    const pieces = parseNumberPtBR(readCell(row, piecesIndex)) ?? 0;
    const runningHoursRaw = parseHours(readCell(row, runningIndex)) ?? 0;
    const stoppedHoursFromSheet = parseHours(readCell(row, stoppedIndex));
    const workingHours = parseHours(readCell(row, workingHoursIndex));
    const runningHours = Number.isFinite(workingHours)
      ? Math.min(Math.max(0, runningHoursRaw), workingHours)
      : runningHoursRaw;
    const stoppedHours = Number.isFinite(workingHours)
      ? Math.max(0, workingHours - runningHours)
      : (stoppedHoursFromSheet ?? 0);
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
      workingHours: Number.isFinite(workingHours) ? workingHours : null,
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

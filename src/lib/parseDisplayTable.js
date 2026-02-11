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
  const hours = parseHMS(value);
  if (!Number.isFinite(hours) || hours <= 0) return null;
  return hours * 60;
}

export function parseDisplayTableToSeries(json, columns) {
  const headers = json?.headers || [];
  const rows = json?.rows || [];
  const result = [];

  for (const row of rows) {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }

    const dateStr = obj[columns.date];
    const date = parseDatePtBR(dateStr);

    const pieces = parseNumberPtBR(obj[columns.pieces]) ?? 0;
    const runningHours = parseHMS(obj[columns.running]);
    const stoppedHours = parseHMS(obj[columns.stopped]);
    const utilizationPercent = parsePercentPtBR(obj[columns.utilization]);
    const targetUtilizationPercent = parsePercentPtBR(obj[columns.targetUtilization]);

    let tcMedioMinPerPiece = parseDurationToMinutes(obj[columns.tcMedio]);
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


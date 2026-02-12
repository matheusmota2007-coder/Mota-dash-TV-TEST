export function resizeCanvas(canvas) {
  if (!canvas) return;
  const { offsetWidth, offsetHeight } = canvas;
  if (!offsetWidth || !offsetHeight) return;
  canvas.width = offsetWidth;
  canvas.height = offsetHeight;
}

export function drawCenteredMessage(ctx, canvas, title, message) {
  if (!ctx || !canvas) return;
  try {
    resizeCanvas(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title || "Aviso", canvas.width / 2, 28);

    ctx.fillStyle = "#ef4444";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message || "Erro", canvas.width / 2, canvas.height / 2);
  } catch (e) {
    console.error("Erro ao desenhar mensagem:", e);
  }
}

export function drawLineChart(ctx, canvas, labels, values, title, color, suffix = "") {
  if (!ctx || !canvas) return;
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const bottomPadding = 70;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding - bottomPadding;

    const validValues = values.filter((v) => v !== null && !isNaN(v) && isFinite(v));
    if (validValues.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Sem dados disponíveis", canvas.width / 2, canvas.height / 2);
      return;
    }

    const maxValue = Math.max(...validValues, 1);
    const minValue = Math.min(...validValues, 0);
    const range = maxValue - minValue || 1;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, 20);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padding + 30 + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    labels.forEach((label, i) => {
      const value = values[i];
      if (value === null || isNaN(value) || !isFinite(value)) return;

      const x = padding + (i / Math.max(labels.length - 1, 1)) * chartWidth;
      const y =
        padding + 30 + chartHeight - ((value - minValue) / range) * chartHeight;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    labels.forEach((label, i) => {
      const value = values[i];
      if (value === null || isNaN(value) || !isFinite(value)) return;

      const x = padding + (i / Math.max(labels.length - 1, 1)) * chartWidth;
      const y =
        padding + 30 + chartHeight - ((value - minValue) / range) * chartHeight;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(x, y - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value.toFixed(1) + suffix, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(x, canvas.height - bottomPadding + 25);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  } catch (error) {
    console.error("Erro no drawLineChart:", error);
  }
}

export function drawBarChart(ctx, canvas, labels, values, title, color, suffix = "") {
  if (!ctx || !canvas) return;
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const bottomPadding = 70;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding - bottomPadding;
    const barWidth = Math.max(chartWidth / Math.max(labels.length, 1) - 8, 10);

    const validValues = values.filter((v) => v !== null && !isNaN(v) && isFinite(v));
    if (validValues.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Sem dados disponíveis", canvas.width / 2, canvas.height / 2);
      return;
    }

    const maxValue = Math.max(...validValues, 1);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, 20);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    labels.forEach((label, i) => {
      const value = values[i];
      if (value === null || isNaN(value) || !isFinite(value)) return;

      const x = padding + i * (barWidth + 8);
      const barHeight = (value / maxValue) * chartHeight;
      const y = canvas.height - bottomPadding - barHeight;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.save();
      ctx.translate(x + barWidth / 2, y - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value.toFixed(0) + suffix, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(x + barWidth / 2, canvas.height - bottomPadding + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  } catch (error) {
    console.error("Erro no drawBarChart:", error);
  }
}

export function drawStackedBarChart(
  ctx,
  canvas,
  labels,
  values1,
  values2,
  title,
  color1,
  color2,
  label1,
  label2
) {
  if (!ctx || !canvas) return;
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const bottomPadding = 70;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding - bottomPadding - 20;
    const barWidth = Math.max(chartWidth / Math.max(labels.length, 1) - 8, 10);

    const maxValues = [];
    for (let i = 0; i < labels.length; i++) {
      const v1 = values1[i] || 0;
      const v2 = values2[i] || 0;
      if (isFinite(v1) && isFinite(v2)) maxValues.push(v1 + v2);
    }

    if (maxValues.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Sem dados disponíveis", canvas.width / 2, canvas.height / 2);
      return;
    }

    const maxValue = Math.max(...maxValues, 1);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, 20);

    ctx.font = "11px Arial";
    const legendY = 35;
    ctx.fillStyle = color1;
    ctx.fillRect(canvas.width / 2 - 60, legendY, 15, 15);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(label1, canvas.width / 2 - 42, legendY + 11);

    ctx.fillStyle = color2;
    ctx.fillRect(canvas.width / 2 + 10, legendY, 15, 15);
    ctx.fillStyle = "#fff";
    ctx.fillText(label2, canvas.width / 2 + 28, legendY + 11);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padding + 20 + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    labels.forEach((label, i) => {
      const val1 = values1[i] || 0;
      const val2 = values2[i] || 0;
      if (!isFinite(val1) || !isFinite(val2)) return;

      const x = padding + i * (barWidth + 8);

      const height1 = (val1 / maxValue) * chartHeight;
      const y1 = canvas.height - bottomPadding - height1;
      ctx.fillStyle = color1;
      ctx.fillRect(x, y1, barWidth, height1);

      if (height1 > 20) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${val1.toFixed(1)}h`, x + barWidth / 2, y1 + height1 / 2 + 3);
      }

      const height2 = (val2 / maxValue) * chartHeight;
      const y2 = y1 - height2;
      ctx.fillStyle = color2;
      ctx.fillRect(x, y2, barWidth, height2);

      if (height2 > 20) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${val2.toFixed(1)}h`, x + barWidth / 2, y2 + height2 / 2 + 3);
      }

      ctx.save();
      ctx.translate(x + barWidth / 2, canvas.height - bottomPadding + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  } catch (error) {
    console.error("Erro no drawStackedBarChart:", error);
  }
}


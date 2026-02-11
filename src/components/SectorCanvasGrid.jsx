import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  drawBarChart,
  drawLineChart,
  drawStackedBarChart,
  resizeCanvas,
  drawCenteredMessage,
} from "../lib/canvasCharts";

export default function SectorCanvasGrid({ titlePrefix, series, errorMessage }) {
  const canvasRefs = useRef([null, null, null, null]);

  const { labels, utilData, piecesData, runningData, stoppedData, tcData } = useMemo(() => {
    const safeSeries = Array.isArray(series) ? series : [];
    return {
      labels: safeSeries.map((d) => d.label),
      utilData: safeSeries.map((d) => d.utilizationPercent),
      piecesData: safeSeries.map((d) => d.pieces),
      runningData: safeSeries.map((d) => d.runningHours),
      stoppedData: safeSeries.map((d) => d.stoppedHours),
      tcData: safeSeries.map((d) => d.tcMedioMinPerPiece),
    };
  }, [series]);

  const drawNow = useCallback(() => {
    const canvases = canvasRefs.current;
    if (!canvases.every(Boolean)) return;

    if (errorMessage) {
      const title = titlePrefix ? `${titlePrefix} - erro` : "Erro";
      for (const canvas of canvases) {
        const ctx = canvas.getContext("2d");
        drawCenteredMessage(ctx, canvas, title, `❌ ${errorMessage}`);
      }
      return;
    }

    if (!series || series.length === 0) return;

    const [c1, c2, c3, c4] = canvases;

    resizeCanvas(c1);
    drawLineChart(
      c1.getContext("2d"),
      c1,
      labels,
      utilData,
      "Utilização de Máquina",
      "#3b82f6",
      "%"
    );

    resizeCanvas(c2);
    drawBarChart(c2.getContext("2d"), c2, labels, piecesData, "Peças Fabricadas", "#22c55e");

    resizeCanvas(c3);
    drawStackedBarChart(
      c3.getContext("2d"),
      c3,
      labels,
      runningData,
      stoppedData,
      "Horas Func. / Parado",
      "#22c55e",
      "#ef4444",
      "Funcionando",
      "Parado"
    );

    resizeCanvas(c4);
    drawLineChart(
      c4.getContext("2d"),
      c4,
      labels,
      tcData,
      "TC Médio (min/peça)",
      "#f59e0b",
      " min"
    );
  }, [errorMessage, labels, piecesData, runningData, series, stoppedData, tcData, titlePrefix, utilData]);

  useEffect(() => {
    drawNow();
  }, [drawNow]);

  useEffect(() => {
    const onResize = () => {
      drawNow();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawNow]);

  const setCanvasRef = (index) => (el) => {
    canvasRefs.current[index] = el;
  };

  return (
    <div className="w-full h-full p-2">
      <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
        <div className="bg-mota-panel rounded-lg p-2 flex items-center justify-center overflow-hidden">
          <canvas ref={setCanvasRef(0)} className="w-full h-full" />
        </div>
        <div className="bg-mota-panel rounded-lg p-2 flex items-center justify-center overflow-hidden">
          <canvas ref={setCanvasRef(1)} className="w-full h-full" />
        </div>
        <div className="bg-mota-panel rounded-lg p-2 flex items-center justify-center overflow-hidden">
          <canvas ref={setCanvasRef(2)} className="w-full h-full" />
        </div>
        <div className="bg-mota-panel rounded-lg p-2 flex items-center justify-center overflow-hidden">
          <canvas ref={setCanvasRef(3)} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

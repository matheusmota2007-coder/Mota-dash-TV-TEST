import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import AppLayout from "./components/AppLayout";
import SectorChartsScreen from "./components/SectorChartsScreen";
import SummaryScreen from "./components/SummaryScreen";
import { loadDashboardConfig } from "./config/runtimeDashboardConfig";
import { fetchDisplayTable } from "./services/sheetsApi";
import { parseDisplayTableToSeries } from "./lib/parseDisplayTable";
import { computeSummary } from "./lib/metrics";

function createInitialSectorState(sectors) {
  const state = {};
  for (const sector of sectors) {
    state[sector.id] = {
      series: [],
      hasError: false,
      errorMsg: "",
      updatedAt: null,
      rowCount: 0,
    };
  }
  return state;
}

export default function App() {
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { config } = await loadDashboardConfig();
        if (!isMounted) return;
        setDashboardConfig(config);
        setConfigError("");
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setConfigError(msg);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const title = dashboardConfig?.title || "Dashboard";
  const switchIntervalMs = dashboardConfig?.switchIntervalMs ?? 30_000;
  const refreshIntervalMs = dashboardConfig?.refreshIntervalMs ?? 300_000;
  const screensOrder = dashboardConfig?.screensOrder || [];
  const sectors = dashboardConfig?.sectors || [];
  const columns = dashboardConfig?.columns || {};

  const [screenIndex, setScreenIndex] = useState(0);
  const effectiveScreensOrder = useMemo(() => {
    const sectorIds = new Set(sectors.map((s) => s.id));
    const baseOrder =
      Array.isArray(screensOrder) && screensOrder.length
        ? screensOrder
        : ["summary", ...sectors.map((s) => s.id)];

    const filtered = baseOrder.filter((id, idx) => {
      if (id === "summary") return baseOrder.indexOf(id) === idx;
      if (!sectorIds.has(id)) return false;
      return baseOrder.indexOf(id) === idx;
    });

    if (!filtered.length) return ["summary"];
    return filtered;
  }, [screensOrder, sectors]);

  const activeScreenId = effectiveScreensOrder[screenIndex] || effectiveScreensOrder[0];

  const [sectorState, setSectorState] = useState(() => createInitialSectorState(sectors));
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(() => new Date());
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [screenStartedAt, setScreenStartedAt] = useState(() => Date.now());
  const [screenProgress, setScreenProgress] = useState(1);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSectorState(createInitialSectorState(sectors));
    hasLoadedOnceRef.current = false;
    setLoading(true);
    setScreenIndex(0);
  }, [sectors]);

  const loadAll = useCallback(async () => {
    if (!sectors.length) {
      setLoading(false);
      return;
    }
    const results = await Promise.allSettled(
      sectors.map(async (sector) => {
        const json = await fetchDisplayTable(sector);
        if (json?.ok === false) {
          throw new Error(json?.error || "server_error");
        }
        const series = parseDisplayTableToSeries(json, columns);
        if (!series.length) throw new Error("Nenhum dado disponível");
        return { sectorId: sector.id, series, rowCount: json?.rowCount ?? series.length };
      })
    );

    setSectorState((prev) => {
      const next = { ...prev };
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const sectorId = sectors[i]?.id;
        if (!sectorId) continue;

        if (r.status === "fulfilled") {
          const { series, rowCount } = r.value;
          next[sectorId] = {
            series,
            rowCount,
            hasError: false,
            errorMsg: "",
            updatedAt: new Date(),
          };
        } else {
          const reason = r.reason;
          next[sectorId] = {
            ...next[sectorId],
            hasError: true,
            errorMsg: String(reason?.message || reason),
            updatedAt: new Date(),
          };
        }
      }
      return next;
    });

    setLastRefreshAt(new Date());
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      setScreenStartedAt(Date.now());
      setScreenProgress(1);
    }
    setLoading(false);
  }, [columns, sectors]);

  useEffect(() => {
    if (!dashboardConfig) return;
    const initial = setTimeout(() => {
      loadAll();
    }, 0);
    const timer = setInterval(loadAll, refreshIntervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [dashboardConfig, loadAll, refreshIntervalMs]);

  useEffect(() => {
    if (!dashboardConfig) return;
    if (loading) return;
    if (!effectiveScreensOrder.length) return;
    const timer = setInterval(() => {
      setScreenStartedAt(Date.now());
      setScreenProgress(1);
      setScreenIndex((i) => (i + 1) % effectiveScreensOrder.length);
    }, switchIntervalMs);
    return () => clearInterval(timer);
  }, [dashboardConfig, effectiveScreensOrder.length, loading, switchIntervalMs]);

  const goNextScreen = useCallback(() => {
    if (loading) return;
    setScreenStartedAt(Date.now());
    setScreenProgress(1);
    setScreenIndex((i) => (i + 1) % effectiveScreensOrder.length);
  }, [effectiveScreensOrder.length, loading]);

  const goPrevScreen = useCallback(() => {
    if (loading) return;
    setScreenStartedAt(Date.now());
    setScreenProgress(1);
    setScreenIndex((i) => (i - 1 + effectiveScreensOrder.length) % effectiveScreensOrder.length);
  }, [effectiveScreensOrder.length, loading]);

  useEffect(() => {
    if (screenIndex >= effectiveScreensOrder.length) {
      setScreenIndex(0);
    }
  }, [effectiveScreensOrder.length, screenIndex]);

  useEffect(() => {
    if (loading) return;
    const tick = () => {
      const elapsed = Date.now() - screenStartedAt;
      const remaining = Math.max(0, switchIntervalMs - elapsed);
      setScreenProgress(switchIntervalMs > 0 ? remaining / switchIntervalMs : 0);
    };
    const initial = setTimeout(tick, 0);
    const timer = setInterval(tick, 100);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loading, screenStartedAt, switchIntervalMs]);

  const activeSector = useMemo(() => sectors.find((s) => s.id === activeScreenId), [activeScreenId, sectors]);

  const summary = useMemo(() => {
    const data = sectors.map((s) => ({ id: s.id, name: s.name, series: sectorState[s.id]?.series || [] }));
    return computeSummary(data, clock);
  }, [clock, sectorState, sectors]);

  const subtitle = useMemo(() => {
    const time = clock.toLocaleTimeString("pt-BR");
    if (activeScreenId === "summary") return `GERENCIAL - resumo geral - ${time}`;
    if (!activeSector) return `Carregando... - ${time}`;

    const st = sectorState[activeSector.id];
    if (st?.hasError) return `${activeSector.name} - ❌ erro - ${time}`;
    if (st?.rowCount) return `${activeSector.name} - ✓ ${st.rowCount} registros - ${time}`;
    return `${activeSector.name} - carregando... - ${time}`;
  }, [activeScreenId, activeSector, clock, sectorState]);

  const badge = activeScreenId === "summary" ? "GERENCIAL" : activeSector?.name || "";

  if (!dashboardConfig) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-black/90 px-10 py-8 rounded-lg text-center border border-slate-700/40 max-w-xl w-full">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
          <div className="text-white text-lg">Carregando configuração...</div>
          {!configError ? null : (
            <div className="text-slate-300 mt-3 text-sm whitespace-pre-wrap">{configError}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      title={title}
      subtitle={subtitle}
      badge={badge}
      onPrevScreen={goPrevScreen}
      onNextScreen={goNextScreen}
      progress={loading ? 1 : screenProgress}
      footer={
        lastRefreshAt
          ? `Sincronizado com Google Sheets • Última atualização: ${lastRefreshAt.toLocaleTimeString("pt-BR")}`
          : "Sincronizando com Google Sheets..."
      }
    >
      <div key={activeScreenId} className="absolute inset-0 mota-fade-in">
        {activeScreenId === "summary" ? (
          <SummaryScreen summary={summary} title={title} />
        ) : activeSector ? (
          sectorState[activeSector.id]?.hasError ? (
            <div className="p-6">
              <div className="bg-mota-panel rounded-xl border border-red-500/40 shadow-2xl p-6 text-center">
                <div className="text-red-400 font-black text-lg">Erro ao carregar dados</div>
                <div className="text-slate-300 mt-2 text-sm">
                  {sectorState[activeSector.id]?.errorMsg || "Falha desconhecida"}
                </div>
              </div>
            </div>
          ) : (
            <SectorChartsScreen series={sectorState[activeSector.id]?.series || []} />
          )
        ) : null}
      </div>

      {!loading ? null : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="bg-black/90 px-10 py-8 rounded-lg text-center border border-slate-700/40">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
            <div className="text-white text-lg">Carregando dados...</div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

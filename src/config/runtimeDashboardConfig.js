function getClientIdFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("client");
  if (fromQuery) return fromQuery.trim();

  const baseUrl = import.meta.env.BASE_URL || "/";
  const pathname = window.location.pathname || "/";

  const withoutBase = pathname.startsWith(baseUrl) ? pathname.slice(baseUrl.length) : pathname.replace(/^\//, "");
  const firstSegment = withoutBase.split("/").filter(Boolean)[0];
  return firstSegment || "default";
}

function validateDashboardConfig(config) {
  const errors = [];
  if (!config || typeof config !== "object") errors.push("config inválida");
  if (!config?.title || typeof config.title !== "string") errors.push("`title` obrigatório");
  if (!Array.isArray(config?.sectors)) errors.push("`sectors` deve ser um array");
  if (!config?.columns || typeof config.columns !== "object") errors.push("`columns` obrigatório");
  if (typeof config?.switchIntervalMs !== "number") errors.push("`switchIntervalMs` deve ser number");
  if (typeof config?.refreshIntervalMs !== "number") errors.push("`refreshIntervalMs` deve ser number");
  return errors;
}

export async function loadDashboardConfig() {
  const clientId = getClientIdFromLocation();
  const baseUrl = import.meta.env.BASE_URL || "/";
  const configUrl = `${baseUrl}clients/${encodeURIComponent(clientId)}/dashboard.json`;

  let response;
  try {
    response = await fetch(configUrl, { cache: "no-store" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao buscar config do cliente "${clientId}": ${msg}`);
  }

  if (!response.ok) {
    throw new Error(
      `Config do cliente "${clientId}" não encontrada (${response.status}). Esperado: public/clients/${clientId}/dashboard.json`
    );
  }

  const json = await response.json();
  const errors = validateDashboardConfig(json);
  if (errors.length) {
    throw new Error(`Config do cliente "${clientId}" inválida: ${errors.join(", ")}`);
  }

  return { clientId, config: json };
}


const REQUEST_TIMEOUT_MS = 20_000;

export async function fetchDisplayTable({ apiUrl, token }) {
  const url = `${apiUrl}?token=${encodeURIComponent(token)}&_=${Date.now()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Tempo limite excedido (${Math.round(REQUEST_TIMEOUT_MS / 1000)}s)`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

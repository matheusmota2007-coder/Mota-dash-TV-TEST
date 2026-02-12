export async function fetchDisplayTable({ apiUrl, token }) {
  const url = `${apiUrl}?token=${encodeURIComponent(token)}&_=${Date.now()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }
  return await response.json();
}


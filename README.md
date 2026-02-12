# Mota Dash TV (multi-client)

Este projeto suporta múltiplos clientes no **mesmo GitHub Pages** usando:

- Configuração **em tempo de execução** via `public/clients/<cliente>/dashboard.json`
- URL por cliente via subpasta: `/<cliente>/` (fallback via `404.html` no GitHub Pages)

## Como adicionar um novo cliente

1. Crie o arquivo `public/clients/<cliente>/dashboard.json` (use `public/clients/default/dashboard.json` como modelo).
2. Publique no GitHub Pages.
3. Acesse: `https://<org-ou-user>.github.io/<repo>/<cliente>/`

Dica: também funciona localmente via querystring: `http://localhost:5173/?client=<cliente>`

## Deploy no GitHub Pages

Existe um workflow em `.github/workflows/deploy-pages.yml` que:

- Faz build com `VITE_BASE=/<repo>/` (necessário para project pages)
- Publica a pasta `dist` no GitHub Pages

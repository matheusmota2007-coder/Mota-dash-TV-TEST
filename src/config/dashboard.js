export const DASHBOARD_CONFIG = {
  title: "Dashboard de Produção - Mota TV",
  switchIntervalMs: 30_000,
  refreshIntervalMs: 5_000,
  screensOrder: ["summary", "costura", "corte"],
  columns: {
    date: "data",
    pieces: "Peças Fabric.",
    running: "Funcionando",
    stopped: "Parado",
    utilization: "utilização de Maquina",
    tcMedio: "TC MEDIO",
    targetUtilization: "maximo",
  },
  sectors: [
    {
      id: "costura",
      name: "COSTURA",
      apiUrl:
        "https://script.google.com/macros/s/AKfycbxvSyCcS-PUsyXE6wed3UYwkIQ8wi2Mmicy4tSTwStpexHvTic-Rwc-7wcGoUjg6lAT/exec",
      token: "90czL6LPhZ1gHHlaurPZ1xmHpxyOeBqwPYqQWa5Z9bOYddf1kc",
    },
    // {
    //   id: "corte",
    //   name: "CORTE",
    //   apiUrl:
    //     "https://script.google.com/macros/s/AKfycbx-oyhUhYrOOnNR0-SaVOG2gNMDOu0ZNW8BhjGsDuvjJGq28Ge3mjhEX6mY8PLygEPygg/exec",
    //   token: "90czL6LPhZ1gHHlaurPZ1xmHpxyOeBqwPYqQWa5Z9bOYddf1kc",
    // },
  ],
};

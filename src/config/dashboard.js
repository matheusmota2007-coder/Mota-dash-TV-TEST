export const DASHBOARD_CONFIG = {
  title: "Dashboard de Produção - Mota TV",
  switchIntervalMs: 30_000,
  refreshIntervalMs: 300_000,
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
        "https://script.google.com/macros/s/AKfycbzCM0OW9g_jtBQsxkx5ISGzOG_6M-m9t6K6SgjF4HW6rv6la1hByHKXEi05UoMJDFVm/exec",
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

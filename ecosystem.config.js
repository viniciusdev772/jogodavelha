module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "server.js", // ou 'node_modules/next/dist/bin/next' dependendo da sua configuração
      instances: "max", // Utilize todos os núcleos disponíveis
      exec_mode: "cluster", // Balanceamento de carga entre os núcleos
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "sync",
      script: "ts-node",
      args: "src/server/main.ts",
      watch: ["src/server"],
    },
    {
      name: "api",
      script: "ts-node",
      args: "src/crypto-currency-prices/main.ts",
    },
    {
      name: "api",
      script: "ts-node",
      args: "src/fiat-exchange-rates/main.ts",
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "main-server",
      script: "node ./dist/src/server/start-server.js",
    },
    {
      name: "crypto-currency-prices-stub",
      script: "node ./dist/src/crypto-currency-prices/start-stub.js",
    },
    {
      name: "fiat-exchange-rates-stub",
      script: "node ./dist/src/fiat-exchange-rates/start-stub.js",
    },
  ],
};

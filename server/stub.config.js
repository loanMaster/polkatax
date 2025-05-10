module.exports = {
  apps: [
    {
      name: "main-server",
      script: "node ./dist/src/server/main.js",
    },
    {
      name: "crypto-currency-prices-stub",
      script: "node ./dist/src/crypto-currency-prices/stub.js",
    },
    {
      name: "fiat-exchange-rates-stub",
      script: "node ./dist/src/fiat-exchange-rates/stub.js",
    },
  ],
};

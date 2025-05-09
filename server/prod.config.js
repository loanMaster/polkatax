module.exports = {
  apps: [
    {
      name: "main-server",
      script: "node ./dist/src/server/main.js",
    },
    {
      name: "crypto-currency-prices",
      script: "node ./dist/src/crypto-currency-prices/main.js",
    },
    {
      name: "fiat-exchange-rates",
      script: "node ./dist/src/fiat-exchange-rates/main.js",
    },
  ],
};

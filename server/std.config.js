module.exports = {
  apps: [
    {
      name: "main-server",
      script: "npm run start:server",
    },
    {
      name: "crypto-currency-prices-service",
      script: "npm run start:crypto-currency-prices",
    },
    {
      name: "fiat-exchange-rates-service",
      script: "npm run start:fiat-exchange-rates",
    },
  ],
};

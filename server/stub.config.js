module.exports = {
  apps: [
    {
      name: "main-server",
      script: "npm run start:server",
      watch: ["src/server"],
    },
    {
      name: "crypto-currency-prices-stub",
      script: "npm run start:crypto-currency-prices-stub",
    },
    {
      name: "fiat-exchange-rates-stub",
      script: "npm run start:fiat-exchange-rates-stub",
    },
  ],
};

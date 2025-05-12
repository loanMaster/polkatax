# PolkaTax

PolkaTax is a tool to show and export 

- accumulated staking rewards 
- transfers 
- trades

PolkaTax supports multiple substrate chains, Ethereum chains (L1 and L2s) and fiat currencies.

Data can be shown as graph and table and can be exported in CSV and JSON format.

This project does NOT offer a one-click solution to taxation of crypto currencies.
Rather, the user is encouraged to export the data to CSV for further processing.

## Install the dependencies

The project is split into a server and a client folder

```bash
npm install
cd client
npm install
cd ../server
npm install
```

## The client

### Start the client in development mode (hot-code reloading, error reporting, etc.)

```bash
cd client
npm run dev
```

### Lint the client files

```bash
cd client
npm run lint
```

### Format the client files

```bash
cd client
npm run lint-fix
```

### Build the app for production

```bash
npm run build
```


## The server

### Services

The server-side of the application consists of three distinct services, each running in its own process and communicating via HTTP.

| Name                     | Function                                                                                      | Port | Port Env                         |
|--------------------------|-----------------------------------------------------------------------------------------------|------|----------------------------------|
| crypto-currency-prices   | Fetches current and historical crypto currency prices                                         | 3002 | CRYPTO_CURRENCY_PRICES_PORT     |
| fiat-exchange-rates      | Fetches historical exchange rates of all fiat currencies                                      | 3003 | FIAT_EXCHANGE_RATES_PORT        |
| server                   | Serves the frontend, fetches tax relevant data and enriches data with help of the other two services | 3001 |                                  |

### Running the Services

To start all services in parallel, use:
```bash
npm run start
```

To start a single service, use:
```bash
npm run start:<service-name>
```

For example:
To start a single service, use:
```bash
npm run start:fiat-exchange-rates 
```

To run the app with stubbed services for local testing:
```bash
npm run start-with-stubs
```
This will provide dummy values for fiat-to-fiat values, allowing you to test without needing an EXCHANGERATE_HOST_API_KEY.

### Production setup

For production environments, first build the application:
```bash
npm run build
```

And run with pm2:
```bash
cd server
pm2 start prod.config.js
```

## Prerequisites
To run the server locally you should provide multiple API keys as environment variables.
Only the SUBSCAN_API_KEY is absolutely mandatory (see stubs in section above). 

| API   |      Environment variable name      |  Required for |
|----------|:-------------:|:-------------:|
| exchangerate_host | EXCHANGERATE_HOST_API_KEY | all functions |
| subscan |  SUBSCAN_API_KEY | any substrate related functions |
| etherscan |    ETHERSCAN_API_KEY   | transactions / trades on Ethereum |
| moonscan | MOONSCAN_API_KEY |  transactions / trades on Moonbeam |
| arbiscan | ARBISCAN_API_KEY |  transactions / trades on Arbitrum One |
| optiscan | OPTIMISM_API_KEY |  transactions / trades on Optimism |
| polyscan | POLYSCAN_API_KEY |  transactions / trades on Polygon |


## Create substrate chain list

Run 
```bash
npm run generate-subscan-chain-list
```
This will generate a new list of substrate chains in the `res/gen/` folder.

## coingecko

The current implementation uses coingecko, however without API key.
The reason are the relatively high costs of purchasing a coingecko API key.
The consequence is that you might encounter errors with code 429 from coingecko if too many
requests are made, especially when you just started the application.

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

### Start the client in development mode (hot-code reloading, error reporting, etc.)

```bash
cd client
npm run dev
```

### Start the server

```bash
npm run serve
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



## Prerequisites
To run the server locally you should provide multiple API keys as environment variables.


| API   |      Environment variable name      |  Required for |
|----------|:-------------:|:-------------:|
| exchangerate_host | EXCHANGERATE_HOST_API_KEY | all functions |
| subscan |  SUBSCAN_API_KEY | any substrate related functions |
| etherscan |    ETHERSCAN_API_KEY   | transactions / trades on Ethereum |
| moonscan | MOONSCAN_API_KEY |  transactions / trades on Moonbeam |
| arbiscan | ARBISCAN_API_KEY |  transactions / trades on Arbitrum One |
| optiscan | OPTIMISM_API_KEY |  transactions / trades on Optimism |
| polyscan | POLYSCAN_API_KEY |  transactions / trades on Polygon |


## Add a new token

Both the client and server have a list of tokens / chains, which need to be updated
(substrate-chains.json in the server project, tokenList.ts in the client project).

## coingecko

The current implementation uses coingecko, however without API key.
The reason are the relatively high costs of purchasing a coingecko API key.
The consequence is that you might encounter errors with code 429 from coingecko if too many
requests are many, especially when you just started the application.

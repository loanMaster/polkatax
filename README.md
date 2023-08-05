# PolkaTax (substrate-staking-rewards)

PolkaTax is a tool to show and export accumulated staking rewards on substrate.
PolkaTax supports multiple substrate chains and fiat currencies.

Rewards can be shown as graph and table and can be exported in CSV and JSON format.

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

### Start the process to upate the price data regularly

```bash
npm run fetch-quotes-periodically
```

## Prerequisites
To run the server locally you must provide an api key as environment variable named "SUBTRATE_API_KEY"

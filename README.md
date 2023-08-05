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

## Price data

The program needs historic price data to function properly.
You need to sync the price date completely once. Afterwards start the job to 
periodically update the price data. The data is stored in files under server/res/quotes for now.

### Fetch all price data and store it in files

This process will take a while!

```bash
npm run fetch-quotes-full-sync
```


### Start the process to update the price data regularly

This job will check for newest price data and update the files storing the price data.
Please make sure to fetch all price data once before staring this job.

```bash
npm run fetch-quotes-periodically
```

## Prerequisites
To run the server locally you must provide a subscan api key as environment variable named "SUBSCAN_API_KEY".
It will read environment variables from a file .env placed under /server.

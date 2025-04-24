export const evmChainConfigs = {
    'ethereum': {
        endpoint: "https://api.etherscan.io/api",
        apiKey: process.env["ETHERSCAN_API_KEY"],
        nativeToken: 'eth'
    },
    'moonbeam': {
        endpoint: "https://api-moonbeam.moonscan.io/api",
        apiKey: process.env["MOONSCAN_API_KEY"],
        nativeToken: 'glmr'
    },
    'arbitrum-one': {
        endpoint: "https://api.arbiscan.io/api",
        apiKey: process.env["ARBISCAN_API_KEY"],
        nativeToken: 'eth'
    },
    'optimism': {
        endpoint: "https://api-optimistic.etherscan.io/api",
        apiKey: process.env["OPTIMISM_API_KEY"],
        nativeToken: 'eth'
    },
    'polygon': {
        endpoint: "https://api.polygonscan.com/api",
        apiKey: process.env["POLYSCAN_API_KEY"],
        nativeToken: 'matic'
    },
    'base': {
        endpoint: "https://api.basescan.org/api",
        apiKey: process.env["BASESCAN_API_KEY"],
        nativeToken: 'eth'
    }
}
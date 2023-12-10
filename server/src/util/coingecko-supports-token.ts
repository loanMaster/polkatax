import {findCoingeckoToken} from "./find-coingecko-token-id";

export const coingeckoSupportsToken = (symbol: string, chainName) => !!findCoingeckoToken(symbol, chainName)

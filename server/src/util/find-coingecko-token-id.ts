import coingeckoTokens from "../../res/coingecko-tokens.json";
import {logger} from "../logger/logger";

export const findCoingeckoToken = (symbol: string, chain: string): { id: string, symbol: string } | undefined => {
    // const isSubtrateChain = substrateChains.chains.some(p => p.name === chain)
    //const platform = isSubtrateChain ? 'polkadot' : chain

    let tokens = coingeckoTokens.filter(p => p.symbol.toLowerCase() === symbol.toLowerCase() && p.id.indexOf('-peg-') == -1)
    if (tokens.length === 0) {
        logger.warn("Coingecko token for symbol " + symbol + " not found", new Error().stack)
        return undefined
    }
    if (tokens.length > 1) {
        logger.warn(`Token ${symbol} is ambiguous in coingecko list. Chain ${chain}`)
    }
    return tokens[0]
}

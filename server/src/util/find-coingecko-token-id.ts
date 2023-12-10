import * as coingeckoTokens from "../../res/coingecko-tokens.json";
import {logger} from "../logger/logger";
import * as substrateChains from "../../res/substrate-chains.json";

export const findCoingeckoTokenId = (symbol: string, chain?: string): string | undefined => {
    return findCoingeckoToken(symbol, chain)?.id
}

export const findCoingeckoToken = (symbol: string, chain: string): { id: string, symbol: string } | undefined => {
    const isSubtrateChain = substrateChains.chains.some(p => p.name === chain)
    const platform = isSubtrateChain ? 'polkadot' : chain

    let tokens = coingeckoTokens.tokens.filter(p => p.symbol.toLowerCase() === symbol.toLowerCase() && p.id.indexOf('-peg-') == -1)
    if (tokens.length > 1) {
        const tokensTemp = tokens.filter(t => platform && t.platforms?.[chain] !== undefined)
        if (tokensTemp.length === 1) {
            tokens = tokensTemp
        }
    }
    if (tokens.length > 1) {
        const tokensTemp = tokens.filter(t => t.platforms !== undefined && Object.keys(t.platforms).length === 0)
        if (tokensTemp.length === 1) {
            tokens = tokensTemp
        }
    }
    if (tokens.length === 0) {
        logger.warn("Coingecko token for symbol " + symbol + " not found", new Error().stack)
        return undefined
    }
    if (tokens.length > 1) {
        logger.warn(`Token ${symbol} is ambiguous in coingecko list. Chain ${chain}`)
    }
    return tokens[0]
}

import coingeckoTokens from "../../res/coingecko-tokens.json";
import substrateChains from "../../res/substrate-chains.json";
import {logger} from "../logger/logger";

const supportsPlatform = (platform, coingeckoToken: { platforms: { [key: string]: string } }) => {
    return (Object.keys(coingeckoToken?.platforms || []))
        .find(key => key === platform.toLowerCase())
}

export const findCoingeckoToken = (symbol: string, chain: string): { id: string, symbol: string } | undefined => {
    const substrateMainToken = substrateChains.chains.find(p => p.token.toLowerCase() === symbol.toLowerCase())
    if (substrateMainToken) {
        const token = coingeckoTokens.find(p => p.id === substrateMainToken.coingeckoId)
        if (token) {
            return token
        }
    }

    const isSubtrateChain = substrateChains.chains.some(p => p.name === chain)
    const platform = isSubtrateChain ? 'polkadot' : chain

    let tokens = coingeckoTokens.filter(p => p.symbol.toLowerCase() === symbol.toLowerCase() && p.id.indexOf('-peg-') == -1)
    if (tokens.length === 0) {
        logger.warn("Coingecko token for symbol " + symbol + " not found", new Error().stack)
        return undefined
    }
    const polkadotTokens = tokens.filter(p => supportsPlatform('polkadot', p))
    const ethTokens = tokens.filter(p => supportsPlatform('ethereum', p))
    const matchingChainTokens = tokens.filter(p => supportsPlatform(platform, p))

    const result = matchingChainTokens.length > 0 ? matchingChainTokens : polkadotTokens.length > 0 ?
        polkadotTokens : ethTokens.length > 0 ? ethTokens : tokens

    if (result.length > 1) {
        logger.warn(`Token ${symbol} is ambiguous in coingecko list. Chain ${chain}`)
    }

    return result[0]
}

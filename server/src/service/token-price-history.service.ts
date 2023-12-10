import {CoingeckoService} from "../coingecko-api/coingecko.service";
import {logger} from "../logger/logger";
import {formatDate} from "../util/format-date";
import {findCoingeckoTokenId} from "../util/find-coingecko-token-id";
import * as fs from 'fs';

export interface Quotes {
    [isoDate:string]: number;
    timestamp: number;
    latest: number;
}

const MAX_AGE = 2 * 60 * 60 * 1000

export class TokenPriceHistoryService {
    private static cachedPrices: { [tokenId: string]: Quotes } = {}
    private static timer

    constructor(private coingeckoService: CoingeckoService) {
    }

    public init() {

        if (!TokenPriceHistoryService.timer) {
            TokenPriceHistoryService.timer = setInterval(() => this.sync(), 20 * 1000)
        }
        this.sync()
    }

    private getTokensToSync() {
        if (fs.existsSync(__dirname + '/../../res/quotes/tokens-to-sync.json')) {
            return JSON.parse(fs.readFileSync(__dirname + '/../../res/quotes/tokens-to-sync.json', 'utf-8'))
        } else {
            return {
                tokens: [
                    "optimism",
                    "ethereum",
                    "velodrome-finance",
                    "wrapped-steth",
                    "weth",
                    "balancer",
                    "usd-coin",
                    "matic-network",
                    "wombat-exchange",
                    "lido-dao",
                    "smooth-love-potion",
                    "sushi",
                    "archi-token",
                    "bridged-usd-coin-optimism",
                    "kyber-network-crystal",
                    "tether",
                    "dai",
                    "usd-coin-ethereum-bridged",
                    "rocket-pool-eth",
                    "bridged-usdc-polygon-pos-bridge",
                    "chainflip",
                    "xcdot",
                    "wrapped-bitcoin",
                    "frax",
                    "moonwell-artemis",
                    "stellaswap",
                    "wrapped-moonbeam",
                    "interlay",
                    "bullperks",
                    "moonbeam",
                    "instadapp-usdc",
                    "picasso",
                    "kintsugi",
                    "kintsugi-btc",
                    "kusama",
                    "beamswap",
                    "interbtc",
                    "acala-dollar-acala",
                    "pha",
                    "voucher-dot",
                    "bifrost-native-coin",
                    "orbit-bridge-klaytn-ethereum",
                    "orbit-bridge-klaytn-usdc",
                    "voucher-glmr",
                    "voucher-ethereum-2-0",
                    "chainlink",
                    "bridged-rocket-pool-eth-manta-pacific",
                    "acala",
                    "polkadot"
                ]
            }
        }
    }

    private async sync() {
        logger.debug('TokenPriceHistoryService syncing')
        const tokensToSync = this.getTokensToSync()
        for (let tokenId of tokensToSync.tokens) {
            try {
                if (!this.informationUpToDate(tokenId)) {
                    await this.fetchQuotesForTokenId(tokenId)
                    logger.info(`TokenPriceHistoryService syncing done for token ${tokenId}`)
                    break;
                }
            } catch (error) {
                if (error.statusCode === 404) {
                    tokensToSync.tokens.splice(tokensToSync.tokens.findIndex(t => t === tokenId), 1)
                }
                logger.error(`Error syncing token ${tokenId}`, error)
                break;
            }
        }
        if (tokensToSync.tokens.every(tokenId => this.informationUpToDate(tokenId))) {
            logger.debug(`TokenPriceHistoryService syncing completed!`)
        }
    }

    private addTokenToSyncList(tokenId: string) {
        const tokensToSync = this.getTokensToSync()
        if (tokensToSync.tokens.indexOf(tokenId) === -1) {
            tokensToSync.tokens.push(tokenId)
            fs.writeFileSync(__dirname + '/../../res/quotes/tokens-to-sync.json', JSON.stringify(tokensToSync), 'utf-8')
        }
    }

    private informationUpToDate(tokenId: string) {
        return (TokenPriceHistoryService.cachedPrices[tokenId] && new Date().getTime() - TokenPriceHistoryService.cachedPrices[tokenId].timestamp < MAX_AGE)
    }

    async getQuotes(symbol: string, chain: string, currency: string = 'usd'): Promise<Quotes> {
        const coingeckoId = findCoingeckoTokenId(symbol, chain)
        if (!coingeckoId) {
            return undefined
        }
        this.addTokenToSyncList(coingeckoId)
        return this.fetchQuotesForTokenId(coingeckoId, currency)
    }

    private async fetchQuotesForTokenId(tokenId: string, currency: string = 'usd') {
        if (this.informationUpToDate(tokenId)) {
            return TokenPriceHistoryService.cachedPrices[tokenId]
        }
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 1)
        minDate.setMonth(0)
        minDate.setDate(1)
        minDate.setHours(0)
        minDate.setMinutes(0)
        minDate.setSeconds(0)
        minDate.setDate(minDate.getDate() - 1)
        const history = await this.coingeckoService.fetchHistoryRange(tokenId, currency, minDate.getTime() / 1000, new Date().getTime() / 1000)
        const quotes: Quotes = { timestamp: new Date().getTime(), latest: undefined }
        let latest = undefined
        history.forEach(entry => {
            if (!latest || entry[0] > latest) {
                latest = entry[0]
                quotes.latest = entry[1]
            }
            quotes[formatDate(new Date(entry[0]))] = entry[1]
        })
        TokenPriceHistoryService.cachedPrices[tokenId] = quotes
        return TokenPriceHistoryService.cachedPrices[tokenId]
    }

}


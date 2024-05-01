import {logger} from "../logger/logger";
import * as fs from 'fs';
import {formatDate} from "../util/format-date";
import {CryptoCompareService} from "../cryptocompare/cryptocompare.api";

export interface Quotes {
    [isoDate:string]: number;
    timestamp: number;
    latest: number;
}

const MAX_AGE = 4 * 60 * 60 * 1000

export class TokenPriceHistoryService {
    private static cachedPrices: { [tokenId: string]: Quotes } = {}
    private static timer

    constructor(private cryptoCompareService: CryptoCompareService) {
    }

    public init() {

        if (!TokenPriceHistoryService.timer) {
            TokenPriceHistoryService.timer = setInterval(() => this.sync(), 60 * 1000)
        }
        this.sync()
    }

    async getQuotes(symbol: string, chain: string, currency: string = 'usd'): Promise<Quotes> {
        symbol = symbol.toLowerCase()
        if (this.synonyms[symbol]) {
            symbol = this.synonyms[symbol]
        }
        const result = this.fetchQuotesForSymbol(symbol, currency)
        this.addTokenToSyncList(symbol)
        return result
    }

    private getTokensToSync() {
        if (fs.existsSync(__dirname + '/../../res/quotes/tokens-to-sync.json')) {
            return JSON.parse(fs.readFileSync(__dirname + '/../../res/quotes/tokens-to-sync.json', 'utf-8'))
        } else {
            return {
                tokens: [
                    "glmr",
                    "intr",
                    "glmr",
                    "kint",
                    "ksm",
                    "pha",
                    "bnc",
                    "link",
                    "aca",
                    "op",
                    "eth",
                    "velo",
                    "bal",
                    "usdc",
                    "matic",
                    "wom",
                    "ldo",
                    "sushi",
                    "usdt",
                    "dai",
                    "dot",
                    "wbtc",
                    "frax",
                    "well"
                ]
            }
        }
    }

    private synonyms = {
        'wglmr': 'glmr',
        'weth': 'eth',
        'wsteth': 'steth',
        'ibtc': 'btc',
        'kbtc': 'btc'
    }

    private async sync() {
        logger.debug('TokenPriceHistoryService syncing')
        const tokensToSync = this.getTokensToSync()
        for (let symbol of tokensToSync.tokens) {
            try {
                if (!TokenPriceHistoryService.cachedPrices[symbol]) {
                    this.fetchStoredQuotes(symbol)
                }
                if (!this.informationUpToDate(symbol)) {
                    await this.fetchQuotesForSymbol(symbol)
                    logger.info(`TokenPriceHistoryService syncing done for token ${symbol}`)
                    break;
                }
            } catch (error) {
                if (error.statusCode === 404) {
                    tokensToSync.tokens.splice(tokensToSync.tokens.findIndex(t => t === symbol), 1)
                }
                logger.error(`Error syncing token ${symbol}`, error)
                continue;
            }
        }
        if (tokensToSync.tokens.every(tokenId => this.informationUpToDate(tokenId))) {
            logger.debug(`TokenPriceHistoryService syncing completed!`)
        }
    }

    private addTokenToSyncList(symbol: string) {

        const tokensToSync = this.getTokensToSync()
        if (tokensToSync.tokens.indexOf(symbol) === -1) {
            tokensToSync.tokens.push(symbol)
            fs.writeFileSync(__dirname + '/../../res/quotes/tokens-to-sync.json', JSON.stringify(tokensToSync), 'utf-8')
        }
    }

    private informationUpToDate(tokenId: string) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1);

        return TokenPriceHistoryService.cachedPrices[tokenId]
            && (TokenPriceHistoryService.cachedPrices[tokenId][formatDate(yesterday)]
            || new Date().getTime() - TokenPriceHistoryService.cachedPrices[tokenId].timestamp < MAX_AGE)
    }


    private async fetchQuotesForSymbol(symbol: string, currency: string = 'usd') {
        if (this.informationUpToDate(symbol)) {
            return TokenPriceHistoryService.cachedPrices[symbol]
        }
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 1)
        minDate.setMonth(0)
        minDate.setDate(1)
        minDate.setHours(0)
        minDate.setMinutes(0)
        minDate.setSeconds(0)
        minDate.setDate(minDate.getDate() - 1)
        const history = await this.cryptoCompareService.fetchHistoryRange(symbol, currency, formatDate(minDate))
        const quotes: Quotes = { timestamp: new Date().getTime(), latest: undefined }
        quotes.latest = history[history.length - 1].close
        history.forEach(entry => {
            quotes[formatDate(new Date(entry.time * 1000))] = entry.close
        })
        this.storeQuotes(symbol, quotes)
        TokenPriceHistoryService.cachedPrices[symbol] = quotes
        return TokenPriceHistoryService.cachedPrices[symbol]
    }

    private storeQuotes(symbol: string, quotes: any) {
        const filename = __dirname + `/../../res/quotes/${symbol.toLowerCase()}.json`
        const existingQuotes = fs.existsSync(filename) ?
            JSON.parse(fs.readFileSync(filename, 'utf-8')) : {}
        const updatedQuotes = {
            ...quotes,
            ...existingQuotes
        }
        fs.writeFileSync(filename, JSON.stringify(updatedQuotes), 'utf-8')
    }

    private fetchStoredQuotes(symbol: string) {
        const filename = __dirname + `/../../res/quotes/${symbol.toLowerCase()}.json`
        if (fs.existsSync(filename)) {
            TokenPriceHistoryService.cachedPrices[symbol] = JSON.parse(fs.readFileSync(filename, 'utf-8'))
        }
    }

}


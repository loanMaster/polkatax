import * as fs from 'fs'
import {fetchQuotesLogger} from "../logger/fetch-quotes-logger";
import {fiatCurrencies} from "../const/fiat-currencies";
import {CoingeckoService} from "../coingecko-api/coingecko.service";
import * as substrateChains from "../../res/substrate-chains.json"

export interface Quotes {
    [key: string]: {
        temporary?: boolean
        [key:string]: number | boolean,
    }
}

const SAFETY_MARGIN = 26 * 60 * 60 * 1000

export class PriceHistoryService {

    constructor(private coingeckoService: CoingeckoService) {
    }

    getQuotes(symbol: string): Quotes {
        const filePath = this.getFilePath(symbol)
        if (!fs.existsSync(filePath)) {
            throw Error("No quotes found for symbol " + symbol)
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }

    private getFilePath(symbol: string) {
        return __dirname + `/../../res/quotes/${symbol.toLowerCase()}-quotes.json`
    }

    public async fetchMissingQuotesForCoin(coinId: string, symbol:string, beginDate: string) {
        const filePath = this.getFilePath(symbol)
        const quotes: Quotes = fs.existsSync(filePath) ?
            JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {}
        const original = { ...quotes }
        const date = new Date(beginDate + 'T00:00:00.000Z')
        let errors = 0
        while (date.getTime() < new Date().getTime()) {
            if (errors >= 100) {
                fetchQuotesLogger.warn("Max number of errors reached. Stopping")
                break
            }
            const isoDate = date.toISOString().substring(0, 10)
            if (quotes[isoDate] === undefined || quotes[isoDate].temporary) {
                fetchQuotesLogger.info(`Processing date ${isoDate}`)
                try {
                    const prices = await this.coingeckoService.fetchHistory(coinId, isoDate)
                    if (prices) {
                        quotes[isoDate] = prices
                    } else {
                        quotes[isoDate] = {}
                        fetchQuotesLogger.info(`Prices is undefined/empty for date ${isoDate}`)
                    }

                    // prices can still change up to 00:30 the following day
                    quotes[isoDate].temporary = new Date().getTime() - date.getTime() < SAFETY_MARGIN ? true : undefined
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    date.setDate(date.getDate() + 1)
                } catch (e) {
                    fetchQuotesLogger.error("Error fetching prices:", e)
                    errors++;
                    await new Promise(r => setTimeout(r, 60000));
                }
            } else {
                date.setDate(date.getDate() + 1)
            }
        }
        if (JSON.stringify(original) !==  JSON.stringify(quotes)) {
            fs.writeFileSync(filePath, JSON.stringify(quotes))
        }
    }

    private store(quotes: Quotes, currency: string, prices: number[][]) {
        const isoDateNow = new Date().toISOString().substring(0, 10)
        prices.forEach(pricePair => {
            const isoDate = new Date(pricePair[0]).toISOString().substring(0, 10)
            if (!quotes[isoDate]) {
                quotes[isoDate] = {}
            }
            quotes[isoDate][currency] = pricePair[1]
            if (isoDate === isoDateNow) {
                quotes[isoDate].temporary = true
            }
        })
    }

    async runInitialSyncForChain(tokenId: string, token: string) {
        const quotes = {}
        for (let index = 0; index < fiatCurrencies.length; index++) {
            const currency = fiatCurrencies[index].toLowerCase()
            fetchQuotesLogger.info(`Fetching quotes for ${currency}`)
            const startDate = new Date('2022-01-01')
            startDate.setMilliseconds(0)
            startDate.setMinutes(0)
            startDate.setHours(0)
            try {
                const prices = await this.coingeckoService.fetchHistoryRange(tokenId, currency, startDate.getTime()/1000, new Date().getTime()/1000)
                this.store(quotes, currency, prices)
            } catch (error) {
                fetchQuotesLogger.error(error)
                fetchQuotesLogger.warn("Error fetching history from coingecko. Retry in some seconds...")
                index--
                await new Promise(r => setTimeout(r, 40000));
            }
            await new Promise(r => setTimeout(r, 20000)); // avoid too many request error
        }
        const filePath = this.getFilePath(token)
        fs.writeFileSync(filePath, JSON.stringify(quotes))
    }

    async runInitialSync() {
        for (let chain of substrateChains.chains) {
            if (!fs.existsSync(this.getFilePath(chain.token))) {
                fetchQuotesLogger.info(`Fetching quotes for ${chain.name} / ${chain.token}`)
                await this.runInitialSyncForChain(chain.coingeckoId, chain.token)
            }
        }
    }

}




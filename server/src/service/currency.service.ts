import {logger} from "../logger/logger";
import {PriceHistoryService} from "./price-history.service";

export interface PriceDateAmount {
    date: number;
    block: number;
    amount: number;
    value?: number;
    price?: number;
}

export class CurrencyService {

    constructor(private priceHistoryService: PriceHistoryService) {
    }

    async addFiatValues(values: { block_timestamp: number, amount: number, block_num: number }[], fromSymbol: string, toSymbol: string, currentPrice: number): Promise<PriceDateAmount[]> {
        const quotes = this.priceHistoryService.getQuotes(fromSymbol)
        const currentIsoDate = new Date().toISOString().substring(0, 10)

        const result: PriceDateAmount[] = values.map(v => ({
            date: v.block_timestamp,
            block: v.block_num,
            amount: v.amount
        }))
        for (let d of result) {
            const isoDate = new Date(d.date * 1000).toISOString().substring(0, 10)
            if (isoDate === currentIsoDate) {
                d.price = currentPrice
                d.value = d.amount * currentPrice
            } else if (quotes[isoDate] && quotes[isoDate][toSymbol] !== undefined) {
                d.price = quotes[isoDate][toSymbol] as number
                d.value = d.amount * d.price
            } else if (isoDate !== currentIsoDate) {
                logger.warn(`No quote found for ${fromSymbol} for date ${isoDate}`)
            }
        }
        return result
    }

}

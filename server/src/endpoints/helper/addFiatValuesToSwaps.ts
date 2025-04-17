import { logger } from "../../common/logger/logger"
import { Swap } from "../../common/model/swap"
import { formatDate } from "../../common/util/format-date"
import { CurrencyQuotes } from "../../crypto-currency-prices/model/crypto-currency-quotes"

export const addFiatValuesToSwaps = (swaps: Swap[], quotes: { [token: string]: CurrencyQuotes }): Swap[] => {
    for (let idx = 0; idx < swaps.length; idx++) {
        const swap = swaps[idx]
        const currentIsoDate = formatDate(new Date())
        const isoDate = formatDate(new Date(swap.date * 1000))
        for (const token of Object.keys(swap.tokens)) {
            const tokenQuotes = quotes[token]
            if (isoDate === currentIsoDate) {
                swap.tokens[token].price = tokenQuotes?.quotes?.latest
                swap.tokens[token].value = swap.tokens[token].amount * swap.tokens[token].price
            } else if (tokenQuotes?.quotes[isoDate]) {
                swap.tokens[token].price = tokenQuotes.quotes[isoDate]
                swap.tokens[token].value = swap.tokens[token].amount * swap.tokens[token].price
            } else if (isoDate !== currentIsoDate && tokenQuotes) {
                logger.warn(`No quote found for ${token} for date ${isoDate}`)
            }
        }
    }
    return swaps
}
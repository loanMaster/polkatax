import { logger } from "../../common/logger/logger"
import { TokenTransfers } from "../../common/model/token-transfer"
import { Transfer } from "../../common/model/transfer"
import { CurrencyQuotes } from "../../crypto-currency-prices/model/crypto-currency-quotes"
import { addFiatValuesToTransfers } from "./addFiatValuesToTransfers"

export const addFiatValuesToNestedTransfers = (transfers: TokenTransfers, quotes: { [token: string]: CurrencyQuotes }): { [symbol: string]: { values: Transfer[], currentPrice: number } } => {
    const listOfTransfers: { [symbol: string]: { values: Transfer[], currentPrice: number } } = {}
    for (let token of Object.keys(transfers)) {
        const transfersOfToken = transfers[token]
        if (!quotes[token]) {
            logger.warn(`No quotes for ${token} found.`)
            listOfTransfers[token] = {values: transfersOfToken, currentPrice: undefined}
        } else {
            listOfTransfers[token] = {
                values: addFiatValuesToTransfers(transfersOfToken, quotes[token]),
                currentPrice: quotes[token].quotes.latest
            }
        }
    }
    return listOfTransfers;
}
import { fetchSwapsAndPayments } from "../../blockchain/evm/fetch-evm-transfers"
import { DotTransferService } from "../../blockchain/substrate/services/dot-transfer.service"
import { HttpError } from "../../common/error/HttpError"
import { Swap } from "../../common/model/swap"
import { Transfer } from "../../common/model/transfer"
import { coingeckoSupportsToken } from "../../common/util/coingecko-supports-token"
import { validateDates } from "../../common/util/validate-dates"
import { addFiatValuesToNestedTransfers } from "../helper/addFiatValuesToNestedTransfers"
import { addFiatValuesToSwaps } from "../helper/addFiatValuesToSwaps"
import * as subscanChains from "../../../res/gen/subscan-chains.json";
import { TokenPriceConversionService } from "./token-price-conversion.service"
import { PaymentsRequest } from "../model/payments.request"
import {PaymentsResponse} from "../model/payments.response";
import { evmChainConfigs } from "../../blockchain/evm/evm-chains.config"

export class PaymentsService {
    constructor(private dotTransferService: DotTransferService, 
        private tokenPriceConversionService: TokenPriceConversionService) {
    }

    getTokens(swaps: Swap[]): string[] {
        const tokens = []
        swaps.forEach(s => {
            Object.keys(s.tokens).forEach(t => {
                if (tokens.indexOf(t) === -1) {
                    tokens.push(t)
                }
            })
        })
        return tokens
    }
    
    async processTask(paymentsRequest: PaymentsRequest): Promise<PaymentsResponse> {
        let { startDay, endDay, chainName, address, currency } = paymentsRequest
    
        validateDates(startDay, endDay)
        endDay = endDay && endDay < new Date() ? endDay : new Date()
        if (!evmChainConfigs[chainName.toLocaleLowerCase()] && !subscanChains.chains.find(p => p.label.toLowerCase() === chainName.toLowerCase())) {
            throw new HttpError(400, "Chain " + chainName + " not found")
        }
    
        const evmChainConfig = evmChainConfigs[chainName.toLocaleLowerCase()]
        const {swaps, payments} = evmChainConfig ? await fetchSwapsAndPayments(chainName, address, startDay, endDay) :
            await this.dotTransferService.fetchSwapsAndTransfers(chainName, address, startDay, endDay)
    
        const tokens = this.getTokens(swaps)
        tokens.push(...Object.keys(payments))
        const supportedTokens = Array.from(new Set(tokens.filter(symbol => coingeckoSupportsToken(symbol, chainName))))
    
        const quotes = await this.tokenPriceConversionService.fetchQuotesForTokens(supportedTokens, chainName, currency)
    
        const listOfTransfers: { [symbol: string]: { values: Transfer[], currentPrice: number } } = addFiatValuesToNestedTransfers(payments, quotes);
    
        const currentPrices = {};
        Object.keys(quotes).forEach(token => (currentPrices[token] = quotes[token].quotes.latest))
        const swapsExtended = addFiatValuesToSwaps(swaps, quotes)
        return { currentPrices, swaps: swapsExtended, transfers: listOfTransfers}
    }
}
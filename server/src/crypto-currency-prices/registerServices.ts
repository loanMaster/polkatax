import { asClass, AwilixContainer, Lifetime } from "awilix"
import { CryptoCurrencyPricesFacade } from "./crypto-currency-prices.facade"
import { TokenPriceHistoryService } from "./services/token-price-history.service"
import { TokenPriceService } from "./services/token-price.service"
import { CoingeckoRestService } from "./coingecko-api/coingecko.rest-service"

export const registerServices = (container: AwilixContainer) => {
    container.register({
        coingeckoRestService: asClass(CoingeckoRestService, { lifetime: Lifetime.SINGLETON }),
        cryptoCurrencyPricesFacade: asClass(CryptoCurrencyPricesFacade, { lifetime: Lifetime.SINGLETON }),
        tokenPriceHistoryService: asClass(TokenPriceHistoryService, { lifetime: Lifetime.SINGLETON }),
        tokenPriceService: asClass(TokenPriceService, { lifetime: Lifetime.SINGLETON })
    })
}
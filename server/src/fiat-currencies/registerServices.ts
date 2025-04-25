import { asClass, AwilixContainer, Lifetime } from "awilix"
import { ExchangeRateRestService } from "./exchange-rate-api/exchange-rate.rest-service"
import { FiatExchangeRateService } from "./fiat-exchange-rate.service"

export const registerServices = (container: AwilixContainer) => {
    container.register({
        exchangeRateRestService: asClass(ExchangeRateRestService, { lifetime: Lifetime.SINGLETON }),
        fiatExchangeRateService: asClass(FiatExchangeRateService, { lifetime: Lifetime.SINGLETON }),
    })
}
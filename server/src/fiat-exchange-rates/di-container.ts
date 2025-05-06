import {
  asClass,
  AwilixContainer,
  Lifetime,
  InjectionMode,
  createContainer,
} from "awilix";
import { ExchangeRateRestService } from "./exchange-rate-api/exchange-rate.rest-service";
import { FiatExchangeRateService } from "./service/fiat-exchange-rate.service";

export const DIContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
}).register({
  exchangeRateRestService: asClass(ExchangeRateRestService, {
    lifetime: Lifetime.SINGLETON,
  }),
  fiatExchangeRateService: asClass(FiatExchangeRateService, {
    lifetime: Lifetime.SINGLETON,
  }),
});

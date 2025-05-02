import { asClass, Lifetime, InjectionMode, createContainer } from "awilix";
import { TokenPriceHistoryService } from "./services/token-price-history.service";
import { TokenPriceService } from "./services/token-price.service";
import { CoingeckoRestService } from "./coingecko-api/coingecko.rest-service";

export const DIContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
}).register({
  coingeckoRestService: asClass(CoingeckoRestService, {
    lifetime: Lifetime.SINGLETON,
  }),
  tokenPriceHistoryService: asClass(TokenPriceHistoryService, {
    lifetime: Lifetime.SINGLETON,
  }),
  tokenPriceService: asClass(TokenPriceService, {
    lifetime: Lifetime.SINGLETON,
  }),
});

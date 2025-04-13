import {
    InjectionMode,
    createContainer
  } from "awilix";
import { registerServices as registerFiatCurrencyServices } from "./fiat-currencies/registerServices";
import { registerServices as registerBlockchainServices } from "./blockchain/registerServices";
import { registerServices as registerCryptoCurrencyPricesServices } from "./crypto-currency-prices/registerServices";
import { registerServices as registerEndpointServices } from "./endpoints/registerServices";

export const DIContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
})

registerFiatCurrencyServices(DIContainer);
registerBlockchainServices(DIContainer);
registerCryptoCurrencyPricesServices(DIContainer);
registerEndpointServices(DIContainer);
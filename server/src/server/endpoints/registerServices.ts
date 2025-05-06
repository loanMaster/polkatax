import { asClass, AwilixContainer } from "awilix";
import { StakingRewardsWithFiatService } from "./services/staking-rewards-with-fiat.service";
import { PaymentsService } from "./services/payments.service";
import { TokenPriceConversionService } from "./services/token-price-conversion.service";
import { CryptoCurrencyPricesService } from "./services/crypto-currency-prices.service";
import { FiatExchangeRateService } from "./services/fiat-exchange-rate.service";

export const registerServices = (container: AwilixContainer) => {
  container.register({
    stakingRewardsWithFiatService: asClass(StakingRewardsWithFiatService),
    cryptoCurrencyPricesService: asClass(CryptoCurrencyPricesService),
    fiatExchangeRateService: asClass(FiatExchangeRateService),
    tokenPriceConversionService: asClass(TokenPriceConversionService),
    paymentsService: asClass(PaymentsService),
  });
};

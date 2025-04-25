import { asClass, AwilixContainer } from "awilix"
import { StakingRewardsWithFiatService } from "./services/staking-rewards-with-fiat.service"
import { PaymentsService } from "./services/payments.service"
import { TokenPriceConversionService } from "./services/token-price-conversion.service"

export const registerServices = (container: AwilixContainer) => {
    container.register({
        stakingRewardsWithFiatService: asClass(StakingRewardsWithFiatService),
        tokenPriceConversionService: asClass(TokenPriceConversionService),
        paymentsService: asClass(PaymentsService)
    })
}
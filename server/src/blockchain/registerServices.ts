import { asClass, AwilixContainer } from "awilix"
import { BlockTimeService } from "./substrate/services/block-time.service"
import { DotTransferService } from "./substrate/services/dot-transfer.service"
import { StakingRewardsService } from "./substrate/services/staking-rewards.service"
import { SubscanApi } from "./substrate/api/subscan.api"
import { SubscanService } from "./substrate/api/subscan.service"

export const registerServices = (container: AwilixContainer) => {
    container.register({
        subscanService: asClass(SubscanService),
        subscanApi: asClass(SubscanApi),
        blockTimeService: asClass(BlockTimeService),
        dotTransferService: asClass(DotTransferService),
        stakingRewardsService: asClass(StakingRewardsService),
    })
}
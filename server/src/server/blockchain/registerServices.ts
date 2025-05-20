import { asClass, AwilixContainer } from "awilix";
import { BlockTimeService } from "./substrate/services/block-time.service";
import { SwapsAndTransfersService } from "./substrate/services/swaps-and-transfers.service";
import { StakingRewardsService } from "./substrate/services/staking-rewards.service";
import { SubscanApi } from "./substrate/api/subscan.api";
import { SubscanService } from "./substrate/api/subscan.service";
import { EvmTxService } from "./evm/service/evm-tx.service";
import { EvmSwapsAndPaymentsService } from "./evm/service/evm-swaps-and-payments.service";
import { StakingRewardsViaEventsService } from "./substrate/services/staking-rewards-via-events.service";

export const registerServices = (container: AwilixContainer) => {
  container.register({
    subscanService: asClass(SubscanService),
    subscanApi: asClass(SubscanApi),
    blockTimeService: asClass(BlockTimeService),
    swapsAndTransfersService: asClass(SwapsAndTransfersService),
    stakingRewardsService: asClass(StakingRewardsService),
    evmSwapsAndPaymentsService: asClass(EvmSwapsAndPaymentsService),
    evmTxService: asClass(EvmTxService),
    stakingRewardsViaEventsService: asClass(StakingRewardsViaEventsService),
  });
};

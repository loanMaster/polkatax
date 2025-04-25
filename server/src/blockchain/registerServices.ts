import { asClass, AwilixContainer } from "awilix"
import { BlockTimeService } from "./substrate/services/block-time.service"
import { SwapsAndTransfersService } from "./substrate/services/swaps-and-transfers.service"
import { StakingRewardsService } from "./substrate/services/staking-rewards.service"
import { SubscanApi } from "./substrate/api/subscan.api"
import { SubscanService } from "./substrate/api/subscan.service"
import { TransferClassifier } from "./substrate/util/transfer-classifier"
import { TransferMerger } from "./substrate/util/transfer-merger"
import { ChainAdjustments } from "./substrate/util/chain-adjustments"
import { EvmTxService } from "./evm/service/evm-tx.service"
import { EvmSwapsAndPaymentsService } from "./evm/service/evm-swaps-and-payments.service"

export const registerServices = (container: AwilixContainer) => {
    container.register({
        chainAdjustments: asClass(ChainAdjustments),
        transferClassifier: asClass(TransferClassifier),
        transferMerger: asClass(TransferMerger),
        subscanService: asClass(SubscanService),
        subscanApi: asClass(SubscanApi),
        blockTimeService: asClass(BlockTimeService),
        swapsAndTransfersService: asClass(SwapsAndTransfersService),
        stakingRewardsService: asClass(StakingRewardsService),
        evmSwapsAndPaymentsService: asClass(EvmSwapsAndPaymentsService),
        evmTxService: asClass(EvmTxService)
    })
}
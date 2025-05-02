import { evmChainConfigs } from "../constants/evm-chains.config";
import { extractSwaps } from "../util/extract-swaps";
import { extractPayments } from "../util/extract-payments";
import { EvmTxService } from "./evm-tx.service";
import { logger } from "../../../../common/logger/logger";
import { Swap } from "../../../../model/swap";
import { TokenTransfers } from "../../../../model/token-transfer";

export class EvmSwapsAndPaymentsService {
  constructor(private evmTxService: EvmTxService) {}

  async fetchSwapsAndPayments(
    network = "moonbeam",
    address: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ swaps: Swap[]; payments: TokenTransfers }> {
    logger.info(`Enter fetchSwapsAndPayments for ${network}`);
    const config = evmChainConfigs[network];
    const nativeToken = config.nativeToken;
    const walletAdr = address.toLowerCase();
    const { tx, transfers } = await this.evmTxService.fetchTxAndTransfers(
      network,
      address,
      startDate,
      endDate,
    );
    logger.info(`Exit fetchSwapsAndPayments for ${network}`);
    return {
      swaps: extractSwaps(tx, transfers, walletAdr, nativeToken),
      payments: extractPayments(tx, transfers, walletAdr, nativeToken),
    };
  }
}

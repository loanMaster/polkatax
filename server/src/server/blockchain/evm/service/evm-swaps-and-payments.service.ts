import { evmChainConfigs } from "../constants/evm-chains.config";
import { EvmTxService } from "./evm-tx.service";
import { logger } from "../../../logger/logger";
import { EVMTransfer, EVMTx } from "../model/transfers";

export class EvmSwapsAndPaymentsService {
  constructor(private evmTxService: EvmTxService) {}

  async fetchSwapsAndPayments(
    network = "moonbeam",
    address: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ transactions: EVMTx[]; transfersList: EVMTransfer[] }> {
    logger.info(`Enter fetchSwapsAndPayments for ${network}`);
    const config = evmChainConfigs[network];
    //const nativeToken = config.nativeToken;
    //onst walletAdr = address.toLowerCase();
    const { tx, transfers } = await this.evmTxService.fetchTxAndTransfers(
      network,
      address,
      startDate,
      endDate,
    );
    logger.info(`Exit fetchSwapsAndPayments for ${network}`);
    return { transactions: tx, transfersList: transfers};
  }
}

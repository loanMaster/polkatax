import { EvmTxService } from "./evm-tx.service";
import { logger } from "../../../logger/logger";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { Transaction } from "../../substrate/model/transaction";
import { TransferDto } from "../../substrate/model/raw-transfer";

export class EvmSwapsAndPaymentsService {
  constructor(private evmTxService: EvmTxService) {}

  private mapEvmTransferToTransferDto(evmTransfer: EVMTransfer): TransferDto {
    return {
      symbol: evmTransfer.tokenSymbol,
      contract: "TODO", // #TODO
      asset_unique_id: "TODO", // #TODO
      amount: Number(evmTransfer.value),
      from: evmTransfer.from,
      to: evmTransfer.to,
      block: Number(evmTransfer.blockNumber),
      block_timestamp: Number(evmTransfer.timeStamp),
      hash: evmTransfer.hash
    }
  }

  private mapEvmTxToTransaction(tx: EVMTx): Transaction {
    return {
      hash: tx.hash,
      account: tx.from,
      block_timestamp: Number(tx.timeStamp),
      block_num: Number(tx.blockNumber),
      functionName: tx.functionName,
      value: Number(tx.value)
    }
  }

  async fetchSwapsAndPayments(
    network = "moonbeam",
    address: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ transactions: Transaction[]; transfersList: TransferDto[] }> {
    logger.info(`Enter fetchSwapsAndPayments for ${network}`);
    const { tx, transfers } = await this.evmTxService.fetchTxAndTransfers(
      network,
      address,
      startDate,
      endDate,
    );
    logger.info(`Exit fetchSwapsAndPayments for ${network}`);
    return { 
      transactions: tx.map(tx => this.mapEvmTxToTransaction(tx)), 
      transfersList: transfers.map(t => this.mapEvmTransferToTransferDto(t))
    };
  }
}

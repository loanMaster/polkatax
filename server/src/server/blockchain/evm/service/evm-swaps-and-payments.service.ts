import { EvmTxService } from "./evm-tx.service";
import { logger } from "../../../logger/logger";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { Transaction } from "../../substrate/model/transaction";
import { Transfer } from "../../substrate/model/raw-transfer";

export class EvmSwapsAndPaymentsService {
  constructor(private evmTxService: EvmTxService) {}

  private mapEvmTransferToTransferDto(evmTransfer: EVMTransfer): Transfer {
    return {
      symbol: evmTransfer.tokenSymbol,
      contract: "TODO", // #TODO
      asset_unique_id: "TODO", // #TODO
      amount: Number(evmTransfer.value),
      from: evmTransfer.from,
      to: evmTransfer.to,
      block: Number(evmTransfer.blockNumber),
      timestamp: Number(evmTransfer.timeStamp),
      hash: evmTransfer.hash
    }
  }

  private mapEvmTxToTransaction(tx: EVMTx): Transaction {
    return {
      hash: tx.hash,
      account: tx.from,
      timestamp: Number(tx.timeStamp),
      block: Number(tx.blockNumber),
      functionName: tx.functionName,
      amount: Number(tx.value)
    }
  }

  async fetchSwapsAndPayments(data: {
    chainName,
    address: string,
    startDay: Date,
    endDay?: Date,
  }): Promise<{ transactions: Transaction[]; transfersList: Transfer[] }> {
    logger.info(`Enter fetchSwapsAndPayments for ${data.chainName}`);
    const { tx, transfers } = await this.evmTxService.fetchTxAndTransfers(
      data.chainName,
      data.address,
      data.startDay,
      data.endDay,
    );
    logger.info(`Exit fetchSwapsAndPayments for ${data.chainName}`);
    return { 
      transactions: tx.map(tx => this.mapEvmTxToTransaction(tx)), 
      transfersList: transfers.map(t => this.mapEvmTransferToTransferDto(t))
    };
  }
}

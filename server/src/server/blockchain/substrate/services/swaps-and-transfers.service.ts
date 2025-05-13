import dotenv from "dotenv";
import { SubscanService } from "../api/subscan.service";
import { BlockTimeService } from "./block-time.service";
import { Transaction } from "../model/transaction";
import { logger } from "../../../logger/logger";
import { TokenTransfers } from "../../../../model/token-transfer";
import { hasChainEvmSupport } from "../util/has-chain-evm-support";
import { TransferDto } from "../model/raw-transfer";

dotenv.config({ path: __dirname + "/../.env" });

export class SwapsAndTransfersService {
  constructor(
    private blockTimeService: BlockTimeService,
    private subscanService: SubscanService
  ) {}

  private async fetchTxAndTransfers(
    chainName: string,
    address: string,
    blockMin: number,
    blockMax: number,
    evm = false,
  ): Promise<{ transactions: Transaction[]; transfersList: TransferDto[] }> {
    /*const accounts = await this.subscanService.fetchAccounts(
      address,
      chainName,
    );
    const isMyAccount = (addressToTest: string) =>
      address.toLowerCase() === addressToTest.toLowerCase() ||
      accounts.indexOf(addressToTest.toLowerCase()) > -1;*/

    const transactions = await this.subscanService.fetchAllTx(
      chainName,
      address,
      blockMin,
      blockMax,
      evm,
    );
    const transfersList = await this.subscanService.fetchAllTransfers(
      chainName,
      address,
      blockMin,
      blockMax,
      evm,
    );
    return { transactions, transfersList };
  }

  private async resolveAddresses(chainName: string, address: string) {
    const isEvm = address.length <= 42;
    const evmAddress = isEvm ? address : undefined;
    const substrateAddress = isEvm
      ? await this.subscanService.mapToSubstrateAccount(chainName, address)
      : address;
    return { substrateAddress, evmAddress };
  }

  private async loadAllTransfers(
    chainName: string,
    substrateAddress: string,
    evmAddress: string | undefined,
    blockMin: number,
    blockMax: number,
  ): Promise<{ transactions: Transaction[]; transfersList: TransferDto[] }> {
    let { transactions, transfersList } = substrateAddress
      ? await this.fetchTxAndTransfers(
          chainName,
          substrateAddress,
          blockMin,
          blockMax,
          false,
        )
      : { transactions: [], transfersList: [] };

    if (evmAddress && hasChainEvmSupport(chainName)) {
      const evmData = await this.fetchTxAndTransfers(
        chainName,
        evmAddress,
        blockMin,
        blockMax,
        true,
      );
      transfersList.concat(evmData.transfersList)
      transactions = transactions.concat(evmData.transactions);
    }
    return { transactions, transfersList };
  }

  private filterByDate<T extends { block_timestamp?: number }>(
    items: T[],
    minDate: Date,
    maxDate?: Date,
  ) {
    const timestamp = (d: number) => d * 1000;
    const filterFn = (item: T) =>
      timestamp(item.block_timestamp) >= minDate.getTime() &&
      (!maxDate || timestamp(item.block_timestamp) <= maxDate.getTime());

    return items.filter(filterFn);
  }

  private filterEmptyTokens(payments: TokenTransfers): TokenTransfers {
    const result: TokenTransfers = {};
    for (const token of Object.keys(payments)) {
      if (payments[token].length > 0) {
        result[token] = payments[token];
      }
    }
    return result;
  }

  async fetchSwapsAndTransfers(
    chainName: string,
    address: string,
    minDate: Date,
    maxDate?: Date,
  ): Promise<{ transactions: Transaction[]; transfersList: TransferDto[] }> {
    logger.info(`Enter fetchSwapsAndTransfers for ${chainName}`);

    const { substrateAddress, evmAddress } = await this.resolveAddresses(
      chainName,
      address,
    );
    const { blockMin, blockMax } = await this.blockTimeService.getMinMaxBlock(
      chainName,
      minDate.getTime(),
      maxDate?.getTime(),
    );

    let { transactions, transfersList } = await this.loadAllTransfers(
      chainName,
      substrateAddress,
      evmAddress,
      blockMin,
      blockMax,
    );

    transactions = this.filterByDate(transactions, minDate, maxDate)
    const transfersListMapped = this.filterByDate(transfersList, minDate, maxDate)

    logger.info(`Exit fetchSwapsAndTransfers for ${chainName}`);
    return { transactions, transfersList: transfersListMapped };
  }
}

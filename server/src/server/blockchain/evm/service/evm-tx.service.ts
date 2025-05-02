import fetch from "node-fetch";
import { HttpError } from "../../../../common/error/HttpError";
import { evmChainConfigs } from "../constants/evm-chains.config";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { getNearestBlock } from "../util/get-nearest-block";
import { isToday } from "../../../../common/util/date-utils";

export class EvmTxService {
  private async getBlockRange(
    endpoint: string,
    apiKey: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<[number, number | undefined]> {
    const endBlockPromise =
      !endDate || isToday(endDate)
        ? Promise.resolve(undefined)
        : getNearestBlock(endpoint, apiKey, endDate, "after");
    const [startBlock, endBlock] = await Promise.all([
      getNearestBlock(endpoint, apiKey, startDate, "before"),
      endBlockPromise,
    ]);

    if (isNaN(startBlock) || (endBlock !== undefined && isNaN(endBlock))) {
      throw new HttpError(
        400,
        "No matching block number found for start or end date. Please verify input dates.",
      );
    }

    return [startBlock, endBlock];
  }

  private async fetchData(url: string): Promise<any> {
    const response = await fetch(url);
    const data = await response.json();
    if (data.result && typeof data.result === "string") {
      throw new HttpError(500, data.result);
    }
    return data.result;
  }

  async fetchTxAndTransfers(
    network = "moonbeam",
    address: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ tx: EVMTx[]; transfers: EVMTransfer[] }> {
    const { endpoint, apiKey } = evmChainConfigs[network];
    const [startBlock, endBlock] = await this.getBlockRange(
      endpoint,
      apiKey,
      startDate,
      endDate,
    );
    const walletAdr = address.toLowerCase();

    const endBlockQuery = endBlock ? `&endblock=${endBlock}` : "";
    const [transfers, transactions, internalTransactions] = await Promise.all([
      this.fetchData(
        `${endpoint}?module=account&action=tokentx&address=${walletAdr}&startblock=${startBlock}${endBlockQuery}&page=1&offset=0&sort=desc&sort=desc&apikey=${apiKey}`,
      ),
      this.fetchData(
        `${endpoint}?module=account&action=txlist&address=${walletAdr}&startblock=${startBlock}${endBlockQuery}&page=1&offset=0&sort=desc&apikey=${apiKey}`,
      ),
      this.fetchData(
        `${endpoint}?module=account&action=txlistinternal&address=${walletAdr}&startblock=${startBlock}${endBlockQuery}&page=1&offset=0&sort=desc&apikey=${apiKey}`,
      ),
    ]);

    const allTx = [...transactions, ...internalTransactions]
      .filter(
        (tx) =>
          Number(tx.timeStamp) >= startDate.getTime() / 1000 &&
          Number(tx.timeStamp) <= endDate.getTime() / 1000,
      )
      .filter(
        (tx) =>
          tx.isError === "0" &&
          (tx.txreceipt_status === undefined || tx.txreceipt_status === "1"),
      );

    return { tx: allTx, transfers };
  }
}

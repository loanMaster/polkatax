import { Transfer, Transfers } from "../../blockchain/substrate/model/transfer";
import { Transaction } from "../../blockchain/substrate/model/transaction";
import { TokenTransfers } from "../../../model/token-transfer";
import { processFunctionName } from "../../../common/util/process-function-name";
import { Swap } from "../../../model/swap";
import { TransferMerger } from "./transfer-merger";
import { TransferDto } from "../../blockchain/substrate/model/raw-transfer";

export class TransferClassifier {
  constructor(private transferMerger: TransferMerger) {}

  private isSwap(transfer: Transfer): boolean {
    const received = Object.values(transfer).some((v) => v.amount > 0);
    const sent = Object.values(transfer).some((v) => v.amount < 0);
    return received && sent;
  }

  extractSwapsAndPayments(transfactions: Transaction[], transfers: TransferDto[], address: string, aliases: string[]): { payments: TokenTransfers, swaps: Swap[] } {
    const tranfersObj = this.transferMerger.mergeTranferListToObject(transfers, address, aliases);
    const payments = this.extractPayments(transfactions, tranfersObj)
    const swaps = this.extractSwaps(transfactions, tranfersObj)
    return { payments, swaps }
  }

  extractPayments(
    transactions: Transaction[],
    transfers: Transfers,
  ): TokenTransfers {
    const result: TokenTransfers = {};
    Object.entries(transfers).forEach(([hash, transfer]) => {
      if (!this.isSwap(transfer)) {
        Object.entries(transfer).forEach(([token, data]) => {
          const tx = transactions.find((tx) => tx.hash === hash);
          const tokenLower = token.toLowerCase();
          if (data.amount !== 0) {
            result[tokenLower] ??= [];
            result[tokenLower].push({
              hash,
              from: data.from,
              to: data.to,
              block: data.block,
              date: data.timestamp,
              amount: data.amount,
              functionName: processFunctionName(
                tx?.functionName || data.functionName,
              ),
            });
          }
        });
      }
    });
    return result;
  }

  extractSwaps(transactions: Transaction[], transfers: Transfers): Swap[] {
    const swaps: Swap[] = [];
    Object.entries(transfers).forEach(([hash, transfer]) => {
      if (this.isSwap(transfer)) {
        const tx = transactions.find((tx) => tx.hash === hash);
        const base = {
          hash,
          block: tx?.block_num,
          date: tx?.block_timestamp,
          functionName: "",
          contract: tx?.callModule,
          tokens: {},
        };

        Object.entries(transfer).forEach(([token, data]) => {
          base.block = base.block ?? data.block;
          base.date = base.date ?? data.timestamp;
          base.functionName ||= processFunctionName(data.functionName);
          const tokenLower = token.toLowerCase();
          if (data.amount !== 0) {
            base.tokens[tokenLower] = {
              amount: Math.abs(data.amount),
              type: data.amount > 0 ? "buy" : "sell",
            };
          }
          if (data.amount > 0 && !base.contract) {
            base.contract = tx?.callModule || "";
          }
        });
        swaps.push(base as Swap);
      }
    });
    return swaps;
  }
}

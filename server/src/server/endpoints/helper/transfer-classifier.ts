import { Transaction } from "../../blockchain/substrate/model/transaction";
import { processFunctionName } from "../../../common/util/process-function-name";
import { Swap } from "../model/swap";
import { MergedTransfers, TransferMerger } from "./transfer-merger";
import { Transfer } from "../../blockchain/substrate/model/raw-transfer";
import { Payment } from "../model/payment";

export class TransferClassifier {
  constructor(private transferMerger: TransferMerger) {}

  private isSwap(transfer:{ [token: string]: { amount: number } }): boolean {
    const received = Object.values(transfer).some((v) => v.amount > 0);
    const sent = Object.values(transfer).some((v) => v.amount < 0);
    return received && sent;
  }

  extractSwapsAndPayments(transfactions: Transaction[], transfers: Transfer[], address: string, aliases: string[]): { payments: { [token: string]: Payment[] }, swaps: Swap[] } {
    const tranfersObj: MergedTransfers = this.transferMerger.mergeTranferListToObject(transfers, address, aliases);
    const payments = this.extractPayments(transfactions, tranfersObj)
    const swaps = this.extractSwaps(transfactions, tranfersObj)
    return { payments, swaps }
  }

  extractPayments(
    transactions: Transaction[],
    transfers: MergedTransfers,
  ): { [token: string]: Payment[] } {
    const result: { [token: string]: Payment[] } = {};
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
              label: processFunctionName(
                tx?.functionName || data.label,
              ),
            });
          }
        });
      }
    });
    return result;
  }

  extractSwaps(transactions: Transaction[], transfers: MergedTransfers): Swap[] {
    const swaps: Swap[] = [];
    Object.entries(transfers).forEach(([hash, transfer]) => {
      if (this.isSwap(transfer)) {
        const tx = transactions.find((tx) => tx.hash === hash);
        const base = {
          hash,
          block: tx?.block,
          date: tx?.timestamp,
          functionName: "",
          contract: tx?.callModule,
          tokens: {},
        };

        Object.entries(transfer).forEach(([token, data]) => {
          base.block = base.block ?? data.block;
          base.date = base.date ?? data.timestamp;
          base.functionName ||= processFunctionName(data.label);
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

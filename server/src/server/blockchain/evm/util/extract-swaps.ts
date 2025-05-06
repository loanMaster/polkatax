import BigNumber from "bignumber.js";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { isSwap } from "./is-swap";
import { mergeTransfersOfSameTx } from "./merge-transfers-of-same-tx";
import { normalizeTokenName } from "./normalize-token-name";
import { processFunctionName } from "../../../../common/util/process-function-name";
import { Swap } from "../../../../model/swap";

export const extractSwaps = (
  transactions: EVMTx[],
  transfers: EVMTransfer[],
  walletAddress: string,
  nativeToken: string,
): Swap[] => {
  const transfersObj = mergeTransfersOfSameTx(transfers, walletAddress);
  const swaps: Swap[] = [];
  const txHashes = Array.from(new Set(transactions.map((tx) => tx.hash)));

  txHashes.forEach((hash) => {
    const transfer = transfersObj[hash];
    const matchingTx = transactions.filter((t) => t.hash === hash);
    const tx =
      matchingTx.length > 0
        ? matchingTx[0]
        : { blockNumber: 0, timeStamp: 0, to: "", functionName: "" };

    if (transfer) {
      matchingTx
        .filter((t) => Number(t.value) !== 0)
        .forEach((t) => {
          transfer.tokens[nativeToken] =
            transfer.tokens[nativeToken] === undefined
              ? 0
              : transfer.tokens[nativeToken];
          transfer.tokens[nativeToken] +=
            (t.from === walletAddress ? -1 : 1) *
            new BigNumber(t.value)
              .dividedBy(new BigNumber(10).exponentiatedBy(18))
              .toNumber();
        });
    }

    if (transfer && isSwap(transfer)) {
      const swap: Swap = {
        block: Number(tx.blockNumber),
        date: Number(tx.timeStamp),
        hash: hash,
        contract: tx.to,
        functionName: processFunctionName(tx.functionName),
        tokens: {},
      };
      Object.keys(transfer.tokens).forEach((token) => {
        token = normalizeTokenName(token);
        if (
          transfer.tokens[token] !== undefined &&
          transfer.tokens[token] !== 0
        ) {
          swap.tokens[token] = {
            amount: Math.abs(transfer.tokens[token]),
            type: transfer.tokens[token] > 0 ? "buy" : "sell",
          };
        }
      });
      swaps.push(swap);
    }
  });
  return swaps;
};

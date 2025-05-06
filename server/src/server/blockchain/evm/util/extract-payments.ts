import BigNumber from "bignumber.js";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { mergeTransfersOfSameTx } from "./merge-transfers-of-same-tx";
import { isSwap } from "./is-swap";
import { processFunctionName } from "../../../../common/util/process-function-name";
import { TokenTransfers } from "../../../../model/token-transfer";

export const extractPayments = (
  transactions: EVMTx[],
  transfers: EVMTransfer[],
  walletAddress: string,
  nativeToken: string,
): TokenTransfers => {
  const transfersObj = mergeTransfersOfSameTx(transfers, walletAddress);
  const rewardsAndPayments: TokenTransfers = {};

  Object.keys(transfersObj).forEach((hash) => {
    const transfer = transfersObj[hash];
    const matchingTx = transactions.filter((tx) => tx.hash === hash);
    matchingTx
      .filter((tx) => Number(tx.value) !== 0 && transfer)
      .forEach((tx) => {
        transfer.tokens[nativeToken] = transfer.tokens[nativeToken]
          ? transfer.tokens[nativeToken]
          : 0;
        transfer.tokens[nativeToken] +=
          (tx.from === walletAddress ? -1 : 1) *
          new BigNumber(tx.value)
            .dividedBy(new BigNumber(10).exponentiatedBy(18))
            .toNumber();
      });
    if (transfer && !isSwap(transfer)) {
      Object.keys(transfer.tokens).forEach((token) => {
        if (
          transfer.tokens[token] !== undefined &&
          transfer.tokens[token] !== 0
        ) {
          if (!rewardsAndPayments[token]) {
            rewardsAndPayments[token] = [];
          }
          rewardsAndPayments[token].push({
            block: Number(transfer.block),
            date: Number(transfer.timestamp),
            hash,
            from: transfer.from,
            to: transfer.to,
            functionName: processFunctionName(
              (matchingTx.length > 0 && matchingTx[0]?.functionName) || "",
            ),
            amount: transfer.tokens[token],
          });
        }
      });
    }
  });
  (transactions || [])
    .filter((t) => !transfersObj[t.hash])
    .forEach((t) => {
      rewardsAndPayments[nativeToken] = rewardsAndPayments[nativeToken] || [];
      let matchingEntry = rewardsAndPayments[nativeToken].find(
        (e) => e.hash === t.hash,
      );
      if (!matchingEntry) {
        matchingEntry = {
          block: Number(t.blockNumber),
          date: Number(t.timeStamp),
          hash: t.hash,
          from: t.from,
          to: t.to,
          functionName: processFunctionName(t?.functionName || ""),
          amount: 0,
        };
        rewardsAndPayments[nativeToken].push(matchingEntry);
      }
      matchingEntry.amount +=
        (t.from === walletAddress ? -1 : 1) *
        BigNumber(t.value).dividedBy(1e18).toNumber();
    });
  return rewardsAndPayments;
};

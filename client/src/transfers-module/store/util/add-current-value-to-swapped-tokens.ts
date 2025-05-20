import { Swap } from '../../../swap-module/model/swaps';

export const addCurrentValueToSwappedTokens = (
  swaps: Swap[],
  tokenInfo: { [key: string]: { latestPrice?: number } }
): Swap[] => {
  swaps.forEach((swap: Swap) => {
    swap.transfers.forEach((transfer) => {
      transfer.valueNow = tokenInfo[transfer.tokenId]?.latestPrice
        ? transfer.amount * tokenInfo[transfer.tokenId].latestPrice!
        : undefined;
    });
  });
  return swaps as Swap[];
};

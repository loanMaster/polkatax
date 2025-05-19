import { Swap, SwapList } from '../../../swap-module/model/swaps';

export const extractTokensFromSwaps = (
  swaps: SwapList | undefined
): string[] => {
  if (swaps === undefined) {
    return [];
  }
  const temp: string[] = [];
  (swaps.swaps || []).forEach((swap: Swap) => {
    swap.transfers.forEach((transfer) => {
      if (temp.indexOf(transfer.symbol) === -1) {
        temp.push(transfer.symbol);
      }
    });
  });
  return temp.sort((a, b) => (a > b ? 1 : -1));
};

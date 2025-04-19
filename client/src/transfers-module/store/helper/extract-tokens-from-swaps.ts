import { Swap, SwapList } from "../../../swap-module/model/swaps";

export const extractTokensFromSwaps = (swaps: SwapList | undefined): string[] => {
    if (swaps === undefined) {
        return []
    }
  const temp: string[] = [];
  (swaps.swaps || []).forEach((swap: Swap) => {
    Object.keys(swap.tokens).forEach((token) => {
      if (temp.indexOf(token) === -1) {
        temp.push(token);
      }
    });
  });
  return temp.sort((a, b) => (a > b ? 1 : -1));
};
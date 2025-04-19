import { Swap, SwapList } from "../../../swap-module/model/swaps";

export const addCurrentValueToTokens = (swaps: SwapList): any => {
  swaps.swaps.forEach((swap: Swap) => {
    Object.keys(swap.tokens).forEach((token) => {
      swap.tokens[token].valueNow = swaps.currentPrices[token]
        ? swap.tokens[token].amount * swaps.currentPrices[token]
        : undefined;
    });
  });
};
import { Swap } from '../../../swap-module/model/swaps';
import { SwapDto } from '../../model/payments-response.dto';

export const addCurrentValueToSwappedTokens = (
  swaps: SwapDto[],
  currentPrices: { [key: string]: number }
): Swap[] => {
  swaps.forEach((swap: SwapDto) => {
    Object.keys(swap.tokens).forEach((token) => {
      (swap as Swap).tokens[token].valueNow = currentPrices[token]
        ? swap.tokens[token].amount * currentPrices[token]
        : undefined;
    });
  });
  return swaps as Swap[];
};

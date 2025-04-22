import {
  Swap,
  SwapList,
  TradingSummary,
} from '../../../swap-module/model/swaps';
import { sumOrNaN } from './sum-or-nan';

export const calculateSwapSummary = (
  swapList: SwapList | undefined,
  filteredSwaps: Swap[]
): TradingSummary[] => {
  if (!swapList) {
    return [];
  }
  const tradingSummary: any = {};
  filteredSwaps.forEach((swap: Swap) => {
    Object.keys(swap.tokens).forEach((token) => {
      const tokenSwapInfo = swap.tokens[token];
      tradingSummary[token] = tradingSummary[token] || {
        sold: { amount: 0, valueNow: 0, value: 0 },
        bought: { amount: 0, valueNow: 0, value: 0 },
        total: { amount: 0, valueNow: 0, value: 0 },
      };
      tradingSummary[token].token = token;
      tradingSummary[token].priceNow = swapList.currentPrices[token];
      const property = tokenSwapInfo.type === 'sell' ? 'sold' : 'bought';
      tradingSummary[token][property].amount += tokenSwapInfo.amount;
      tradingSummary[token][property].value = sumOrNaN(
        tradingSummary[token][property].value,
        tokenSwapInfo.value
      );
      tradingSummary[token][property].valueNow = sumOrNaN(
        tradingSummary[token][property].valueNow,
        tokenSwapInfo.valueNow
      );
    });
  });
  Object.keys(tradingSummary).forEach((token) => {
    tradingSummary[token].total.amount +=
      tradingSummary[token].bought.amount - tradingSummary[token].sold.amount;
    tradingSummary[token].total.value = sumOrNaN(
      tradingSummary[token].total.value,
      tradingSummary[token].bought.value,
      -tradingSummary[token].sold.value
    );
    tradingSummary[token].total.valueNow = sumOrNaN(
      tradingSummary[token].total.valueNow,
      tradingSummary[token].bought.valueNow,
      -tradingSummary[token].sold.valueNow
    );
  });
  const swapSummary: TradingSummary[] = [];
  Object.keys(tradingSummary).forEach((token) => {
    swapSummary.push(tradingSummary[token]);
  });
  return swapSummary;
};

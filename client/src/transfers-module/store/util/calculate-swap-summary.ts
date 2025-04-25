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
  if (!swapList) return [];

  const summaryMap: Record<string, TradingSummary> = {};

  for (const swap of filteredSwaps) {
    for (const [token, tokenInfo] of Object.entries(swap.tokens)) {
      const type = tokenInfo.type === 'sell' ? 'sold' : 'bought';
      const current = summaryMap[token] ?? {
        token,
        priceNow: swapList.currentPrices[token],
        sold: { amount: 0, value: 0, valueNow: 0 },
        bought: { amount: 0, value: 0, valueNow: 0 },
        total: { amount: 0, value: 0, valueNow: 0 },
      };

      current[type].amount += tokenInfo.amount;
      current[type].value = sumOrNaN(current[type].value, tokenInfo.value);
      current[type].valueNow = sumOrNaN(
        current[type].valueNow,
        tokenInfo.valueNow
      );

      summaryMap[token] = current;
    }
  }

  return Object.values(summaryMap).map((summary) => {
    summary.total.amount = summary.bought.amount - summary.sold.amount;
    summary.total.value = sumOrNaN(summary.bought.value, -summary.sold.value!);
    summary.total.valueNow = sumOrNaN(
      summary.bought.valueNow,
      -summary.sold.valueNow!
    );
    return summary;
  });
};

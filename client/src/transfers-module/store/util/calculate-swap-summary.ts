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
    for (const transfer of swap.transfers) {
      const type = transfer.amount < 0 ? 'sold' : 'bought';
      const current = summaryMap[transfer.symbol] ?? {
        token: transfer.symbol,
        priceNow: swapList.tokens[transfer.tokenId].latestPrice,
        sold: { amount: 0, fiatValue: 0, valueNow: 0 },
        bought: { amount: 0, fiatValue: 0, valueNow: 0 },
        total: { amount: 0, fiatValue: 0, valueNow: 0 },
      };

      current[type].amount += transfer.amount;
      current[type].fiatValue = sumOrNaN(
        current[type].fiatValue,
        transfer.fiatValue
      );
      current[type].valueNow = sumOrNaN(
        current[type].valueNow,
        transfer.valueNow
      );

      summaryMap[transfer.symbol] = current;
    }
  }

  return Object.values(summaryMap).map((summary) => {
    summary.total.amount = summary.bought.amount + summary.sold.amount;
    summary.total.fiatValue = sumOrNaN(
      summary.bought.fiatValue,
      summary.sold.fiatValue
    );
    summary.total.valueNow = sumOrNaN(
      summary.bought.valueNow,
      summary.sold.valueNow
    );
    return summary;
  });
};

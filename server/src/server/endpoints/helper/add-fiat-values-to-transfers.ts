import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";

export const addFiatValuesToStakingRewards = (
  values: PricedTransfer[],
  quotes: CurrencyQuotes,
): PricedTransfer[] => {
  const currentIsoDate = formatDate(new Date());
  for (let d of values) {
    addFiatValueToTransfer(d, quotes.quotes, currentIsoDate)
  }
  return values;
};

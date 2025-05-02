import { logger } from "../../logger/logger";
import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { Transfer } from "../../../model/transfer";

export const addFiatValuesToTransfers = (
  values: Transfer[],
  quotes: CurrencyQuotes,
): Transfer[] => {
  const currentPrice = quotes.quotes.latest;
  const currentIsoDate = formatDate(new Date());
  for (let d of values) {
    const isoDate = formatDate(new Date(d.date * 1000));
    if (isoDate === currentIsoDate && quotes.quotes.latest) {
      d.price = currentPrice;
      d.value = d.amount * currentPrice;
    } else if (quotes.quotes?.[isoDate]) {
      d.price = quotes.quotes[isoDate];
      d.value = d.amount * d.price;
    } else if (isoDate !== currentIsoDate) {
      logger.warn(`No quote found for ${quotes.currency} for date ${isoDate}`);
    }
  }
  return values;
};

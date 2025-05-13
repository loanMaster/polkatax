import { logger } from "../../logger/logger";
import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { TxWithFiatValue } from "../model/tx-with-fiat-value";

export const addFiatValuesToTx = (
  transactions: TxWithFiatValue[],
  quotes: CurrencyQuotes,
): TxWithFiatValue[] => {
  const currentIsoDate = formatDate(new Date());
  const currentPrice = quotes.quotes.latest;
  for (let tx of transactions) {
    if (!tx.value) {
      continue
    }
    const isoDate = formatDate(new Date(tx.block_timestamp * 1000));
    if (isoDate === currentIsoDate && quotes.quotes.latest) {
      tx.price = currentPrice;
      tx.fiatValue = Number(tx.value) * currentPrice;
    } else if (quotes.quotes?.[isoDate]) {
      tx.price = quotes.quotes[isoDate];
      tx.fiatValue = Number(tx.value) * tx.price;
    } else if (isoDate !== currentIsoDate) {
      logger.warn(`No quote found for ${quotes.currency} for date ${isoDate}`);
    }
  }
  return transactions
};

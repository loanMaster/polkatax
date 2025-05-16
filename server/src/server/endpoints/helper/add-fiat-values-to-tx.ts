import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { PricedTransaction } from "../model/priced-transaction";
import { addFiatValueToTransfer } from "./add-fiat-values-to-transfer-dto-list";

export const addFiatValuesToTx = (
  transactions: PricedTransaction[],
  quotes: CurrencyQuotes,
): PricedTransaction[] => {
  const currentIsoDate = formatDate(new Date());
  for (let tx of transactions) {
    if (!tx.value) {
      continue
    }
    addFiatValueToTransfer(tx, quotes.quotes, currentIsoDate)
  }
  return transactions
};

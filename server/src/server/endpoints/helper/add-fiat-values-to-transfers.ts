import { logger } from "../../logger/logger";
import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes, Quotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { Transfer } from "../../../model/transfer";
import { addFiatValuesToTransferDtoList } from "./add-fiat-values-to-transfer-dto-list";

export const addFiatValuesToTransfers = (
  values: Transfer[],
  quotes: CurrencyQuotes,
): Transfer[] => {
  const currentIsoDate = formatDate(new Date());
  for (let d of values) {
    addFiatValue(d, quotes.quotes, currentIsoDate)
  }
  return values;
};

const addFiatValue = (transfer: Transfer, quotes: Quotes, currentIsoDate: string) => {
  const isoDate = formatDate(new Date(transfer.timestamp * 1000));
  if (isoDate === currentIsoDate && quotes.latest) {
    transfer.price = quotes.latest;
    transfer.fiatValue = transfer.amount * quotes.latest;
  } else if (quotes.quotes?.[isoDate]) {
    transfer.price = quotes.quotes[isoDate];
    transfer.fiatValue = transfer.amount * transfer.price;
  } else if (isoDate !== currentIsoDate) {
    logger.warn(`No quote found for ${quotes.currency} for date ${isoDate}`);
  }
}
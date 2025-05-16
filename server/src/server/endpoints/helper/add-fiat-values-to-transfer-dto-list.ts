import { logger } from "../../logger/logger";
import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes, Quotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { PricedTransfer } from "../model/priced-transfer";

export const addFiatValuesToTransferDtoList = (
  values: PricedTransfer[],
  quotes: { [tokenId: string]: CurrencyQuotes },
): PricedTransfer[] => {
  const currentIsoDate = formatDate(new Date());
  for (let d of values) {
    if (!d.coingeckoId) {
      continue
    }
    addFiatValueToTransfer(d, quotes[d.coingeckoId].quotes, currentIsoDate)
  }
  return values
};

export const addFiatValueToTransfer = (transfer: { timestamp: number, price?: number, fiatValue?: number, amount: number }, quotes: Quotes, currentIsoDate: string) => {
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
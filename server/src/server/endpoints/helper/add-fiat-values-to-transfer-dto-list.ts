import { logger } from "../../logger/logger";
import { formatDate } from "../../../common/util/date-utils";
import { CurrencyQuotes } from "../../../model/crypto-currency-prices/crypto-currency-quotes";
import { TransferWithFiatValue } from "../model/transfer-with-fiat-value";

export const addFiatValuesToTransferDtoList = (
  values: TransferWithFiatValue[],
  tokenIdToCoingeckoIdMapping: { [tokenId: string]: string },
  quotes: { [tokenId: string]: CurrencyQuotes },
): TransferWithFiatValue[] => {
  const currentIsoDate = formatDate(new Date());
  for (let d of values) {
    const coingeckoId = tokenIdToCoingeckoIdMapping[d?.asset_unique_id || d.contract];
    if (!coingeckoId) {
      continue
    }
    const currentPrice = quotes[coingeckoId].quotes.latest;
    const isoDate = formatDate(new Date(d.block_timestamp * 1000));
    if (isoDate === currentIsoDate && quotes[coingeckoId].quotes.latest) {
      d.price = currentPrice;
      d.fiatValue = d.amount * currentPrice;
    } else if (quotes[coingeckoId].quotes?.[isoDate]) {
      d.price = quotes[coingeckoId].quotes[isoDate];
      d.fiatValue = d.amount * d.price;
    } else if (isoDate !== currentIsoDate) {
      logger.warn(`No quote found for ${quotes.currency} for date ${isoDate}`);
    }
  }
  return values
};

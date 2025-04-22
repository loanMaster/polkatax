import { formatDate } from '../../../shared-module/util/date-utils';
import { TokenPaymentsData } from '../../model/payments';
import { TransferDto } from '../../model/payments-response.dto';
import { calculatePaymentsSummary } from './calculate-payments-summary';

export const addCurrentValueAndSummaryToTransfers = (
  transfers: {
    [symbol: string]: { values: TransferDto[]; currentPrice: number };
  },
  currentPrices: { [key: string]: number }
) => {
  const result: { [key: string]: TokenPaymentsData } = {};
  for (const token of Object.keys(transfers)) {
    const paymentsForToken = transfers[token].values.map((v: TransferDto) => {
      const valueNow = isNaN(v.amount * currentPrices[token])
        ? undefined
        : v.amount * currentPrices[token];
      return {
        ...v,
        valueNow,
        isoDate: formatDate(v.date),
      };
    });
    result[token] = {
      payments: paymentsForToken,
      summary: calculatePaymentsSummary(paymentsForToken),
      currentPrice: currentPrices[token],
    };
  }
  return result;
};

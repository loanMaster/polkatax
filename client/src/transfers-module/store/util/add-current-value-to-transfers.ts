import { formatDate } from '../../../shared-module/util/date-utils';
import { TokenPaymentsData } from '../../model/payments';
import { TransferDto } from '../../model/payments-response.dto';
import { calculatePaymentsSummary } from './calculate-payments-summary';

export const addCurrentValueAndSummaryToTransfers = (transfers: {
  [symbol: string]: { values: TransferDto[]; currentPrice?: number };
}) => {
  const result: { [key: string]: TokenPaymentsData } = {};
  for (const token of Object.keys(transfers)) {
    const paymentsForToken = transfers[token].values.map((v: TransferDto) => {
      const valueNow =
        transfers[token].currentPrice !== undefined
          ? v.amount * transfers[token].currentPrice
          : undefined;
      return {
        ...v,
        valueNow,
        isoDate: formatDate(v.date),
      };
    });
    result[token] = {
      payments: paymentsForToken,
      summary: calculatePaymentsSummary(paymentsForToken),
      currentPrice: transfers[token].currentPrice,
    };
  }
  return result;
};

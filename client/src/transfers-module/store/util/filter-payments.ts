import { DataRequest } from '../../../shared-module/model/data-request';
import { PaymentPortfolio, TokenPaymentsData } from '../../model/payments';
import { calculatePaymentsSummary } from './calculate-payments-summary';

export const filterPayments = ([
  paymentsRequest,
  selectedToken,
  paymentsFilter,
  excludedPayments,
]: [DataRequest<PaymentPortfolio>, string, string, any[]]) => {
  const payments = paymentsRequest.data;
  const filtered =
    payments?.transfers.filter((t) => t.symbol === selectedToken) ?? [];
  const paymentsForToken = {
    payments: filtered,
    currentPrice: Object.values(payments?.tokens || []).find(
      (t) => t.symbol === selectedToken
    )?.latestPrice,
  } as TokenPaymentsData;
  paymentsForToken.payments = paymentsForToken.payments.filter(
    (p) =>
      (p.amount > 0 && paymentsFilter !== 'Outgoing transfers only') ||
      (p.amount < 0 && paymentsFilter !== 'Incoming transfers only')
  );
  paymentsForToken.summary = calculatePaymentsSummary(
    paymentsForToken.payments,
    excludedPayments
  );
  return paymentsForToken;
};

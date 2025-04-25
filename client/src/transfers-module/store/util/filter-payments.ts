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
  if (!payments || !payments?.tokens?.[selectedToken]) {
    return undefined;
  }
  const paymentsForToken = {
    payments: payments.tokens![selectedToken].payments,
    currentPrice: payments.tokens![selectedToken].currentPrice,
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

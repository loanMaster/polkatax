import { calculatePamymentsSummary } from "./calculate-payments-summary";
import { PaymentsList, Payments } from "../../model/payments";
import { DataRequest } from "../../../shared-module/model/data-request";

export const filterPayments = ([paymentsRequest, selectedToken, paymentsFilter, excludedEntries]: [DataRequest<PaymentsList>, string, string, any[]]) => {
  const payments = paymentsRequest.data;
  if (!payments || !payments?.tokens?.[selectedToken]) {
    return undefined;
  }
  const paymentsForToken = {
    values: payments.tokens![selectedToken].values,
    currentPrice: payments.tokens![selectedToken].currentPrice,
  } as Payments;
  paymentsForToken.values = paymentsForToken.values.filter(
    (p) =>
      (p.amount > 0 && paymentsFilter !== 'Outgoing transfers only') ||
      (p.amount < 0 && paymentsFilter !== 'Incoming transfers only')
  );
  paymentsForToken.summary = calculatePamymentsSummary(
    paymentsForToken,
    excludedEntries
  );
  return paymentsForToken;
}
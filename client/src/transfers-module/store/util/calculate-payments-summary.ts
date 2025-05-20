import { TokenPayment } from '../../model/payments';
import { sumOrNaN } from './sum-or-nan';

export const calculatePaymentsSummary = (
  payments: TokenPayment[],
  excludedPayments: { hash: string }[] = []
) => {
  const excludedHashes = excludedPayments.map((e) => e.hash);
  const summary: any = { fiatValue: 0, amount: 0, valueNow: 0 };
  payments
    .filter((v) => !v.hash || excludedHashes.indexOf(v.hash) === -1)
    .forEach((v) => {
      summary.amount += v.amount;
      summary.fiatValue = sumOrNaN(summary.fiatValue, v.fiatValue);
      summary.valueNow = sumOrNaN(summary.valueNow, v.valueNow);
    });
  return summary;
};

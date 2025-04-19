import { PaymentDto, Payments } from "../../model/payments";
import { sumOrNaN } from "./sum-or-nan";

export const calculatePamymentsSummary = (
  payments: Payments,
  excludedEntries: PaymentDto[] = []
) => {
  const excludedHashes = excludedEntries.map((e) => e.hash);
  const summary: any = { value: 0, amount: 0, valueNow: 0 };
  payments.values
    .filter((v) => excludedHashes.indexOf(v.hash) === -1)
    .forEach((v) => {
      summary.amount += v.amount;
      summary.value = sumOrNaN(summary.value, v.value);
      summary.valueNow = sumOrNaN(summary.valueNow, v.valueNow);
    });
  return summary;
};
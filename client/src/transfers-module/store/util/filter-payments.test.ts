import { filterPayments } from './filter-payments';
import { DataRequest } from '../../../shared-module/model/data-request';
import { PaymentPortfolio } from '../../model/payments';
import { TokenPayment } from '../../model/payments';
import * as summaryModule from './calculate-payments-summary';
import { expect, test, describe, beforeEach, jest } from '@jest/globals';

describe('filterPayments', () => {
  const mockSummary = { amount: 0, value: 0, valueNow: 0 };

  beforeEach(() => {
    jest
      .spyOn(summaryModule, 'calculatePaymentsSummary')
      .mockReturnValue(mockSummary);
  });

  const mockPayment = (amount: number): TokenPayment =>
    ({
      amount,
      hash: `hash-${amount}`,
      value: amount * 2,
      valueNow: amount * 3,
      date: Date.now(),
      isoDate: '2023-01-01',
    } as TokenPayment);

  const createRequest = (
    token: string,
    payments: TokenPayment[],
    currentPrice = 1
  ): DataRequest<PaymentPortfolio> =>
    ({
      data: {
        tokens: {
          [token]: {
            payments,
            currentPrice,
          },
        },
      },
      error: undefined,
    } as DataRequest<PaymentPortfolio>);

  test('returns undefined if no data', () => {
    const request = { data: undefined } as DataRequest<PaymentPortfolio>;
    const result = filterPayments([request, 'DOT', 'All transfers', []]);
    expect(result).toBeUndefined();
  });

  test('returns undefined if token not in data', () => {
    const request = createRequest('KSM', [mockPayment(5)]);
    const result = filterPayments([request, 'DOT', 'All transfers', []]);
    expect(result).toBeUndefined();
  });

  test('returns all payments for "All transfers"', () => {
    const payments = [mockPayment(10), mockPayment(-5)];
    const request = createRequest('DOT', payments);
    const result = filterPayments([request, 'DOT', 'All transfers', []]);
    expect(result?.payments).toEqual(payments);
    expect(result?.summary).toEqual(mockSummary);
  });

  test('filters out negative amounts for "Outgoing transfers only"', () => {
    const payments = [mockPayment(10), mockPayment(-5)];
    const request = createRequest('DOT', payments);
    const result = filterPayments([
      request,
      'DOT',
      'Outgoing transfers only',
      [],
    ]);
    expect(result?.payments).toEqual([mockPayment(-5)]);
  });

  test('filters out positive amounts for "Incoming transfers only"', () => {
    const payments = [mockPayment(10), mockPayment(-5)];
    const request = createRequest('DOT', payments);
    const result = filterPayments([
      request,
      'DOT',
      'Incoming transfers only',
      [],
    ]);
    expect(result?.payments).toEqual([mockPayment(10)]);
  });

  test('passes excluded entries to calculatePaymentsSummary', () => {
    const payments = [mockPayment(1)];
    const excluded = [mockPayment(1)];
    const request = createRequest('DOT', payments);

    const spy = jest.spyOn(summaryModule, 'calculatePaymentsSummary');
    filterPayments([request, 'DOT', 'All transfers', excluded]);
    expect(spy).toHaveBeenCalledWith(expect.any(Array), excluded);
  });
});

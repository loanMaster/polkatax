import { expect, test, describe } from '@jest/globals';
import { calculatePaymentsSummary } from './calculate-payments-summary';
import { TokenPayment } from '../../model/payments';

describe('calculatePaymentsSummary', () => {
  test('should correctly sum amount, value, and valueNow', () => {
    const payments: TokenPayment[] = [
      { amount: 10, value: 100, valueNow: 90, hash: 'tx1' },
      { amount: 5, value: 50, valueNow: 45, hash: 'tx2' },
    ] as TokenPayment[];

    const result = calculatePaymentsSummary(payments);

    expect(result).toEqual({
      amount: 15,
      value: 150,
      valueNow: 135,
    });
  });

  test('should exclude entries by hash', () => {
    const payments: TokenPayment[] = [
      { amount: 10, value: 100, valueNow: 90, hash: 'tx1' },
      { amount: 5, value: 50, valueNow: 45, hash: 'tx2' },
    ] as TokenPayment[];

    const excluded = [{ hash: 'tx2' }];

    const result = calculatePaymentsSummary(payments, excluded);

    expect(result).toEqual({
      amount: 10,
      value: 100,
      valueNow: 90,
    });
  });

  test('should handle undefined and NaN values correctly', () => {
    const payments: TokenPayment[] = [
      { amount: 10, value: 100, valueNow: 90, hash: 'tx1' },
      { amount: 5, value: undefined, valueNow: NaN, hash: 'tx2' },
    ] as TokenPayment[];

    const result = calculatePaymentsSummary(payments);

    expect(result).toEqual({
      amount: 15,
      value: undefined,
      valueNow: undefined,
    });
  });

  test('should return 0 for all fields when no payments', () => {
    const result = calculatePaymentsSummary([]);
    expect(result).toEqual({
      amount: 0,
      value: 0,
      valueNow: 0,
    });
  });

  test('should return 0 for all fields when all payments are excluded', () => {
    const payments: TokenPayment[] = [
      { amount: 10, value: 100, valueNow: 90, hash: 'tx1' },
    ] as TokenPayment[];
    const excluded = [{ hash: 'tx1' }];

    const result = calculatePaymentsSummary(payments, excluded);

    expect(result).toEqual({
      amount: 0,
      value: 0,
      valueNow: 0,
    });
  });
});

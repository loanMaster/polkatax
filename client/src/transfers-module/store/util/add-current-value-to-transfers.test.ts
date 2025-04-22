import { TransferDto } from '../../model/payments-response.dto';
import { addCurrentValueAndSummaryToTransfers } from './add-current-value-to-transfers';
import { calculatePaymentsSummary } from './calculate-payments-summary';
import { expect, jest, beforeEach, test, describe } from '@jest/globals';

jest.mock('./calculate-payments-summary', () => ({
  calculatePaymentsSummary: jest.fn(),
}));

describe('addCurrentValueAndSummaryToTransfers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should calculate valueNow and add summary for each token', () => {
    const transfers = {
      tokenA: {
        values: [
          { amount: 10, date: 1620000000000 },
          { amount: 20, date: 1620100000000 },
        ] as TransferDto[],
        currentPrice: 2,
      },
    };

    (calculatePaymentsSummary as jest.Mock).mockImplementation(() => ({
      amount: 30,
      value: 60,
    }));

    const result = addCurrentValueAndSummaryToTransfers(transfers);

    expect(result).toEqual({
      tokenA: {
        payments: [
          {
            amount: 10,
            date: 1620000000000,
            valueNow: 20,
            isoDate: '2021-05-03',
          },
          {
            amount: 20,
            date: 1620100000000,
            valueNow: 40,
            isoDate: '2021-05-04',
          },
        ],
        summary: { amount: 30, value: 60 },
        currentPrice: 2,
      },
    });
  });

  test('should handle missing current price for a token gracefully', () => {
    const transfers = {
      tokenB: {
        values: [
          { amount: 10, date: 1620000000000 },
          { amount: 20, date: 1620100000000 },
        ] as TransferDto[],
        currentPrice: undefined,
      },
    };

    (calculatePaymentsSummary as jest.Mock).mockImplementation(() => ({
      amount: 30,
      value: undefined,
    }));

    const result = addCurrentValueAndSummaryToTransfers(transfers);

    expect(result).toEqual({
      tokenB: {
        payments: [
          {
            amount: 10,
            date: 1620000000000,
            valueNow: undefined,
            isoDate: '2021-05-03',
          },
          {
            amount: 20,
            date: 1620100000000,
            valueNow: undefined,
            isoDate: '2021-05-04',
          },
        ],
        summary: { amount: 30, value: undefined },
        currentPrice: undefined,
      },
    });
  });

  test('should return an empty object when no transfers are provided', () => {
    const transfers = {};

    const result = addCurrentValueAndSummaryToTransfers(transfers);

    expect(result).toEqual({});
  });

  test('should handle negative or zero values correctly', () => {
    const transfers = {
      tokenC: {
        values: [
          { amount: 0, date: 1620000000000 },
          { amount: -10, date: 1620100000000 },
        ] as TransferDto[],
        currentPrice: 1,
      },
    };

    (calculatePaymentsSummary as jest.Mock).mockImplementation(() => ({
      amount: -10,
      value: 0,
    }));

    const result = addCurrentValueAndSummaryToTransfers(transfers);

    expect(result).toEqual({
      tokenC: {
        payments: [
          {
            amount: 0,
            date: 1620000000000,
            valueNow: 0,
            isoDate: '2021-05-03',
          },
          {
            amount: -10,
            date: 1620100000000,
            valueNow: -10,
            isoDate: '2021-05-04',
          },
        ],
        summary: { amount: -10, value: 0 },
        currentPrice: 1,
      },
    });
  });
});

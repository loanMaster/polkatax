import { expect, it, describe, jest, afterEach } from '@jest/globals';

import { DataRequest } from '../../../shared-module/model/data-request';
import { PaymentPortfolio } from '../../model/payments';
import * as summaryUtils from './calculate-payments-summary';
import { filterPayments } from './filter-payments';

describe('filterPayments', () => {
  const mockSummary = { amount: 999, valueNow: 1234 };
  jest
    .spyOn(summaryUtils, 'calculatePaymentsSummary')
    .mockReturnValue(mockSummary);

  const baseRequest: DataRequest<PaymentPortfolio> = {
    loading: false,
    data: {
      transfers: [
        { symbol: 'ETH', amount: 5 },
        { symbol: 'ETH', amount: -2 },
        { symbol: 'USDC', amount: 3 },
      ],
      tokens: {
        ethToken: { symbol: 'ETH', latestPrice: 2000 },
        usdcToken: { symbol: 'USDC', latestPrice: 1 },
      },
    },
  } as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('filters only selectedToken and applies "all" filter', () => {
    const result = filterPayments([baseRequest, 'ETH', 'All transfers', []]);

    expect(result.payments).toEqual([
      { symbol: 'ETH', amount: 5 },
      { symbol: 'ETH', amount: -2 },
    ]);
    expect(result.currentPrice).toBe(2000);
    expect(result.summary).toBe(mockSummary);
  });

  it('filters only incoming transfers when "Incoming transfers only"', () => {
    const result = filterPayments([
      baseRequest,
      'ETH',
      'Incoming transfers only',
      [],
    ]);

    expect(result.payments).toEqual([{ symbol: 'ETH', amount: 5 }]);
  });

  it('filters only outgoing transfers when "Outgoing transfers only"', () => {
    const result = filterPayments([
      baseRequest,
      'ETH',
      'Outgoing transfers only',
      [],
    ]);

    expect(result.payments).toEqual([{ symbol: 'ETH', amount: -2 }]);
  });

  it('handles undefined payments data gracefully', () => {
    const emptyRequest: DataRequest<PaymentPortfolio> = {
      loading: false,
      data: undefined,
    } as any;

    const result = filterPayments([emptyRequest, 'ETH', 'All transfers', []]);

    expect(result.payments).toEqual([]);
    expect(result.currentPrice).toBeUndefined();
    expect(result.summary).toBe(mockSummary);
  });
});

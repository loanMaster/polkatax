import { expect, it, describe, jest, beforeEach } from '@jest/globals';

import { Swap, SwapList } from '../../../swap-module/model/swaps';
import * as sumUtil from './sum-or-nan';
import { calculateSwapSummary } from './calculate-swap-summary';

describe('calculateSwapSummary', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty array if swapList is undefined', () => {
    const result = calculateSwapSummary(undefined, []);
    expect(result).toEqual([]);
  });

  it('calculates summary correctly for bought and sold tokens', () => {
    jest
      .spyOn(sumUtil, 'sumOrNaN')
      .mockImplementation((a, b) =>
        a === undefined || b === undefined ? undefined : a + b
      );

    const swapList: SwapList = {
      swaps: [],
      tokens: {
        tokenA: { latestPrice: 2 },
        tokenB: { latestPrice: 10 },
      },
    } as any;

    const filteredSwaps: Swap[] = [
      {
        transfers: [
          {
            symbol: 'ETH',
            tokenId: 'tokenA',
            amount: 1,
            fiatValue: 100,
            valueNow: 200,
          }, // bought
          {
            symbol: 'ETH',
            tokenId: 'tokenA',
            amount: -0.5,
            fiatValue: 40,
            valueNow: 90,
          }, // sold
        ],
      },
      {
        transfers: [
          {
            symbol: 'USDC',
            tokenId: 'tokenB',
            amount: 100,
            fiatValue: 100,
            valueNow: 100,
          }, // bought
        ],
      },
    ] as any;

    const result = calculateSwapSummary(swapList, filteredSwaps);

    expect(result).toEqual([
      {
        token: 'ETH',
        priceNow: 2,
        bought: { amount: 1, fiatValue: 100, valueNow: 200 },
        sold: { amount: -0.5, fiatValue: 40, valueNow: 90 },
        total: { amount: 0.5, fiatValue: 140, valueNow: 290 },
      },
      {
        token: 'USDC',
        priceNow: 10,
        bought: { amount: 100, fiatValue: 100, valueNow: 100 },
        sold: { amount: 0, fiatValue: 0, valueNow: 0 },
        total: { amount: 100, fiatValue: 100, valueNow: 100 },
      },
    ]);
  });

  it('handles undefined fiatValue and valueNow gracefully', () => {
    jest
      .spyOn(sumUtil, 'sumOrNaN')
      .mockImplementation((a, b) =>
        a === undefined || b === undefined ? undefined : a + b
      );

    const swapList: SwapList = {
      swaps: [],
      tokens: {
        tokenA: { latestPrice: 2 },
      },
    } as any;

    const filteredSwaps: Swap[] = [
      {
        transfers: [
          {
            symbol: 'ETH',
            tokenId: 'tokenA',
            amount: 1,
            fiatValue: undefined,
            valueNow: undefined,
          },
        ],
      },
    ] as any;

    const result = calculateSwapSummary(swapList, filteredSwaps);

    expect(result).toEqual([
      {
        token: 'ETH',
        priceNow: 2,
        bought: { amount: 1, fiatValue: undefined, valueNow: undefined },
        sold: { amount: 0, fiatValue: 0, valueNow: 0 },
        total: { amount: 1, fiatValue: undefined, valueNow: undefined },
      },
    ]);
  });
});

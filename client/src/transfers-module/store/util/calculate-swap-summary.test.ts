import { calculateSwapSummary } from './calculate-swap-summary';
import { Swap, SwapList } from '../../../swap-module/model/swaps';
import { expect, test, describe } from '@jest/globals';

describe('calculateSwapSummary', () => {
  const mockSwap = (
    token: string,
    type: 'sell' | 'buy',
    amount: number,
    value: number,
    valueNow: number
  ): Swap =>
    ({
      tokens: {
        [token]: {
          amount,
          value,
          valueNow,
          type,
        },
      },
    } as Swap);

  const mockSwapList: SwapList = {
    swaps: [],
    currentPrices: {
      DOT: 6,
      KSM: 30,
    },
  } as unknown as SwapList;

  test('returns empty array if swapList is undefined', () => {
    const result = calculateSwapSummary(undefined, []);
    expect(result).toEqual([]);
  });

  test('calculates sold token summary', () => {
    const filteredSwaps = [mockSwap('DOT', 'sell', 10, 100, 120)];
    const result = calculateSwapSummary(mockSwapList, filteredSwaps);
    expect(result).toEqual([
      {
        token: 'DOT',
        priceNow: 6,
        sold: { amount: 10, value: 100, valueNow: 120 },
        bought: { amount: 0, value: 0, valueNow: 0 },
        total: { amount: -10, value: -100, valueNow: -120 },
      },
    ]);
  });

  test('calculates bought token summary', () => {
    const filteredSwaps = [mockSwap('KSM', 'buy', 5, 150, 180)];
    const result = calculateSwapSummary(mockSwapList, filteredSwaps);
    expect(result).toEqual([
      {
        token: 'KSM',
        priceNow: 30,
        sold: { amount: 0, value: 0, valueNow: 0 },
        bought: { amount: 5, value: 150, valueNow: 180 },
        total: { amount: 5, value: 150, valueNow: 180 },
      },
    ]);
  });

  test('aggregates multiple swaps for the same token', () => {
    const filteredSwaps = [
      mockSwap('DOT', 'sell', 5, 50, 60),
      mockSwap('DOT', 'buy', 3, 30, 40),
    ];
    const result = calculateSwapSummary(mockSwapList, filteredSwaps);
    expect(result).toEqual([
      {
        token: 'DOT',
        priceNow: 6,
        sold: { amount: 5, value: 50, valueNow: 60 },
        bought: { amount: 3, value: 30, valueNow: 40 },
        total: { amount: -2, value: -20, valueNow: -20 },
      },
    ]);
  });

  test('returns multiple token summaries', () => {
    const filteredSwaps = [
      mockSwap('DOT', 'buy', 2, 20, 25),
      mockSwap('KSM', 'sell', 1, 30, 28),
    ];
    const result = calculateSwapSummary(mockSwapList, filteredSwaps);
    expect(result).toEqual([
      {
        token: 'DOT',
        priceNow: 6,
        sold: { amount: 0, value: 0, valueNow: 0 },
        bought: { amount: 2, value: 20, valueNow: 25 },
        total: { amount: 2, value: 20, valueNow: 25 },
      },
      {
        token: 'KSM',
        priceNow: 30,
        sold: { amount: 1, value: 30, valueNow: 28 },
        bought: { amount: 0, value: 0, valueNow: 0 },
        total: { amount: -1, value: -30, valueNow: -28 },
      },
    ]);
  });
});

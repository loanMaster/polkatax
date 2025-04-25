import { filterSwaps } from './filter-swaps';
import { Swap, SwapList } from '../../../swap-module/model/swaps';
import { DataRequest } from '../../../shared-module/model/data-request';
import { expect, test, describe } from '@jest/globals';

describe('filterSwaps', () => {
  const makeSwap = (tokens: string[]): Swap =>
    ({
      tokens: tokens.reduce((acc, t) => {
        acc[t] = { amount: 1 }; // Dummy amount
        return acc;
      }, {} as any),
    } as unknown as Swap);

  const baseRequest = (swaps: Swap[]): DataRequest<SwapList> => ({
    data: { swaps } as SwapList,
    pending: false,
    error: undefined,
  });

  const visibleTokens = [
    { name: 'DOT', value: true },
    { name: 'KSM', value: false },
    { name: 'USDT', value: true },
  ];

  test('should return empty array if no swaps match token filter', () => {
    const swaps = [makeSwap(['KSM'])];
    const request = baseRequest(swaps);
    const result = filterSwaps([
      request,
      visibleTokens,
      { twoAssets: true, multipleAssets: true },
    ]);
    expect(result).toEqual([]);
  });

  test('should return only two-asset swaps when only twoAssets is true', () => {
    const swaps = [makeSwap(['DOT', 'USDT']), makeSwap(['DOT', 'KSM', 'USDT'])];
    const request = baseRequest(swaps);
    const result = filterSwaps([
      request,
      visibleTokens,
      { twoAssets: true, multipleAssets: false },
    ]);
    expect(result.length).toBe(1);
    expect(Object.keys(result[0].tokens)).toEqual(['DOT', 'USDT']);
  });

  test('should return only multi-asset swaps when only multipleAssets is true', () => {
    const swaps = [makeSwap(['DOT', 'USDT', 'BTC']), makeSwap(['DOT', 'USDT'])];
    const request = baseRequest(swaps);
    const result = filterSwaps([
      request,
      visibleTokens,
      { twoAssets: false, multipleAssets: true },
    ]);
    expect(result.length).toBe(1);
    expect(Object.keys(result[0].tokens)).toEqual(['DOT', 'USDT', 'BTC']);
  });

  test('should return all matching swaps when both filters are true', () => {
    const swaps = [
      makeSwap(['DOT', 'USDT']),
      makeSwap(['DOT', 'USDT', 'BTC']),
      makeSwap(['KSM', 'USDT']),
    ];
    const request = baseRequest(swaps);
    const result = filterSwaps([
      request,
      visibleTokens,
      { twoAssets: true, multipleAssets: true },
    ]);
    expect(result.length).toBe(3);
    expect(result.map((s) => Object.keys(s.tokens))).toEqual([
      ['DOT', 'USDT'],
      ['DOT', 'USDT', 'BTC'],
      ['KSM', 'USDT'],
    ]);
  });

  test('should return empty array if swapsRequest has no data', () => {
    const request = { data: undefined, loading: false, error: undefined };
    const result = filterSwaps([
      request as any,
      visibleTokens,
      { twoAssets: true, multipleAssets: true },
    ]);
    expect(result).toEqual([]);
  });

  test('should only return visible tokens', () => {
    const swaps = [
      makeSwap(['DOT', 'USDC']),
      makeSwap(['BTC', 'USDC']),
      makeSwap(['GLMR', 'USDT']),
      makeSwap(['DOT', 'KSM', 'USDT']),
    ];
    const request = baseRequest(swaps);
    const result = filterSwaps([
      request,
      visibleTokens,
      { twoAssets: true, multipleAssets: true },
    ]);
    expect(result.length).toBe(3);
    expect(result.map((s) => Object.keys(s.tokens))).toEqual([
      ['DOT', 'USDC'],
      ['GLMR', 'USDT'],
      ['DOT', 'KSM', 'USDT'],
    ]);
  });
});

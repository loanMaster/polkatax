import { extractTokensFromSwaps } from './extract-tokens-from-swaps';
import { SwapList } from '../../../swap-module/model/swaps';
import { expect, test, describe } from '@jest/globals';

describe('extractTokensFromSwaps', () => {
  test('should return an empty array if swaps is undefined', () => {
    expect(extractTokensFromSwaps(undefined)).toEqual([]);
  });

  test('should return an empty array if swaps.swaps is empty', () => {
    const emptySwaps: SwapList = { swaps: [] } as unknown as SwapList;
    expect(extractTokensFromSwaps(emptySwaps)).toEqual([]);
  });

  test('should extract unique tokens from swaps and sort them alphabetically', () => {
    const mockSwaps: SwapList = {
      swaps: [
        {
          tokens: {
            DOT: { amount: 10 },
            KSM: { amount: 5 },
          },
        },
        {
          tokens: {
            USDT: { amount: 7 },
            DOT: { amount: 2 },
          },
        },
      ],
    } as unknown as SwapList;

    const result = extractTokensFromSwaps(mockSwaps);
    expect(result).toEqual(['DOT', 'KSM', 'USDT']);
  });

  test('should handle duplicate tokens correctly', () => {
    const mockSwaps: SwapList = {
      swaps: [
        { tokens: { A: { amount: 1 } } },
        { tokens: { A: { amount: 2 }, B: { amount: 3 } } },
        { tokens: { B: { amount: 4 }, C: { amount: 5 } } },
      ],
    } as unknown as SwapList;

    const result = extractTokensFromSwaps(mockSwaps);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('should work with single swap and single token', () => {
    const mockSwaps: SwapList = {
      swaps: [{ tokens: { BTC: { amount: 1 } } }],
    } as unknown as SwapList;

    expect(extractTokensFromSwaps(mockSwaps)).toEqual(['BTC']);
  });
});

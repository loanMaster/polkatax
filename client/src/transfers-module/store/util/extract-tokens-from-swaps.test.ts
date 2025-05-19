import { expect, it, describe } from '@jest/globals';
import { SwapList } from '../../../swap-module/model/swaps';
import { extractTokensFromSwaps } from './extract-tokens-from-swaps';

describe('extractTokensFromSwaps', () => {
  it('returns an empty array if input is undefined', () => {
    const result = extractTokensFromSwaps(undefined);
    expect(result).toEqual([]);
  });

  it('extracts unique token symbols from swaps and sorts them alphabetically', () => {
    const swaps: SwapList = {
      swaps: [
        {
          transfers: [
            { symbol: 'ETH' },
            { symbol: 'DAI' },
            { symbol: 'ETH' }, // duplicate
          ],
        } as any,
        {
          transfers: [
            { symbol: 'USDC' },
            { symbol: 'DAI' }, // duplicate
          ],
        },
      ],
    } as any;

    const result = extractTokensFromSwaps(swaps);
    expect(result).toEqual(['DAI', 'ETH', 'USDC']); // sorted & unique
  });

  it('returns empty array if swaps is empty', () => {
    const swaps: SwapList = {
      swaps: [],
    } as any;

    const result = extractTokensFromSwaps(swaps);
    expect(result).toEqual([]);
  });

  it('handles missing swaps field gracefully', () => {
    const swaps = {} as SwapList;

    const result = extractTokensFromSwaps(swaps);
    expect(result).toEqual([]);
  });
});

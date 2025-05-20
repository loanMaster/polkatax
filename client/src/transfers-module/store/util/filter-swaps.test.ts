import { expect, it, describe } from '@jest/globals';
import { DataRequest } from '../../../shared-module/model/data-request';
import { SwapList, Swap } from '../../../swap-module/model/swaps';
import { filterSwaps } from './filter-swaps';

describe('filterSwaps', () => {
  const mockSwaps: Swap[] = [
    {
      hash: 'swap1',
      transfers: [{ symbol: 'ETH' }, { symbol: 'DAI' }],
    },
    {
      hash: 'swap2',
      transfers: [{ symbol: 'USDC' }, { symbol: 'USDT' }, { symbol: 'DAI' }],
    },
    {
      hash: 'swap3',
      transfers: [{ symbol: 'MKR' }, { symbol: 'UNI' }],
    },
  ] as any;

  const dataRequest: DataRequest<SwapList> = {
    loading: false,
    data: { swaps: mockSwaps },
  } as any;

  const visibleTokens = [
    { value: true, name: 'DAI' },
    { value: false, name: 'USDT' },
    { value: true, name: 'MKR' },
  ];

  it('filters two-asset swaps with supported tokens', () => {
    const result = filterSwaps([
      dataRequest,
      visibleTokens,
      { twoAssets: true, multipleAssets: false },
    ]);
    expect(result).toHaveLength(2); // swap1 (DAI), swap3 (MKR)
    expect(result.map((s) => s.hash)).toContain('swap1');
    expect(result.map((s) => s.hash)).toContain('swap3');
  });

  it('filters multi-asset swaps with supported tokens', () => {
    const result = filterSwaps([
      dataRequest,
      visibleTokens,
      { twoAssets: false, multipleAssets: true },
    ]);
    expect(result).toHaveLength(1); // swap2 has DAI but USDT is not visible
    expect(result[0].hash).toBe('swap2');
  });

  it('returns empty array if no tokens match', () => {
    const noMatchTokens = [{ value: true, name: 'XYZ' }];
    const result = filterSwaps([
      dataRequest,
      noMatchTokens,
      { twoAssets: true, multipleAssets: true },
    ]);
    expect(result).toHaveLength(0);
  });

  it('handles empty swaps data safely', () => {
    const emptyRequest: DataRequest<SwapList> = {
      loading: false,
      data: { swaps: [] },
    } as any;
    const result = filterSwaps([
      emptyRequest,
      visibleTokens,
      { twoAssets: true, multipleAssets: true },
    ]);
    expect(result).toEqual([]);
  });
});

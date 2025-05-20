import { expect, it, describe } from '@jest/globals';
import { Swap } from '../../../swap-module/model/swaps';
import { addCurrentValueToSwappedTokens } from './add-current-value-to-swapped-tokens';

describe('addCurrentValueToSwappedTokens', () => {
  it('adds valueNow based on tokenInfo.latestPrice', () => {
    const swaps: Swap[] = [
      {
        transfers: [
          { tokenId: 'tokenA', amount: 2 },
          { tokenId: 'tokenB', amount: 3 },
        ],
      } as any,
    ];

    const tokenInfo = {
      tokenA: { latestPrice: 10 },
      tokenB: { latestPrice: 5 },
    };

    const result = addCurrentValueToSwappedTokens(swaps, tokenInfo);

    expect(result[0].transfers[0].valueNow).toBe(20); // 2 * 10
    expect(result[0].transfers[1].valueNow).toBe(15); // 3 * 5
  });

  it('sets valueNow to undefined if latestPrice is missing', () => {
    const swaps: Swap[] = [
      {
        transfers: [{ tokenId: 'tokenC', amount: 1 }],
      } as any,
    ];

    const tokenInfo = {
      tokenC: {}, // no latestPrice
    };

    const result = addCurrentValueToSwappedTokens(swaps, tokenInfo);

    expect(result[0].transfers[0].valueNow).toBeUndefined();
  });

  it('sets valueNow to undefined if token is not found in tokenInfo', () => {
    const swaps: Swap[] = [
      {
        transfers: [{ tokenId: 'tokenX', amount: 5 }],
      } as any,
    ];

    const tokenInfo = {
      tokenY: { latestPrice: 100 },
    };

    const result = addCurrentValueToSwappedTokens(swaps, tokenInfo);

    expect(result[0].transfers[0].valueNow).toBeUndefined();
  });
});

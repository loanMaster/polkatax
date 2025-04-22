import { expect, test, describe } from '@jest/globals';
import { SwapDto } from '../../model/payments-response.dto';
import { addCurrentValueToSwappedTokens } from './add-current-value-to-swapped-tokens';

describe('addCurrentValueToSwappedTokens', () => {
  test('should correctly add valueNow based on currentPrices for each token', () => {
    const swaps: SwapDto[] = [
      {
        tokens: {
          tokenA: { amount: 10 },
          tokenB: { amount: 20 },
        },
      },
      {
        tokens: {
          tokenA: { amount: 5 },
          tokenC: { amount: 15 },
        },
      },
    ] as unknown as SwapDto[];

    const currentPrices = {
      tokenA: 2,
      tokenB: 3,
      // tokenC does not have a price
    };

    const result = addCurrentValueToSwappedTokens(swaps, currentPrices);

    expect(result[0].tokens.tokenA.valueNow).toBe(20);
    expect(result[0].tokens.tokenB.valueNow).toBe(60);
    expect(result[1].tokens.tokenA.valueNow).toBe(10);
    expect(result[1].tokens.tokenC.valueNow).toBeUndefined(); // No price for tokenC
  });

  test('should leave valueNow as undefined if no price is available for the token', () => {
    const swaps: SwapDto[] = [
      {
        tokens: {
          tokenX: { amount: 50 },
        },
      },
    ] as unknown as SwapDto[];

    const currentPrices = {};

    const result = addCurrentValueToSwappedTokens(swaps, currentPrices);

    expect(result[0].tokens.tokenX.valueNow).toBeUndefined();
  });

  test('should handle empty swaps array gracefully', () => {
    const swaps: SwapDto[] = [];
    const currentPrices = {
      tokenA: 1,
    };

    const result = addCurrentValueToSwappedTokens(swaps, currentPrices);

    expect(result).toEqual([]);
  });

  test('should handle swaps with no tokens', () => {
    const swaps: SwapDto[] = [
      {
        tokens: {},
      },
    ] as unknown as SwapDto[];

    const currentPrices = {
      tokenA: 1,
    };

    const result = addCurrentValueToSwappedTokens(swaps, currentPrices);

    expect(result[0].tokens).toEqual({});
  });
});

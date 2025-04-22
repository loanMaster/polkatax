import { expect, jest, test, describe } from '@jest/globals';
import { getTxLink } from './tx-link';

jest.mock('../const/block-explorers', () => ({
  blockExplorers: {
    ethereum: 'https://etherscan.io/tx/',
    moonbeam: 'https://moonscan.io/tx/',
  },
}));

describe('getTxLink', () => {
  test('should return the correct link for a substrate chain', () => {
    const hash = '0xabc123';
    const chainName = 'polkadot';

    const result = getTxLink(hash, chainName);

    expect(result).toBe('https://polkadot.subscan.io/tx/0xabc123');
  });

  test('should return the correct link for a substrate chain (another example)', () => {
    const hash = '0xdef456';
    const chainName = 'kusama';

    const result = getTxLink(hash, chainName);

    expect(result).toBe('https://kusama.subscan.io/tx/0xdef456');
  });

  test('should return the specific link format for a chain listes in blockExplorers', () => {
    const hash = '0xghi789';
    const chainName = 'ethereum';

    const result = getTxLink(hash, chainName);

    expect(result).toBe('https://etherscan.io/tx/0xghi789');
  });

  test('should return the specific link format for a chain listes in blockExplorers (another example)', () => {
    const hash = '0xjkl012';
    const chainName = 'moonbeam';

    const result = getTxLink(hash, chainName);

    expect(result).toBe('https://moonscan.io/tx/0xjkl012');
  });
});

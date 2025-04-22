import { expect, jest, test, describe, afterEach } from '@jest/globals';
import { fetchNominationPools } from './fetch-nomination-pools';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('fetchNominationPools', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should return an empty array for unsupported chains', async () => {
    const unsupportedChain = 'ethereum';
    const result = await fetchNominationPools(unsupportedChain);
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should fetch and return nomination pools for "polkadot" chain', async () => {
    const mockResponse = { data: { list: [{ id: 1, name: 'Pool1' }] } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchNominationPools('polkadot');

    expect(result).toEqual(mockResponse.data.list);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://polkadot.api.subscan.io/api/scan/nomination_pool/pools',
      { method: 'POST', body: JSON.stringify({}) }
    );
  });

  test('should fetch and return nomination pools for "kusama" chain', async () => {
    const mockResponse = { data: { list: [{ id: 2, name: 'Pool2' }] } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchNominationPools('kusama');

    expect(result).toEqual(mockResponse.data.list);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://kusama.api.subscan.io/api/scan/nomination_pool/pools',
      { method: 'POST', body: JSON.stringify({}) }
    );
  });

  test('should throw an error if the fetch response is not ok', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    };
    mockFetch.mockResolvedValueOnce(errorResponse as any);

    await expect(fetchNominationPools('polkadot')).rejects.toEqual(
      errorResponse
    );
  });
});

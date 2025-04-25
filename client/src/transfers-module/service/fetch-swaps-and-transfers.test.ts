import { expect, test, describe, jest, beforeEach } from '@jest/globals';

import { fetchSwapsAndTransfers } from './fetch-swaps-and-transfers';
import { PaymentsResponseDto } from '../model/payments-response.dto';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('fetchSwapsAndTransfers', () => {
  const mockResponse: PaymentsResponseDto = {
    // mock the structure of PaymentsResponseDto as needed
    tokens: {},
    swaps: {},
  } as unknown as PaymentsResponseDto;

  const chain = 'Polkadot';
  const address = '5F3sa2TJ...';
  const currency = 'USD';
  const beginDate = 1704067200000;
  const endDate = 1706745599000;

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('should fetch data and return a PaymentsResponseDto', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchSwapsAndTransfers(
      chain,
      address,
      currency,
      beginDate,
      endDate
    );

    expect(fetch).toHaveBeenCalledWith(
      `/api/payments/${chain.toLowerCase()}/${address}?startdate=${beginDate}&enddate=${endDate}&currency=${currency}`,
      { method: 'GET' }
    );
    expect(result).toEqual(mockResponse);
  });

  test('should throw an error if response is not ok', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    };
    mockFetch.mockResolvedValueOnce(errorResponse as any);

    await expect(
      fetchSwapsAndTransfers(chain, address, currency, beginDate, endDate)
    ).rejects.toEqual(errorResponse);
  });
});

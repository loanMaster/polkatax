import { expect, jest, it, describe, beforeEach } from '@jest/globals';
import { formatDateUTC } from '../../shared-module/util/date-utils';
import saveAs from 'file-saver';
import { exportKoinlyCsv } from './export-koinly-csv';

// Mocks
const parse = jest.fn().mockReturnValue('csv_content');
jest.mock('@json2csv/plainjs', () => {
  return {
    Parser: jest.fn().mockImplementation(() => ({
      parse,
    })),
  };
});

jest.mock('file-saver', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../shared-module/util/date-utils', () => ({
  formatDateUTC: jest.fn(),
}));

describe('exportKoinlyCsv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format data and save as CSV', () => {
    const mockRewards = {
      token: 'ABC',
      values: [
        { timestamp: 1650000000, amount: 10, hash: 'hash123' },
        { timestamp: 1650001000, amount: -5, hash: 'hash456' },
      ],
    } as any;

    (formatDateUTC as jest.Mock).mockImplementation((ts) => `formatted-${ts}`);

    exportKoinlyCsv(mockRewards);

    const expectedRows = [
      {
        'Koinly Date': 'formatted-1650000000000',
        Amount: 10,
        Currency: 'ABC',
        Label: 'Reward',
        TxHash: 'hash123',
      },
      {
        'Koinly Date': 'formatted-1650001000000',
        Amount: -5,
        Currency: 'ABC',
        Label: 'Cost',
        TxHash: 'hash456',
      },
    ];

    // Assert parser is used correctly
    expect(parse).toHaveBeenCalledWith(expectedRows);

    // Assert saveAs is called with Blob containing CSV
    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'staking-rewards.csv'
    );
  });
});

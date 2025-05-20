import { jest, expect, it, describe } from '@jest/globals';

import { RewardDto } from '../../model/rewards';
import * as dateUtils from '../../../shared-module/util/date-utils';
import { addIsoDateAndCurrentValue } from './add-iso-date-and-current-value';

describe('addIsoDateAndCurrentValue', () => {
  it('adds isoDate and valueNow when currentPrice is defined', () => {
    const input: RewardDto[] = [
      { amount: 2, timestamp: 1609459200 }, // 2021-01-01T00:00:00Z
      { amount: 3, timestamp: 1609545600 }, // 2021-01-02T00:00:00Z
    ] as any;

    const mockFormatDate = jest
      .spyOn(dateUtils, 'formatDate')
      .mockImplementation((ts) => new Date(ts).toISOString());

    const result = addIsoDateAndCurrentValue(input, 10);

    expect(result).toEqual([
      {
        amount: 2,
        timestamp: 1609459200,
        isoDate: '2021-01-01T00:00:00.000Z',
        valueNow: 20,
      },
      {
        amount: 3,
        timestamp: 1609545600,
        isoDate: '2021-01-02T00:00:00.000Z',
        valueNow: 30,
      },
    ]);

    mockFormatDate.mockRestore();
  });

  it('sets valueNow to undefined if currentPrice is undefined', () => {
    const input: RewardDto[] = [{ amount: 5, timestamp: 1609459200 }] as any;

    const mockFormatDate = jest
      .spyOn(dateUtils, 'formatDate')
      .mockReturnValue('mocked-date');

    const result = addIsoDateAndCurrentValue(input, undefined);

    expect(result).toEqual([
      {
        amount: 5,
        timestamp: 1609459200,
        isoDate: 'mocked-date',
        valueNow: undefined,
      },
    ]);

    mockFormatDate.mockRestore();
  });

  it('returns an empty array if input is empty', () => {
    const result = addIsoDateAndCurrentValue([], 10);
    expect(result).toEqual([]);
  });
});

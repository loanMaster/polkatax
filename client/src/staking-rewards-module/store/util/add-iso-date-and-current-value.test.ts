import { expect, test, describe } from '@jest/globals';
import { addIsoDateAndCurrentValue } from './add-iso-date-and-current-value';
import { RewardDto } from '../../model/rewards';

describe('addIsoDateAndCurrentValue', () => {
  test('should add isoDate and calculate valueNow when currentPrice is defined', () => {
    const input: RewardDto[] = [
      { date: 1713782400, amount: 5 }, // corresponds to 2024-04-22
      { date: 1713868800, amount: 3 }, // corresponds to 2024-04-23
    ] as RewardDto[];
    const currentPrice = 2;

    const result = addIsoDateAndCurrentValue(input, currentPrice);

    expect(result).toEqual([
      {
        date: 1713782400,
        amount: 5,
        isoDate: '2024-04-22',
        valueNow: 10,
      },
      {
        date: 1713868800,
        amount: 3,
        isoDate: '2024-04-23',
        valueNow: 6,
      },
    ]);
  });

  test('should return valueNow as undefined if currentPrice is undefined', () => {
    const input: RewardDto[] = [{ date: 1713782400, amount: 5 }] as RewardDto[];

    const result = addIsoDateAndCurrentValue(input, undefined);

    expect(result).toEqual([
      {
        date: 1713782400,
        amount: 5,
        isoDate: '2024-04-22',
        valueNow: undefined,
      },
    ]);
  });
});

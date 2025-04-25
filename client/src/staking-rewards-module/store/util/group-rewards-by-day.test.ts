import { expect, test, describe } from '@jest/globals';
import { Reward } from '../../model/rewards';
import { groupRewardsByDay } from './group-rewards-by-day';

describe('groupRewardsByDay', () => {
  test('should group rewards by isoDate and sum values correctly', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-20', amount: 5, value: 50, valueNow: 60 },
      { isoDate: '2024-04-20', amount: 3, value: 30, valueNow: 40 },
      { isoDate: '2024-04-21', amount: 2, value: 20, valueNow: 25 },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result).toEqual({
      '2024-04-20': {
        amount: 8,
        value: 80,
        valueNow: 100,
      },
      '2024-04-21': {
        amount: 2,
        value: 20,
        valueNow: 25,
      },
    });
  });

  test('should return undefined for value if any value is undefined in a group', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-20', amount: 5, value: 50, valueNow: 60 },
      { isoDate: '2024-04-20', amount: 3, value: undefined, valueNow: 40 },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result['2024-04-20'].value).toBeUndefined();
    expect(result['2024-04-20'].valueNow).toBe(100);
  });

  test('should return undefined for valueNow if any valueNow is undefined in a group', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-21', amount: 4, value: 20, valueNow: 25 },
      { isoDate: '2024-04-21', amount: 2, value: 10, valueNow: undefined },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result['2024-04-21'].value).toBe(30);
    expect(result['2024-04-21'].valueNow).toBeUndefined();
  });

  test('should handle empty reward list', () => {
    const rewards: Reward[] = [];

    const result = groupRewardsByDay(rewards);

    expect(result).toEqual({});
  });

  test('should group correctly with only one reward', () => {
    const rewards: Reward[] = [
      { isoDate: '2024-04-22', amount: 1, value: 10, valueNow: 12 },
    ] as Reward[];

    const result = groupRewardsByDay(rewards);

    expect(result).toEqual({
      '2024-04-22': {
        amount: 1,
        value: 10,
        valueNow: 12,
      },
    });
  });
});

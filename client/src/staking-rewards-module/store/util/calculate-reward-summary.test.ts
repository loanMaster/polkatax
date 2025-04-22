import { expect, test, describe } from '@jest/globals';
import { Reward, RewardSummary } from '../../model/rewards';
import { calculateRewardSummary } from './calculate-reward-summary';

describe('calculateRewardSummary', () => {
  test('should correctly summarize rewards', () => {
    const rewards: Reward[] = [
      { amount: 10, value: 100, valueNow: 120 },
      { amount: 5, value: 50, valueNow: 60 },
      { amount: 2, value: 20, valueNow: 25 },
    ] as Reward[];

    const expected: RewardSummary = {
      amount: 17,
      value: 170,
      valueNow: 205,
    };

    const result = calculateRewardSummary(rewards);
    expect(result).toEqual(expected);
  });

  test('should return zeros when the rewards array is empty', () => {
    const rewards: Reward[] = [];

    const expected: RewardSummary = {
      amount: 0,
      value: 0,
      valueNow: 0,
    };

    const result = calculateRewardSummary(rewards);
    expect(result).toEqual(expected);
  });

  test('should handle rewards with zero values', () => {
    const rewards: Reward[] = [
      { amount: 0, value: 0, valueNow: 0 },
      { amount: 0, value: 0, valueNow: 0 },
    ] as Reward[];

    const expected: RewardSummary = {
      amount: 0,
      value: 0,
      valueNow: 0,
    };

    const result = calculateRewardSummary(rewards);
    expect(result).toEqual(expected);
  });

  test('should handle rewards with undefined values', () => {
    const rewards: Reward[] = [
      { amount: 10, value: undefined, valueNow: 20 },
      { amount: 20, value: 10, valueNow: undefined },
    ] as Reward[];

    const expected: RewardSummary = {
      amount: 30,
      value: undefined,
      valueNow: undefined,
    };

    const result = calculateRewardSummary(rewards);
    expect(result).toEqual(expected);
  });
});

import { Reward } from '../../model/rewards';

export function groupRewardsByDay(rewards: Reward[]) {
  const groupedByDay: {
    [key: string]: { amount: number; value: number; valueNow: number };
  } = {};
  rewards.forEach((r: Reward) => {
    if (!groupedByDay[r.isoDate!]) {
      groupedByDay[r.isoDate!] = {
        amount: 0,
        value: 0,
        valueNow: 0,
      };
    }
    groupedByDay[r.isoDate!].amount += r.amount;
    groupedByDay[r.isoDate!].value += r.value;
    groupedByDay[r.isoDate!].valueNow += r.valueNow || 0;
  });
  return groupedByDay;
}

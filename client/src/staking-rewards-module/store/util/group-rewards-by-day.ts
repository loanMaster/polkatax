import { Reward } from '../../model/rewards';

export function groupRewardsByDay(rewards: Reward[]) {
  return rewards.reduce<{
    [key: string]: {
      amount: number;
      value: number | undefined;
      valueNow: number | undefined;
    };
  }>((groupedByDay, reward) => {
    if (!groupedByDay[reward.isoDate!]) {
      groupedByDay[reward.isoDate!] = {
        amount: 0,
        value: 0,
        valueNow: 0,
      };
    }
    const todayValue = groupedByDay[reward.isoDate!];
    groupedByDay[reward.isoDate!].amount += reward.amount;
    groupedByDay[reward.isoDate!].value =
      todayValue.value !== undefined && reward.value !== undefined
        ? todayValue.value + reward.value
        : undefined;
    groupedByDay[reward.isoDate!].valueNow =
      todayValue.valueNow !== undefined && reward.valueNow !== undefined
        ? todayValue.valueNow + reward.valueNow
        : undefined;
    return groupedByDay;
  }, {});
}

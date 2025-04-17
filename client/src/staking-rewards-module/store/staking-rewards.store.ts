import { defineStore } from 'pinia';
import { StakingRewardsService } from '../service/staking-rewards.service';
import { Reward, RewardDto, Rewards } from '../model/rewards';
import { TimeFrames } from '../../shared-module/model/time-frames';
import { formatDate } from '../../shared-module/util/date-utils';
import { getEndDate, getStartDate } from '../../shared-module/util/date-utils';

function groupRewardsByDay(rewards: Reward[]) {
  const groupedByDay: {
    [key: string]: { amount: number; value: number; valueNow: number };
  } = {};
  rewards.forEach((r: Reward) => {
    if (!groupedByDay[r.isoDate]) {
      groupedByDay[r.isoDate] = {
        amount: 0,
        value: 0,
        valueNow: 0,
      };
    }
    groupedByDay[r.isoDate].amount += r.amount;
    groupedByDay[r.isoDate].value += r.value;
    groupedByDay[r.isoDate].valueNow += r.valueNow || 0;
  });
  return groupedByDay;
}

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards: undefined as Rewards | undefined,
      nominationPoolId: 0,
      chain: '',
      currency: '',
      address: '',
      timeFrame: TimeFrames.currentMonth as string,
    };
  },
  getters: {
    token(): string {
      return tokenList.find((t) => t.chain === this.chain)?.symbol || '';
    },
  },
  actions: {
    async fetchRewards() {
      const startDate = getStartDate(this.timeFrame);
      const endDate = getEndDate(this.timeFrame);
      const rewardsDto = await new StakingRewardsService().fetchStakingRewards(
        this.chain,
        this.address.trim(),
        this.currency,
        this.nominationPoolId,
        startDate,
        endDate
      );
      this.rewards = {
        values: [],
        summary: {
          amount: 0,
          value: 0,
          valueNow: 0,
        },
        nominationPoolId: this.nominationPoolId,
        currentPrice: rewardsDto.currentPrice,
        timeFrame: this.timeFrame,
        startDate,
        endDate,
        chain: this.chain,
        token: rewardsDto.token,
        currency: this.currency,
        address: this.address,
        dailyValues: {},
      };
      this.rewards!.values = rewardsDto.values.map((v: RewardDto) => {
        const isoDate = formatDate(v.date * 1000);
        const reward = {
          ...v,
          isoDate: isoDate,
          valueNow: v.amount * rewardsDto.currentPrice,
        };
        this.rewards!.summary.amount += v.amount;
        this.rewards!.summary.value += v.value;
        this.rewards!.summary.valueNow += reward.valueNow;
        return reward as Reward;
      });
      this.rewards!.values.sort((a, b) => (a > b ? 1 : -1));
      this.rewards!.dailyValues = groupRewardsByDay(this.rewards!.values);
    },
  },
});

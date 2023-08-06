import { defineStore } from 'pinia';
import { StakingRewardsService } from '../service/staking-rewards.service';
import { Reward, RewardDto, Rewards } from '../model/rewards';
import { TimeFrames } from '../model/time-frames';
import { tokenList } from '../const/tokenList';

const getStartOfCurrentDay = () => {
  const temp = new Date();
  temp.setMilliseconds(0);
  temp.setMinutes(0);
  temp.setHours(0);
  return temp;
};

const getStartDate = (timeFrame: string) => {
  const temp = getStartOfCurrentDay();
  switch (timeFrame) {
    case TimeFrames.currentMonth:
      temp.setDate(1);
      break;
    case TimeFrames.currentYear:
      temp.setDate(1);
      temp.setMonth(0);
      break;
    case TimeFrames.lastSevenDays:
      temp.setDate(temp.getDate() - 7);
      break;
    case TimeFrames.lastThirtyDays:
      temp.setDate(temp.getDate() - 30);
      break;
    case TimeFrames.lastMonth:
      temp.setDate(1);
      temp.setMonth(temp.getMonth() - 1);
      break;
    case TimeFrames.lastYear:
      temp.setDate(1);
      temp.setMonth(0);
      temp.setFullYear(temp.getFullYear() - 1);
      break;
  }
  return temp.getTime();
};

const getEndDate = (timeFrame: string) => {
  const temp = getStartOfCurrentDay();
  switch (timeFrame) {
    case TimeFrames.currentMonth:
    case TimeFrames.currentYear:
    case TimeFrames.lastSevenDays:
    case TimeFrames.lastThirtyDays:
      temp.setDate(temp.getDate() + 1);
      break;
    case TimeFrames.lastMonth:
      temp.setDate(1);
      break;
    case TimeFrames.lastYear:
      temp.setDate(1);
      temp.setMonth(0);
      break;
  }
  return temp.getTime();
};

function formatDate(date: number) {
  const d = new Date(date),
    year = d.getFullYear();
  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

export const useRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards: undefined as Rewards | undefined,
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
      const rewardsDto = await new StakingRewardsService().fetchStakingRewards(
        this.chain,
        this.address.trim(),
        this.currency,
        getStartDate(this.timeFrame),
        getEndDate(this.timeFrame)
      );
      this.rewards = {
        values: [],
        summary: {
          amount: 0,
          value: 0,
          valueNow: 0,
        },
        currentPrice: rewardsDto.currentPrice,
        timeFrame: this.timeFrame,
        chain: this.chain,
        token: tokenList.find((t) => t.chain === this.chain)!.symbol,
        currency: this.currency,
        address: this.address,
      };
      this.rewards.values = rewardsDto.values.map((v: RewardDto) => {
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
      return this.rewards;
    },
  },
});

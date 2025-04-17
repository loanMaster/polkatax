import { defineStore } from 'pinia';
import { StakingRewardsService } from '../service/staking-rewards.service';
import { Rewards } from '../model/rewards';
import { TimeFrames } from '../../shared-module/model/time-frames';
import { getEndDate, getStartDate } from '../../shared-module/util/date-utils';
import {
  BehaviorSubject,
  firstValueFrom,
  from,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  switchMap,
} from 'rxjs';
import { Chain } from '../../shared-module/model/chain';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { fetchNominationPools } from '../service/fetch-nomination-pools';
import { calculateRewardSummary } from './helper/calculate-reward-summary';
import { groupRewardsByDay } from './helper/group-rewards-by-day';
import { addIsoDateAndCurrentValue } from './helper/add-iso-date-and-current-value';
import { NominationPool } from '../model/nomination-pool';
import {
  CompletedRequest,
  DataRequest,
  PendingRequest,
} from '../../shared-module/model/data-request';
import { wrapDataRequest } from '../../shared-module/service/wrap-data-request';

const chainList = from(fetchSubscanChains());
const chain = new BehaviorSubject<Chain>({
  domain: 'polkadot',
  label: 'Polkadot relay chain',
  token: 'DOT',
});
const nominationPools: Observable<DataRequest<NominationPool[]>> = chain.pipe(
  switchMap((chain: Chain) =>
    merge(
      of(new PendingRequest<NominationPool[]>([])),
      from(fetchNominationPools(chain.domain)).pipe(wrapDataRequest())
    )
  )
);
const rewards = new ReplaySubject<DataRequest<Rewards>>(1);
const sortRewards = (rewards: Rewards) =>
  rewards.values.sort((a, b) => a.block - b.block);

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards: rewards.asObservable(),
      nominationPoolId: 0,
      currency: '',
      address: '',
      timeFrame: TimeFrames.currentMonth as string,
      chainList,
      chain: chain.asObservable(),
      nominationPools,
    };
  },
  actions: {
    async fetchRewards() {
      const startDate = getStartDate(this.timeFrame);
      const endDate = getEndDate(this.timeFrame);
      const chain = (await firstValueFrom(this.chain)).domain;
      const rewardsDto = await new StakingRewardsService().fetchStakingRewards(
        chain,
        this.address.trim(),
        this.currency,
        this.nominationPoolId,
        startDate,
        endDate
      );
      const valuesWithIsoDate = addIsoDateAndCurrentValue(
        rewardsDto.values,
        rewardsDto.currentPrice
      );
      const result: Rewards = {
        values: valuesWithIsoDate,
        summary: calculateRewardSummary(valuesWithIsoDate),
        nominationPoolId: this.nominationPoolId,
        currentPrice: rewardsDto.currentPrice,
        timeFrame: this.timeFrame,
        startDate,
        endDate,
        chain,
        token: rewardsDto.token,
        currency: this.currency,
        address: this.address,
        dailyValues: groupRewardsByDay(valuesWithIsoDate),
      };
      sortRewards(result);
      rewards.next(new CompletedRequest(result));
    },
  },
});

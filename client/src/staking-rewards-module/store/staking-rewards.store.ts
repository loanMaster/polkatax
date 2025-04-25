import { defineStore } from 'pinia';
import { Rewards } from '../model/rewards';
import { getEndDate, getStartDate } from '../../shared-module/util/date-utils';
import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  from,
  merge,
  Observable,
  of,
  ReplaySubject,
  switchMap,
} from 'rxjs';
import { Chain } from '../../shared-module/model/chain';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { fetchNominationPools } from '../service/fetch-nomination-pools';
import { calculateRewardSummary } from './util/calculate-reward-summary';
import { groupRewardsByDay } from './util/group-rewards-by-day';
import { addIsoDateAndCurrentValue } from './util/add-iso-date-and-current-value';
import { NominationPool } from '../model/nomination-pool';
import {
  CompletedRequest,
  DataRequest,
  PendingRequest,
} from '../../shared-module/model/data-request';
import { wrapDataRequest } from '../../shared-module/service/wrap-data-request';
import { fetchStakingRewards } from '../service/fetch-staking-rewards';

const chainList$ = from(fetchSubscanChains());
const chain$: BehaviorSubject<Chain> = new BehaviorSubject<Chain>({
  domain: 'polkadot',
  label: 'Polkadot',
  token: 'DOT',
});
const nominationPools$: Observable<DataRequest<NominationPool[]>> = chain$.pipe(
  filter((c) => !!c),
  switchMap((chain: Chain) =>
    merge(
      of(new PendingRequest<NominationPool[]>([])),
      from(fetchNominationPools(chain.domain)).pipe(wrapDataRequest())
    )
  )
);
const rewards$ = new ReplaySubject<DataRequest<Rewards>>(1);
const sortRewards = (rewards: Rewards) =>
  rewards.values.sort((a, b) => a.block - b.block);

export const useStakingRewardsStore = defineStore('rewards', {
  state: () => {
    return {
      rewards$: rewards$.asObservable(),
      nominationPoolId: 0,
      currency: 'USD',
      address: '',
      timeFrame: 'This Month',
      chainList$,
      chain$: chain$.asObservable(),
      nominationPools$,
    };
  },
  actions: {
    selectChain(newChain: Chain) {
      chain$.next(newChain);
    },
    async fetchRewards() {
      try {
        rewards$.next(new PendingRequest(undefined));
        const startDate = getStartDate(this.timeFrame);
        const endDate = getEndDate(this.timeFrame);
        const chain = (await firstValueFrom(chain$)).domain;
        const rewardsDto = await fetchStakingRewards(
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
        rewards$.next(new CompletedRequest(result));
      } catch (error) {
        rewards$.next({ pending: false, error, data: undefined });
      }
    },
  },
});

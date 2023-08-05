import { RewardsDto } from '../model/rewards';

export class StakingRewardsService {
  async fetchStakingRewards(
    chain: string,
    address: string,
    currency: string,
    beginDate: number,
    endDate: number
  ): Promise<RewardsDto> {
    const url = new URL(
      `http://localhost:3000/api/staking-rewards/${chain.toLowerCase()}/${address}`
    );
    url.searchParams.append('startdate', String(beginDate));
    url.searchParams.append('enddate', String(endDate));
    url.searchParams.append('currency', currency.toLowerCase());

    const result = await fetch(url, {
      method: 'GET'
    });
    if (!result.ok) {
        throw result
    }
    return result.json();
  }
}

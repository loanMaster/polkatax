import { RewardsDto } from '../model/rewards';

export class StakingRewardsService {
  async fetchStakingRewards(
    chain: string,
    address: string,
    currency: string,
    poolId: number,
    beginDate: number,
    endDate: number
  ): Promise<RewardsDto> {
    const result = await fetch(
      `/api/staking-rewards/${chain.toLowerCase()}/${address}?startdate=${beginDate}&enddate=${endDate}&currency=${currency}&poolid=${poolId}`,
      {
        method: 'GET',
      }
    );
    if (!result.ok) {
      throw result;
    }
    return result.json();
  }
}

import { RewardsDto } from '../model/rewards';

export const fetchStakingRewards = async (
  chain: string,
  address: string,
  currency: string,
  poolId: number | undefined,
  beginDate: number,
  endDate: number
): Promise<RewardsDto> => {
  const result = await fetch(
    `/api/staking-rewards/${chain.toLowerCase()}/${address}?startdate=${beginDate}&enddate=${endDate}&currency=${currency}${
      poolId !== undefined ? '&poolid=' + poolId : ''
    }`,
    {
      method: 'GET',
    }
  );
  if (!result.ok) {
    throw result;
  }
  return result.json();
};

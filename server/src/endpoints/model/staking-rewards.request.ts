export interface StakingRewardsRequest {
    chain: {
        name: string,
        token:  string,
        coingeckoId: string
    },
    address: string;
    poolId?: number;
    currency: string;
    startDay: Date;
    endDay?: Date;
}

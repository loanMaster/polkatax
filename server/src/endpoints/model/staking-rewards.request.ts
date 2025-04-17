export interface StakingRewardsRequest {
    chain: {
        domain: string,
        label:  string,
        token: string
    },
    address: string;
    poolId?: number;
    currency: string;
    startDay: Date;
    endDay?: Date;
}

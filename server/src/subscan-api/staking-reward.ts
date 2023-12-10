export interface StakingReward {
    event_id: "Reward" | "Slash"
    amount: number,
    block_timestamp: number,
    block_num: number
}

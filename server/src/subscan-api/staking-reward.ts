import {BigNumber} from "bignumber.js";

export interface StakingReward {
    event_id: "Reward" | "Slash"
    amount: BigNumber,
    block_timestamp: number,
    block_num: number,
    hash: string
}

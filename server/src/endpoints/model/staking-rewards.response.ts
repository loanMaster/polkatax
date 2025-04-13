import {Transfer} from "../../common/model/transfer";

export interface StakingRewardsResponse {
    values: Transfer[];
    currentPrice: number;
}
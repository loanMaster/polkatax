import { parentPort, workerData } from 'worker_threads';
import { StakingRewardsRequest } from '../model/staking-rewards.request';
import { DIContainer } from '../../di-container';

async function processTask(data: StakingRewardsRequest) {
    const result = await (DIContainer.resolve('stakingRewardsWithFiatService')).fetchStakingRewards(data);
    parentPort?.postMessage(result);
}

processTask(workerData);
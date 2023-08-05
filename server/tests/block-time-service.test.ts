import {describe, expect, test} from '@jest/globals';
import {BlockTimeService} from "../src/service/block-time.service";
import {SubscanService} from "../src/subscan-api/subscan.service";

describe('blockTimeService', () => {
    test('estimate block number given timestamp', async () => {
        const blockTimeService = new BlockTimeService(new SubscanService())
        const time = new Date('2023-02-02').getTime()
        const { blockMin, blockMax, estBlock } = await blockTimeService.estimateBlockNo('polkadot', time)
        expect(blockMax).toBeGreaterThanOrEqual(estBlock)
        expect(blockMin).toBeLessThan(estBlock)
        const block = await new SubscanService().fetchBlock('polkadot', estBlock)
        expect(Math.abs(new Date(block.block_timestamp*1000).getTime() - time)).toBeLessThan(48 * 60 * 60 * 1000)
    });

    test('estimate block number given timestamp in future', async () => {
        const blockTimeService = new BlockTimeService(new SubscanService())
        const time = new Date()
        time.setDate(time.getDate() + 10)
        const now = new Date()
        const { blockMin, blockMax, estBlock } = await blockTimeService.estimateBlockNo('kusama', time.getTime())
        expect(blockMax).toBeGreaterThanOrEqual(estBlock)
        expect(blockMin).toBeLessThan(estBlock)
        const block = await new SubscanService().fetchBlock('kusama', estBlock)
        expect(Math.abs(new Date(block.block_timestamp*1000).getTime() - now.getTime())).toBeLessThan(48 * 60 * 60 * 1000)
    });
});

import {Block} from "../subscan-api/block";
import {SubscanService} from "../subscan-api/subscan.service";
import {logger} from "../logger/logger";

export class BlockTimeService {

    constructor(private subscanService: SubscanService) {
    }

    async searchBlock(chainName: string, date: number, minBlock: Block, maxBlock: Block, tolerance = 3 * 24 * 60 * 60): Promise<number> {
        const estimate = this.estimateBlockNum(minBlock, maxBlock, date)
        const currentBlock: Block = await this.subscanService.fetchBlock(chainName, estimate)
        if (Math.abs(currentBlock.block_timestamp - date / 1000) > tolerance) {
            if (currentBlock?.block_timestamp * 1000 > date) {
                return this.searchBlock(chainName, date, minBlock, currentBlock)
            } else {
                return this.searchBlock(chainName, date, currentBlock, maxBlock)
            }
        }
        return currentBlock.block_num
    }

    estimateBlockNum(beforeBlock: Block, afterBlock: Block, date: number): number {
        const timeDiffRel = (date / 1000 - beforeBlock.block_timestamp) / (afterBlock.block_timestamp - beforeBlock.block_timestamp)
        return Math.min(afterBlock.block_num, Math.max(1, Math.round(beforeBlock.block_num + (afterBlock.block_num - beforeBlock.block_num) * timeDiffRel)))
    }

    async getMinMaxBlock(chainName: string, minDate: number, maxDate?: number): Promise<{ blockMin: number, blockMax: number }> {
        logger.info(`Entry getMinMaxBlock for chain ${chainName} and minDate ${new Date(minDate).toISOString()}, maxDate ${ maxDate ? new Date(maxDate).toISOString() : 'undefined' }`)
        const tolerance = 3 * 24 * 60 * 60
        const meta = await this.subscanService.fetchMetadata(chainName);
        const firstBlock: Block = await this.subscanService.fetchBlock(chainName, 1)
        const lastBlock: Block = (await this.subscanService.fetchBlockList(chainName,  0, 1))[0]
        const blockMin = await this.searchBlock(chainName, Math.max(minDate, firstBlock.block_timestamp * 1000), firstBlock, lastBlock)
        const blockMax = await this.searchBlock(chainName, Math.min(maxDate || Date.now(), lastBlock.block_timestamp * 1000), firstBlock, lastBlock)
        logger.info(`Exit getMinMaxBlock for chain ${chainName}`)
        return {
            blockMin: Math.max(1, Math.round(blockMin - 3 * tolerance / meta.avgBlockTime )),
            blockMax: Math.min(lastBlock.block_num, Math.round(blockMax + 3 * tolerance / meta.avgBlockTime))
        }
    }

}

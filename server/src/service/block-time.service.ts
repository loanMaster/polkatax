import {Block} from "../subscan-api/block";
import {SubscanService} from "../subscan-api/subscan.service";
import {logger} from "../logger/logger";

export class BlockTimeService {

    constructor(private subscanService: SubscanService) {
    }

    async searchBlockBinary(chainName: string, date: number, maxBlock: number, minBlock = 1, estBlockNum = -1, tolerance = 5 * 24 * 60 * 60): Promise<Block> {
        if (estBlockNum === -1) {
            estBlockNum = maxBlock
        }
        const block: Block = await this.subscanService.fetchBlock(chainName, estBlockNum)
        if (Math.abs(block.block_timestamp - date / 1000) > tolerance) {
            if (block?.block_timestamp * 1000 > date) {
                return this.searchBlockBinary(chainName, date, estBlockNum, minBlock, Math.round(minBlock + (estBlockNum - minBlock) / 2))
            } else {
                return this.searchBlockBinary(chainName, date, maxBlock, estBlockNum, Math.round(maxBlock - (maxBlock - estBlockNum) / 2))
            }
        }

        return block
    }

    async estimateBlockNo(chainName: string, date?: number): Promise<{ blockMin: number, estBlock: number, blockTime: number, blockMax: number }> {
        logger.info(`Entry estimateBlockNo for chain ${chainName} and date ${new Date(date).toISOString()}`)
        const meta = await this.subscanService.fetchMetadata(chainName);
        const tolerance = 3 * 24 * 60 * 60
        const block = await this.searchBlockBinary(chainName, date, meta.blockNum, 1, Math.round(meta.blockNum / 2))
        logger.info(`Exit estimateBlockNo for chain ${chainName} and date ${new Date(date).toISOString()} with block estimate ${block.block_num}`)
        return {
            blockMax: block.block_num + 4 * tolerance / meta.avgBlockTime,
            estBlock: block.block_num,
            blockTime: block.block_timestamp,
            blockMin: Math.max(1, block.block_num - 4 * tolerance / meta.avgBlockTime),
        }
    }

}

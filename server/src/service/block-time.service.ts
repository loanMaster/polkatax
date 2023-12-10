import {Block} from "../subscan-api/block";
import {SubscanService} from "../subscan-api/subscan.service";

export class BlockTimeService {

    constructor(private subscanService: SubscanService) {
    }

    async estimateBlockNo(chainName: string, date?: number): Promise<{ blockMin: number, estBlock: number, blockTime: number, blockMax: number }> {
        const TOLERANCE = 24 * 60 * 60;
        const meta = await this.subscanService.fetchMetadata(chainName);
        let estBlock = meta.blockNum
        let dateNowSeconds = new Date().getTime() / 1000;
        if (!date || date / 1000 >= dateNowSeconds - TOLERANCE) {
            return {
                blockMax: estBlock,
                estBlock: estBlock,
                blockTime: dateNowSeconds,
                blockMin: Math.max(estBlock - 2 * TOLERANCE / meta.avgBlockTime),
            }
        }
        let block: Block
        let counter = 0
        do {
            const dateSeconds = date / 1000;
            estBlock = Math.max(1, Math.round(estBlock - ((block?.block_timestamp || dateNowSeconds) - dateSeconds) / meta.avgBlockTime))
            block = await this.subscanService.fetchBlock(chainName, estBlock)
            if (estBlock === 1) {
                break
            }
            counter++
        } while (Math.abs(block.block_timestamp - date / 1000) > TOLERANCE);

        return {
            blockMax: block.block_num + 2 * TOLERANCE / meta.avgBlockTime,
            estBlock: block.block_num,
            blockTime: block.block_timestamp,
            blockMin: Math.max(1, block.block_num - 2 * TOLERANCE / meta.avgBlockTime),
        }
    }

}

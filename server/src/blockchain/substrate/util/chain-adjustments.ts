import { Swap } from '../../../common/model/swap'

export class ChainAdjustments {
    handleHydration(swaps: Swap[]) {
        swaps.forEach(s => {
            if (Object.keys(s.tokens).length > 2) {
                const sold = Object.keys(s.tokens).filter(t => s.tokens[t].type === 'sell')
                const bought = Object.keys(s.tokens).filter(t => s.tokens[t].type === 'buy')
                for (const poolToken of ['2-pool', '4-pool']) {
                    if ((sold.includes(poolToken) && sold.length > 1) ||
                        (bought.includes(poolToken) && bought.length > 1)) {
                        delete s.tokens[poolToken]
                    }
                }
            }
        })
    }
}
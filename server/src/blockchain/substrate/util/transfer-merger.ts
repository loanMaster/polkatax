import { Transfers } from '../model/transfer'

export class TransferMerger {
    merge(target: Transfers, source: Transfers): Transfers {
        Object.entries(source).forEach(([hash, transfer]) => {
            target[hash] ??= {}
            Object.entries(transfer).forEach(([token, data]) => {
                target[hash][token] ??= { ...data, amount: 0 }
                target[hash][token].amount += data.amount
            })
        })
        return target
    }
}
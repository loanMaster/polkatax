import { TransferDto } from "src/server/blockchain/substrate/model/raw-transfer";
import coingeckoTokens from "../../../../res/coingecko-tokens.json";
import { TransferWithFiatValue } from "../model/priced-transfer";

interface CoingeckoToken {
    id: string
    symbol: string
    name: string
    platforms: {
      [platform: string]: string
    }
}

export class CoingeckoIdLookupService {
    addCoingeckoIds(transfers: TransferWithFiatValue[]): string[] {
        const tokenIdToCoingeckoIdMap: { [tokenId: string]: { id: string | undefined } } = {}
        transfers.forEach(t => {
            if (!tokenIdToCoingeckoIdMap[t.asset_unique_id || t.contract]) {
                tokenIdToCoingeckoIdMap[t.asset_unique_id || t.contract] = { id: this.findCoingeckoId(t) }
            } 
            t.coingeckoId = tokenIdToCoingeckoIdMap[t.asset_unique_id || t.contract].id
        })
        return Object.values(tokenIdToCoingeckoIdMap).filter(v => v.id).map(v => v.id)
    }

    findCoingeckoId(token: TransferDto): string | undefined {
        const candidates = coingeckoTokens.filter(t => t.symbol == token.symbol.toLowerCase())
        if (candidates.length === 1) {
            return candidates[0].id
        }token
        return token.asset_unique_id ? this.findCoingeckoIdByUniqueId(candidates, token.asset_unique_id) : this.findCoingeckoIdByContractAddress(candidates, token.contract)
    }

    findCoingeckoIdByContractAddress(candidates: CoingeckoToken[], contract: string): string | undefined {
        return candidates.find(t => Object.values(t.platforms).indexOf(contract.toLowerCase()) > -1)?.id
    }

    findCoingeckoIdByUniqueId(candidates: CoingeckoToken[], asset_unique_id: string): string | undefined {
        return undefined // #TODO
    }
}
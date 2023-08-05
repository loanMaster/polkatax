import * as substrateChains from "../res/substrate-chains.json"
import {fetchQuotesLogger} from "./logger/fetch-quotes-logger";
import {PriceHistoryService} from "./service/price-history.service";
import {CoingeckoService} from "./coingecko-api/coingecko.service";

const chains = substrateChains.chains;
let index = 0;
const priceHistoryService = new PriceHistoryService(new CoingeckoService());

(async function loop() {
    fetchQuotesLogger.info(`Chain ${chains[index].name}`)
    await priceHistoryService.fetchMissingQuotesForCoin(chains[index].coingeckoId, chains[index].token, '2023-07-01')
    index = (index + 1) % substrateChains.chains.length
    setTimeout(async () => {
        await loop();
    }, 120 * 60 * 1000 / substrateChains.chains.length);
})();


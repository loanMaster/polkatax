import * as parachains from "../res/parachains.json";
import {fetchQuotesLogger} from "./logger/fetch-quotes-logger";
import {PriceHistoryService} from "./service/price-history.service";
import {CoingeckoService} from "./coingecko-api/coingecko.service";

const chains = parachains.chains;
let index = 0;
const priceHistoryService = new PriceHistoryService(new CoingeckoService());

(async function loop() {
    if (index === 0) {
        fetchQuotesLogger.info(`Starting loop.`)
    }
    await priceHistoryService.fetchMissingQuotesForCoin(chains[index].coingeckoId, chains[index].token, '2023-01-01')
    index = (index + 1) % parachains.chains.length
    setTimeout(async () => {
        await loop();
    }, 10 * 60 * 1000 / parachains.chains.length);
})();


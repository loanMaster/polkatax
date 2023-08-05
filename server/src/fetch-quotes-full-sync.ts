import {PriceHistoryService } from "./service/price-history.service";
import {CoingeckoService} from "./coingecko-api/coingecko.service";

new PriceHistoryService(new CoingeckoService()).runInitialSync()


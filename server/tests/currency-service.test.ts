import {describe, expect, test} from '@jest/globals';
import {BlockTimeService} from "../src/service/block-time.service";
import {SubscanService} from "../src/subscan-api/subscan.service";
import {CurrencyService} from "../src/service/currency.service";
import {PriceHistoryService} from "../src/service/price-history.service";

describe('currencyService', () => {
    test('should enrich data with fiat currency values', async () => {
        const now = new Date()
        const currentPrice = 5.1
        const isoDateNow = now.toISOString().substring(0, 10)
        const data = [
            { block_timestamp: now.getTime() / 1000, block_num: 200, amount: 17 },
            { block_timestamp: new Date('2023-03-07').getTime() / 1000, block_num: 123, amount: 12 }
        ]
        const priceHistoryService = {
            getQuotes: (symbol: string) => {
                expect(symbol).toEqual('dot')
                return {
                    '2023-03-07': { cad: 10 },
                    [isoDateNow]: { cad: 7 }
                }
            }
        }
        const currencyService = new CurrencyService(priceHistoryService as unknown as PriceHistoryService)
        const values = await currencyService.addFiatValues(data, 'dot', 'cad', currentPrice)
        expect(values[0].date).toEqual(data[0].block_timestamp)
        expect(values[0].amount).toEqual(data[0].amount)
        expect(values[0].price).toEqual(currentPrice)
        expect(values[0].value).toEqual(currentPrice * data[0].amount)

        const expectedPrice = priceHistoryService.getQuotes('dot')['2023-03-07']['cad']
        expect(values[1].date).toEqual(data[1].block_timestamp)
        expect(values[1].amount).toEqual(data[1].amount)
        expect(values[1].price).toEqual(expectedPrice)
        expect(values[1].value).toEqual(expectedPrice *  data[1].amount)
    });


});

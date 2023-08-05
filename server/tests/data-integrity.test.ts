import {describe, expect, test} from '@jest/globals';
import {PriceHistoryService, Quotes} from "../src/service/price-history.service";
import {fiatCurrencies} from "../src/const/fiat-currencies";
import * as substrateChains from "../res/substrate-chains.json"

/**
 * This test will only succeed after historic price data has been completely synchronized
 */
describe('verify the integrity / completeness of the historic data', () => {

    const getStartAndEndDate = (quotes: Quotes) => {
        const sortedDates = Object.keys(quotes).sort((a,b) => a > b ? 1 : -1)
        return { startDate: sortedDates[0], endDate: sortedDates[sortedDates.length - 1] }
    }

    test('data should be available for all supported fiat currencies', async () => {
        const priceHistoryService = new PriceHistoryService(undefined)
        substrateChains.chains.forEach((chain) => {
            const quotes = priceHistoryService.getQuotes(chain.token)
            Object.keys(quotes).forEach(isoDate => {
                for (let currency of fiatCurrencies) {
                    expect(quotes[isoDate][currency]).not.toBeUndefined()
                }
            })
        })
    });

    test('data should not have a any gaps', async () => {
        const priceHistoryService = new PriceHistoryService(undefined)
        substrateChains.chains.forEach((chain) => {
            const quotes = priceHistoryService.getQuotes(chain.token)
            const { startDate, endDate } = getStartAndEndDate(quotes)
            const temp = new Date(startDate + 'T00:00:00.000Z')
            let isoDate = ''
            do {
                isoDate = temp.toISOString().substring(0, 10)
                expect(quotes[isoDate]['usd']).not.toBeUndefined()
                temp.setDate(temp.getDate() + 1)
            } while (isoDate !== endDate)
        })
    });

    test('only newest dates should have temporary flag', async () => {
        const priceHistoryService = new PriceHistoryService(undefined)
        substrateChains.chains.forEach((chain) => {
            const quotes = priceHistoryService.getQuotes(chain.token)
            const { startDate, endDate } = getStartAndEndDate(quotes)
            const temp = new Date(startDate + 'T00:00:00.000Z')
            let isoDate = ''
            do {
                isoDate = temp.toISOString().substring(0, 10)
                if (isoDate === endDate) {
                    expect(quotes[isoDate].temporary).toBeTruthy()
                } else if (new Date(endDate + 'T00:00:00.000Z').getTime() - temp.getTime() > 48 * 60 * 60 * 1000) {
                    expect(quotes[isoDate].temporary).toBeFalsy()
                }
                temp.setDate(temp.getDate() + 1)
            } while (isoDate !== endDate)
        })
    });
});

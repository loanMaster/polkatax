import {test,expect, describe, beforeEach, jest, afterEach } from '@jest/globals'
import { CoingeckoRestService } from '../coingecko-api/coingecko.rest-service';
import * as tokenUtil from '../../common/util/find-coingecko-token-id';
import * as fs from 'fs';
import { TokenPriceHistoryService } from './token-price-history.service';

jest.mock('fs');
jest.mock('../../common/util/find-coingecko-token-id');
jest.mock('../../common/util/date-utils', () => ({
    formatDate: jest.fn(() => '2024-04-23')
}));

describe('TokenPriceHistoryService', () => {
    let service: TokenPriceHistoryService;
    let mockCoingecko: jest.Mocked<CoingeckoRestService>;

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2024-04-24T00:00:00Z'));
        mockCoingecko = {
            fetchHistoricalData: jest.fn()
        } as any;
        service = new TokenPriceHistoryService(mockCoingecko);
        (TokenPriceHistoryService as any).cachedPrices = {};
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        (fs.readFileSync as jest.Mock).mockReturnValue('{}');
        (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.resetAllMocks();
    });

    test('should fetch and cache historic prices for token', async () => {
        (tokenUtil.findCoingeckoToken as jest.Mock).mockReturnValue({ id: 'eth-id' });

        mockCoingecko.fetchHistoricalData.mockResolvedValue({
            '2024-04-23': 2500,
            timestamp: new Date().getTime()
        });

        const result = await service.getHistoricPrices('ETH', 'usd');
        expect(mockCoingecko.fetchHistoricalData).toHaveBeenCalledWith('eth-id', 'usd');
        expect(result).toEqual({
            currency: 'usd',
            quotes: {
                '2024-04-23': 2500,
                timestamp: new Date().getTime()
            }
        });
    });

    test('should handle synonyms', async () => {
        (tokenUtil.findCoingeckoToken as jest.Mock).mockReturnValue({ id: 'eth-id' });

        mockCoingecko.fetchHistoricalData.mockResolvedValue({
            '2024-04-23': 2500,
            timestamp: new Date().getTime()
        });

        const prices = await service.getHistoricPrices('weth', 'usd');
        expect(tokenUtil.findCoingeckoToken).toHaveBeenCalledWith('eth', 'polkadot');
    });

    test('should not refetch if data is cached and up to date', async () => {
        const cached = {
            'btc_usd': {
                '2024-04-23': 60000,
                timestamp: new Date().getTime()
            }
        };
        (tokenUtil.findCoingeckoToken as jest.Mock).mockReturnValue({ id: 'bitcoin' });
        (TokenPriceHistoryService as any).cachedPrices = cached;

        const result = await service.getHistoricPrices('btc', 'usd');
        expect(mockCoingecko.fetchHistoricalData).not.toHaveBeenCalled();
        expect(result.quotes).toEqual(cached['btc_usd']);
    });

    test('should throw error if token not found', async () => {
        (tokenUtil.findCoingeckoToken as jest.Mock).mockReturnValue(undefined);

        await expect(service.getHistoricPrices('nonexistent', 'usd')).rejects.toThrow(
            'Token nonexistent not found in coingecko list.'
        );
    });
});
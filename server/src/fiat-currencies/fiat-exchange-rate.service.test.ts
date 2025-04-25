import fs from 'fs';
import {test,expect, describe, beforeEach, jest } from '@jest/globals'
import { ExchangeRateRestService } from './exchange-rate-api/exchange-rate.rest-service';
import { ExchangeRates } from './model/exchange-rates';
import { FiatExchangeRateService } from './fiat-exchange-rate.service';

jest.mock('fs');

describe('FiatExchangeRateService', () => {
    let mockRestService: jest.Mocked<ExchangeRateRestService>;
    let service: FiatExchangeRateService;

    const mockExchangeRates: ExchangeRates = {
        '2024-01-01': { USD: 1.0, EUR: 0.9 },
        '2024-12-31': { USD: 1.1, EUR: 0.95 }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockRestService = {
            fetchTimeSeries: jest.fn(() => Promise.resolve(mockExchangeRates))
        } as any;

        (fs.existsSync as jest.Mock).mockReturnValue(false);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));

        service = new FiatExchangeRateService(mockRestService);
    });

    describe('getExchangeRates()', () => {
        test('returns empty object if file does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            const rates = service.getExchangeRates();
            expect(rates).toEqual({});
        });

        test('returns parsed rates if file exists', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockExchangeRates));

            const rates = service.getExchangeRates();
            expect(rates).toEqual(mockExchangeRates);
        });
    });

    describe('sync()', () => {
        test('fetches and writes new rates for current and past year', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));

            await (service as any).sync(); // Accessing private method for testing

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('currency-exchange.rates.json'),
                JSON.stringify({
                    ...mockExchangeRates
                })
            );
        });

        test('fetches 10 years if no previous rates', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.readFileSync as jest.Mock).mockReturnValue('{}');

            await (service as any).sync();

            expect(mockRestService.fetchTimeSeries).toHaveBeenCalledTimes(11);
        });
    });

    describe('endOfYearOrNow()', () => {
        test('returns Dec 31 if year is past', () => {
            const result = (service as any).endOfYearOrNow(2020);
            expect(result).toBe('2020-12-31');
        });

        test('returns today’s date if year is future', () => {
            const nextYear = new Date().getFullYear() + 1;
            const result = (service as any).endOfYearOrNow(nextYear);
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });
});
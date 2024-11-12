import "node-fetch";
import {HttpError} from "../error/HttpError";
import {logger} from "../logger/logger";
import { parse } from 'node-html-parser';
import { Quotes } from 'src/service/token-price-history.service';

export class CoingeckoService {
    async fetchPrices(tokenIds: string[], currency: string): Promise<{[tokenId: string]: { [currency: string]: number }}> {
        logger.info(`CoingeckoService.fetchPrices for ${tokenIds.join(',')}`)
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=${currency}&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`, {
            method: 'GET'
        })
        if (!response.ok) {
            throw new HttpError(response.status, response.statusText)
        }
        return response.json()
    }

    private csvToJson(csvString: string, delimiter: string = ','): any[] {
        const rows = csvString
            .split("\n");
    
        const headers = rows[0]
            .split(delimiter);
    
        const jsonData = [];
        for (let i = 1; i < rows.length; i++) {
    
            const values = rows[i]
                .split(delimiter);
    
            const obj = {};
    
            for (let j = 0; j < headers.length; j++) {
    
                const key = headers[j]
                    .trim();
                const value = (values[j] || '').trim();
    
                obj[key] = value;
            }
    
            jsonData.push(obj);
        }
        return jsonData
    }
    
    async getExportDataUrl(tokenId: string) {
        const response = await fetch('https://www.coingecko.com/en/coins/' + tokenId + '/historical_data')
        const html = await response.text()
        const document = parse(html)
        const exportLink = document.querySelector('[data-coin-historical-data-target="exportDropdownMenu"] [data-view-component] span:nth-child(2)')
        const dataUrl = exportLink.getAttribute('data-url')
        return dataUrl
    }
    
    async fetchHistoricalData(tokenId: string, currency: string = 'usd'): Promise<Quotes> {
        const dataUrl = (await this.getExportDataUrl(tokenId)).replace('usd.csv', currency + '.csv')
        const response = await fetch('https://www.coingecko.com' + dataUrl)
        const csv = await response.text()
        let json = this.csvToJson(csv).filter(d => d['snapped_at'] && d['price'])
        const result: { timestamp: number, latest: number } = { timestamp: -1, latest: -1 }
        for (let dataPoint of json) {
            result[dataPoint['snapped_at'].substring(0, 10)] = Number(dataPoint['price'])
        }
        result['latest'] = json[json.length - 1]['price']
        result['timestamp'] = Date.now()
        return result
    }
    
}

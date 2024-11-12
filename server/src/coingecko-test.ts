import { parse } from 'node-html-parser';
import "node-fetch";

function csvToJson(csvString: string, delimiter: string = ',') {
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

export const getExportDataUrl = async (coin: string) => {
    const response = await fetch('https://www.coingecko.com/en/coins/bifrost-native-coin/historical_data')
    const html = await response.text()
    // console.log(html)
    const document = parse(html)
    const exportLink = document.querySelector('[data-coin-historical-data-target="exportDropdownMenu"] [data-view-component] span:nth-child(2)')
    const dataUrl = exportLink.getAttribute('data-url')
    //console.log(dataUrl)
    return dataUrl
}

export const fetchHistoricalData = async (coin: string) => {
    const dataUrl = await getExportDataUrl(coin)
    const response = await fetch('https://www.coingecko.com' + dataUrl)
    const csv = await response.text()
    let json = csvToJson(csv).filter(d => d['snapped_at'] && d['price'])
    // console.log(json)
    const result = {}
    for (let dataPoint of json) {
        result[dataPoint['snapped_at'].substring(0, 10)] = Number(dataPoint['price'])
    }
    result['latest'] = json[json.length - 1]['price']
    result['timestamp'] = Date.now()
}

fetchHistoricalData('ethereum');
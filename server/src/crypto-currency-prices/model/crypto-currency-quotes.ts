export interface Quotes {
    [isoDate:string]: number;
    timestamp: number;
    latest?: number;
}

export interface CurrencyQuotes {
    currency: string;
    quotes: Quotes
}
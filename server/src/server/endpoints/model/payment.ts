export interface Payment {
    hash: string,
    from: string,
    to:string,
    block: number,
    date: number,
    amount: number,
    label?: string
}
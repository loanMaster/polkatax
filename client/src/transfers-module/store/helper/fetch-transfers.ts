export const fetchTransfers = (domain: string, startDate, endDate, address, currency) => {
    const chain = await firstValueFrom(this.chain$)
    const startDate = new Date(this.startDate).getTime();
    const endDate = new Date(this.endDate);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    const metadata = {
    chain: chain.domain,
    address: this.address,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate.getTime()),
    currency: this.currency,
    };
    const result = await new PaymentsService().fetchTokenRewards(
    chain.domain,
    this.address.trim(),
    this.currency,
    startDate,
    endDate.getTime()
    );
    const paymentList = {
    ...metadata,
    tokens: {} as any,
    };
    const transfers = result.transfers;
    for (const token of Object.keys(transfers)) {
    const payments = (transfers as any)[token];
    payments.values.forEach((v: Payment) => {
        v.valueNow = isNaN(v.amount * payments.currentPrice)
        ? undefined
        : v.amount * payments.currentPrice;
    });
    payments.summary = calculatePamymentsSummary(payments);
    paymentList.tokens[token] = payments;
    }
    const selectedToken = Object.keys(paymentList.tokens).sort((a, b) =>
    a > b ? 1 : -1
    )[0];
    addCurrentValueToTokens(result);
    const swaps = {
    ...metadata,
    startDate,
    endDate: endDate.getTime(),
    swaps: result.swaps,
    currentPrices: result.currentPrices,
    };
    const visibleSwapTokens = extractTokensFromSwaps(swaps).map((t) => ({
    name: t,
    value: true,
    }));
}
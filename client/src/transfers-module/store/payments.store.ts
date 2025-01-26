import { defineStore } from 'pinia';
import { tokenList } from '../../shared-module/const/tokenList';
import { PaymentsService } from '../service/payments.service';
import {
  formatDate,
  getFirstDayOfYear,
} from '../../shared-module/util/date-utils';
import { Payment, PaymentDto, Payments, PaymentsList } from '../model/payments';
import { Swap, SwapList, TradingSummary } from 'src/swap-module/model/swaps';
import { date } from 'quasar';

const getTokens = (swaps: SwapList) => {
  const temp: string[] = [];
  (swaps.swaps || []).forEach((swap: Swap) => {
    Object.keys(swap.tokens).forEach((token) => {
      if (temp.indexOf(token) === -1) {
        temp.push(token);
      }
    });
  });
  return temp.sort((a, b) => (a > b ? 1 : -1));
};

const preprocess = (swaps: SwapList): any => {
  swaps.swaps.forEach((swap: Swap) => {
    Object.keys(swap.tokens).forEach((token) => {
      swap.tokens[token].valueNow = swaps.currentPrices[token]
        ? swap.tokens[token].amount * swaps.currentPrices[token]
        : undefined;
    });
  });
};

const sumOrNaN = (...values: (number | undefined)[]): number | undefined => {
  const total = values.reduce((curr, val) => (curr! += val!), 0)!;
  return isNaN(total) ? undefined : total;
};

const createTradingSummary = (
  swapList: SwapList,
  filteredSwaps: Swap[]
): TradingSummary[] => {
  const tradingSummary: any = {};
  filteredSwaps.forEach((swap: Swap) => {
    Object.keys(swap.tokens).forEach((token) => {
      const tokenSwapInfo = swap.tokens[token];
      tradingSummary[token] = tradingSummary[token] || {
        sold: { amount: 0, valueNow: 0, value: 0 },
        bought: { amount: 0, valueNow: 0, value: 0 },
        total: { amount: 0, valueNow: 0, value: 0 },
      };
      tradingSummary[token].token = token;
      tradingSummary[token].priceNow = swapList.currentPrices[token];
      const property = tokenSwapInfo.type === 'sell' ? 'sold' : 'bought';
      tradingSummary[token][property].amount += tokenSwapInfo.amount;
      tradingSummary[token][property].value = sumOrNaN(
        tradingSummary[token][property].value,
        tokenSwapInfo.value
      );
      tradingSummary[token][property].valueNow = sumOrNaN(
        tradingSummary[token][property].valueNow,
        tokenSwapInfo.valueNow
      );
    });
  });
  Object.keys(tradingSummary).forEach((token) => {
    tradingSummary[token].total.amount +=
      tradingSummary[token].bought.amount - tradingSummary[token].sold.amount;
    tradingSummary[token].total.value = sumOrNaN(
      tradingSummary[token].total.value,
      tradingSummary[token].bought.value,
      -tradingSummary[token].sold.value
    );
    tradingSummary[token].total.valueNow = sumOrNaN(
      tradingSummary[token].total.valueNow,
      tradingSummary[token].bought.valueNow,
      -tradingSummary[token].sold.valueNow
    );
  });
  const swapSummary: TradingSummary[] = [];
  Object.keys(tradingSummary).forEach((token) => {
    swapSummary.push(tradingSummary[token]);
  });
  return swapSummary;
};

const createSummary = (
  payments: Payments,
  excludedEntries: PaymentDto[] = []
) => {
  const excludedHashes = excludedEntries.map((e) => e.hash);
  const summary: any = { value: 0, amount: 0, valueNow: 0 };
  payments.values
    .filter((v) => excludedHashes.indexOf(v.hash) === -1)
    .forEach((v) => {
      summary.amount += v.amount;
      summary.value = sumOrNaN(summary.value, v.value);
      summary.valueNow = sumOrNaN(summary.valueNow, v.valueNow);
    });
  return summary;
};

export const usePaymentsStore = defineStore('payments', {
  state: (): {
    paymentList: PaymentsList | undefined;
    swaps: SwapList | undefined;
    chain: string;
    currency: string;
    address: string;
    selectedToken: string;
    paymentsFilter: string;
    startDate: string;
    endDate: string;
    excludedEntries: PaymentDto[];
    swapTypeFilter: { twoAssets: boolean; multipleAssets: boolean };
    visibleSwapTokens: { name: string; value: boolean }[];
  } => {
    return {
      paymentList: undefined,
      swaps: undefined,
      chain: '',
      currency: '',
      address: '',
      selectedToken: '',
      paymentsFilter: 'All transfers',
      startDate: date.formatDate(getFirstDayOfYear().getTime(), 'YYYY/MM/DD'),
      endDate: date.formatDate(Date.now(), 'YYYY/MM/DD'),
      excludedEntries: [],
      swapTypeFilter: { twoAssets: true, multipleAssets: true },
      visibleSwapTokens: [],
    };
  },
  getters: {
    swapTokens(): string[] {
      return getTokens(this.swaps);
    },
    token(): string {
      return tokenList.find((t) => t.chain === this.chain)?.symbol || '';
    },
    paymentsCurrentToken(): Payments | undefined {
      if (!this.paymentList?.tokens?.[this.selectedToken]) {
        return undefined;
      }
      const paymentsForToken = {
        values: this.paymentList.tokens![this.selectedToken].values,
        currentPrice: this.paymentList.tokens![this.selectedToken].currentPrice,
      } as Payments;
      paymentsForToken.values = paymentsForToken.values.filter(
        (p) =>
          (p.amount > 0 && this.paymentsFilter !== 'Outgoing transfers only') ||
          (p.amount < 0 && this.paymentsFilter !== 'Incoming transfers only')
      );
      paymentsForToken.summary = createSummary(
        paymentsForToken,
        this.excludedEntries
      );
      return paymentsForToken;
    },
    filteredSwaps(): Swap[] {
      const supportedTokens = this.visibleSwapTokens
        .filter((t) => t.value === true)
        .map((t) => t.name);
      return this?.swaps?.swaps
        .filter(
          (swap: Swap) =>
            (this.swapTypeFilter.twoAssets &&
              Object.keys(swap.tokens).length <= 2) ||
            (this.swapTypeFilter.multipleAssets &&
              Object.keys(swap.tokens).length > 2)
        )
        .filter((swap: Swap) =>
          Object.keys(swap.tokens).some(
            (token) => supportedTokens.indexOf(token) > -1
          )
        );
    },
    swapSummary(): TradingSummary {
      return createTradingSummary(this.swaps, this.filteredSwaps);
    },
  },
  actions: {
    async fetchTransfers() {
      const startDate = new Date(this.startDate).getTime();
      const endDate = new Date(this.endDate);
      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);
      const metadata = {
        chain: this.chain,
        address: this.address,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate.getTime()),
        currency: this.currency,
      };
      const result = await new PaymentsService().fetchTokenRewards(
        this.chain,
        this.address.trim(),
        this.currency,
        startDate,
        endDate.getTime()
      );
      this.paymentList = {
        ...metadata,
        tokens: {},
      };
      const transfers = result.transfers;
      for (const token of Object.keys(transfers)) {
        const payments = (transfers as any)[token];
        payments.values.forEach((v: Payment) => {
          v.valueNow = isNaN(v.amount * payments.currentPrice)
            ? undefined
            : v.amount * payments.currentPrice;
        });
        payments.summary = createSummary(payments);
        this.paymentList.tokens[token] = payments;
      }
      this.selectedToken = Object.keys(this.paymentList.tokens).sort((a, b) =>
        a > b ? 1 : -1
      )[0];

      preprocess(result);
      this.swaps = {
        ...metadata,
        swaps: result.swaps,
        currentPrices: result.currentPrices,
      };
      this.visibleSwapTokens = getTokens(this.swaps).map((t) => ({
        name: t,
        value: true,
      }));
    },
  },
});

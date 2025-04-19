import { defineStore } from 'pinia';
import { PaymentsService } from '../service/payments.service';
import {
  formatDate,
  getFirstDayOfYear,
} from '../../shared-module/util/date-utils';
import { Payment, Payments, PaymentsList } from '../model/payments';
import { Swap, SwapList, TradingSummary } from '../../swap-module/model/swaps';
import { date } from 'quasar';
import { BehaviorSubject, combineLatest, firstValueFrom, from, map, Observable, ReplaySubject } from 'rxjs';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { Chain } from '../../shared-module/model/chain';
import { ethChains } from '../../shared-module/const/eth-chains';
import { DataRequest } from '../../shared-module/model/data-request';
import { extractTokensFromSwaps } from './helper/extract-tokens-from-swaps';
import { calculatePamymentsSummary } from './helper/calculate-payments-summary';
import { calculateSwapSummary } from './helper/calculate-swap-summary';
import { addCurrentValueToTokens } from './helper/add-current-value-to-tokens';
import { filterSwaps } from './helper/filtered-swaps';
import { filterPayments } from './helper/filter-payments';

const chain$: BehaviorSubject<Chain>  = new BehaviorSubject<Chain>({
  domain: 'polkadot',
  label: 'Polkadot',
  token: 'DOT',
});
const chainList$ = from(fetchSubscanChains()).pipe(map(chains => ([...chains, ...ethChains])));
const swaps$ = new ReplaySubject<DataRequest<SwapList>>(1);
const payments$ = new ReplaySubject<DataRequest<PaymentsList>>(1);
const paymentsFilter$ = new BehaviorSubject<string>('All transfers')
const excludedEntries$ = new BehaviorSubject([])
const swapTypeFilter$ = new BehaviorSubject({ twoAssets: true, multipleAssets: true })
const visibleSwapTokens$ = new BehaviorSubject<{ name: string, value: boolean}[]>([])
const selectedToken$ = new ReplaySubject<string>(1)

export const usePaymentsStore = defineStore('payments', {
  state: () => {
    return {
      paymentList$: payments$.asObservable(),
      swaps$: swaps$.asObservable(),
      chain$: chain$.asObservable(),
      currency: '',
      address: '',
      selectedToken$: selectedToken$.asObservable(),
      chainList$,
      paymentsFilter$: paymentsFilter$.asObservable(),
      startDate: date.formatDate(getFirstDayOfYear().getTime(), 'YYYY/MM/DD'),
      endDate: date.formatDate(Date.now(), 'YYYY/MM/DD'),
      excludedEntries$: excludedEntries$.asObservable(),
      swapTypeFilter$: swapTypeFilter$.asObservable(),
      visibleSwapTokens$: visibleSwapTokens$.asObservable(),
    };
  },
  getters: {
    swapTokens(): Observable<string[]> {
      return this.swaps$.pipe(map(swaps => extractTokensFromSwaps(swaps.data)))
    },
    paymentsCurrentToken(): Observable<Payments | undefined> {
      return combineLatest([payments$, selectedToken$, paymentsFilter$, excludedEntries$])
      .pipe(map(filterPayments))
    },
    filteredSwaps(): Observable<Swap[]> {
      return combineLatest([swaps$, visibleSwapTokens$, swapTypeFilter$]).pipe(map(filterSwaps))
    },
    swapSummary(): Observable<TradingSummary[]> {
      return combineLatest([swaps$, this.filteredSwaps]).pipe(map(([swaps, filteredSwaps]) => 
        calculateSwapSummary(swaps.data, filteredSwaps)
      ))
    },
  },
  actions: {
    async fetchTransfers() {
      swaps$.next({ data: undefined, pending: true });
      payments$.next({ data: undefined, pending: true });

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
      selectedToken$.next(selectedToken);
      visibleSwapTokens$.next(visibleSwapTokens);
      swaps$.next({ data: swaps, pending: false });
      payments$.next({ data: paymentList, pending: false })
    },
  },
});

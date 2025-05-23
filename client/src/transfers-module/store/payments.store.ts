import { defineStore } from 'pinia';
import { fetchSwapsAndTransfers } from '../service/fetch-swaps-and-transfers';
import {
  formatDate,
  getFirstDayOfYear,
} from '../../shared-module/util/date-utils';
import { Swap, SwapList, TradingSummary } from '../../swap-module/model/swaps';
import { date } from 'quasar';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  from,
  map,
  Observable,
  ReplaySubject,
} from 'rxjs';
import { fetchSubscanChains } from '../../shared-module/service/fetch-subscan-chains';
import { Chain } from '../../shared-module/model/chain';
import { ethChains } from '../../shared-module/const/eth-chains';
import { DataRequest } from '../../shared-module/model/data-request';
import { extractTokensFromSwaps } from './util/extract-tokens-from-swaps';
import { calculateSwapSummary } from './util/calculate-swap-summary';
import { addCurrentValueToSwappedTokens } from './util/add-current-value-to-swapped-tokens';
import { filterSwaps } from './util/filter-swaps';
import { filterPayments } from './util/filter-payments';
import { PaymentsResponseDto } from '../model/payments-response.dto';
import {
  PaymentPortfolio,
  TokenPayment,
  TokenPaymentsData,
} from '../model/payments';

const chain$: BehaviorSubject<Chain> = new BehaviorSubject<Chain>({
  domain: 'polkadot',
  label: 'Polkadot',
  token: 'DOT',
});
const chainList$ = from(fetchSubscanChains()).pipe(
  map((chainList) => [...chainList.chains, ...ethChains]),
  map((list) => {
    return list.sort((a, b) => (a.label > b.label ? 1 : -1));
  })
);
const swaps$ = new ReplaySubject<DataRequest<SwapList>>(1);
const payments$ = new ReplaySubject<DataRequest<PaymentPortfolio>>(1);
const paymentsFilter$ = new BehaviorSubject<string>('All transfers');
const excludedPayments$ = new BehaviorSubject<{ hash: string }[]>([]);
const swapTypeFilter$ = new BehaviorSubject({
  twoAssets: true,
  multipleAssets: true,
});
const visibleSwapTokens$ = new BehaviorSubject<
  { name: string; value: boolean }[]
>([]);
const selectedToken$ = new ReplaySubject<string>(1);

export const usePaymentsStore = defineStore('payments', {
  state: () => {
    return {
      paymentList$: payments$.asObservable(),
      swaps$: swaps$.asObservable(),
      chain$: chain$.asObservable(),
      currency: 'USD',
      address: '',
      selectedToken$: selectedToken$.asObservable(),
      chainList$,
      paymentsFilter$: paymentsFilter$.asObservable(),
      startDate: date.formatDate(getFirstDayOfYear().getTime(), 'YYYY/MM/DD'),
      endDate: date.formatDate(Date.now(), 'YYYY/MM/DD'),
      excludedPayments$: excludedPayments$.asObservable(),
      swapTypeFilter$: swapTypeFilter$.asObservable(),
      visibleSwapTokens$: visibleSwapTokens$.asObservable(),
    };
  },
  getters: {
    swapTokens$(): Observable<string[]> {
      return swaps$.pipe(map((swaps) => extractTokensFromSwaps(swaps.data)));
    },
    paymentsCurrentToken$(): Observable<TokenPaymentsData | undefined> {
      return combineLatest([
        payments$,
        selectedToken$,
        paymentsFilter$,
        excludedPayments$,
      ]).pipe(map(filterPayments));
    },
    filteredSwaps$(): Observable<Swap[]> {
      return combineLatest([swaps$, visibleSwapTokens$, swapTypeFilter$]).pipe(
        map(filterSwaps)
      );
    },
    swapSummary$(): Observable<TradingSummary[]> {
      return combineLatest([swaps$, this.filteredSwaps$]).pipe(
        map(([swaps, filteredSwaps]) =>
          calculateSwapSummary(swaps.data, filteredSwaps)
        )
      );
    },
  },
  actions: {
    selectChain(newChain: Chain) {
      chain$.next(newChain);
    },
    setPaymentsFilter(newFilter: string) {
      paymentsFilter$.next(newFilter);
    },
    selectToken(token: string) {
      selectedToken$.next(token);
    },
    setSwapsFilter(newFilter: { twoAssets: boolean; multipleAssets: boolean }) {
      swapTypeFilter$.next(newFilter);
    },
    async toggleAllExcludedPayments() {
      const excludedPayments = await firstValueFrom(excludedPayments$);
      if (excludedPayments.length === 0) {
        const payments = await firstValueFrom(this.paymentsCurrentToken$);
        excludedPayments$.next(
          (payments?.payments || [])
            .filter((p) => p.hash)
            .map((p) => ({ hash: p.hash! }))
        );
      } else {
        excludedPayments$.next([]);
      }
    },
    async toggleExcludedPayment(hash: string) {
      const excludedPayments = await firstValueFrom(excludedPayments$);
      const isExcluded = excludedPayments.filter((e) => e.hash === hash).length;
      if (isExcluded) {
        excludedPayments$.next([
          ...excludedPayments.filter((p) => p.hash !== hash),
        ]);
      } else {
        excludedPayments$.next([...excludedPayments, { hash }]);
      }
    },
    async toggleAllVisibleSwapTokens() {
      const swapTokens = await firstValueFrom(visibleSwapTokens$);
      const allActive = swapTokens.filter((t) => t.value).length > 0;
      visibleSwapTokens$.next(
        swapTokens.map((t) => ({ ...t, value: !allActive }))
      );
    },
    async updateSwapAssetVisibility(token: string, visible: boolean) {
      const swapTokens = await firstValueFrom(visibleSwapTokens$);
      const newTokens = swapTokens.map((t) => {
        if (t.name === token) {
          return {
            name: token,
            value: visible,
          };
        } else {
          return {
            ...t,
          };
        }
      });
      visibleSwapTokens$.next(newTokens);
    },
    async fetchTransfers() {
      swaps$.next({ data: undefined, pending: true });
      payments$.next({ data: undefined, pending: true });

      try {
        const chain = await firstValueFrom(chain$);
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
        const { swaps, transfers, tokens }: PaymentsResponseDto =
          await fetchSwapsAndTransfers(
            chain.domain,
            this.address.trim(),
            this.currency,
            startDate,
            endDate.getTime()
          );

        const payments = transfers.map((t) => ({
          ...t,
          valueNow: tokens[t.tokenId].latestPrice
            ? tokens[t.tokenId].latestPrice! * t.amount
            : undefined,
          isoDate: formatDate(t.timestamp),
        })) as TokenPayment[];

        const paymentList: PaymentPortfolio = {
          ...metadata,
          transfers: payments,
          tokens,
        };

        const relevantTransferTokens = [
          ...new Set(
            payments.filter((t) => t.amount !== 0).map((t) => t.symbol)
          ),
        ].sort((a, b) => (a > b ? 1 : -1));
        const selectedToken =
          relevantTransferTokens.length > 0 ? relevantTransferTokens[0] : '';

        const swapList: SwapList = {
          ...metadata,
          startDate,
          endDate: endDate.getTime(),
          swaps: addCurrentValueToSwappedTokens(swaps, tokens),
          tokens,
        };

        const visibleSwapTokens = extractTokensFromSwaps(swapList).map((t) => ({
          name: t,
          value: true,
        }));

        swaps$.next({ data: swapList, pending: false });
        visibleSwapTokens$.next(visibleSwapTokens);
        payments$.next({ data: paymentList, pending: false });
        selectedToken$.next(selectedToken);
      } catch (error) {
        swaps$.next({ data: undefined, pending: false, error });
        payments$.next({ data: undefined, pending: false, error });
      }
    },
  },
});

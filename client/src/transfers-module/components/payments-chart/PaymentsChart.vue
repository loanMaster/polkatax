<template>
  <GChart
    v-if="hasData"
    :data="dataTable"
    type="LineChart"
    :options="options"
    style="width: 100%; min-height: 400px"
  ></GChart>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { GChart } from 'vue-google-charts';
import {
  PaymentPortfolio,
  TokenPayment,
  TokenPaymentsData,
} from '../../model/payments';
import { usePaymentsStore } from '../../store/payments.store';

const store = usePaymentsStore();

const paymentsCurrentToken: Ref<TokenPaymentsData | undefined> = ref(undefined);
const excludedEntries: Ref<TokenPayment[]> = ref([]);
const selectedToken: Ref<string | undefined> = ref(undefined);
const paymentPortfolio: Ref<PaymentPortfolio | undefined> = ref(undefined);

const subscription = store.paymentsCurrentToken$.subscribe((payments) => {
  paymentsCurrentToken.value = payments;
});

const excludedEntriesSub = store.excludedEntries$.subscribe((excluded) => {
  excludedEntries.value = excluded;
});

const selectedTokenSub = store.selectedToken$.subscribe((token) => {
  selectedToken.value = token;
});

const paymentPortfolioSub = store.paymentList$.subscribe((portfolioReq) => {
  paymentPortfolio.value = portfolioReq.data;
});

onUnmounted(() => {
  subscription.unsubscribe();
  excludedEntriesSub.unsubscribe();
  selectedTokenSub.unsubscribe();
  paymentPortfolioSub.unsubscribe();
});

const props = defineProps({
  currency: Boolean,
});

const hasData = computed(() => {
  return (paymentsCurrentToken.value?.payments || []).length !== 0;
});

const dataTable = computed(() => {
  const header = props.currency
    ? [['date', 'Accumulated value', 'Accumulated value now']]
    : [['date', 'Accumulated amount']];
  const minDay = paymentsCurrentToken.value!.payments[0].isoDate;
  const temp = new Date(minDay);
  temp.setHours(0);
  temp.setMilliseconds(0);
  temp.setSeconds(0);
  const data = [];
  let accValue = 0;
  let accAmount = 0;
  const excludedHashes = excludedEntries.value.map((e: TokenPayment) => e.hash);
  const sortedValues = (paymentsCurrentToken.value!.payments || [])
    .filter((p: TokenPayment) => excludedHashes.indexOf(p.hash) == -1)
    .sort((a: TokenPayment, b: TokenPayment) => (a.date > b.date ? 1 : -1));
  for (let values of sortedValues) {
    accAmount += values?.amount || 0;
    accValue += values?.value || 0;
    data.push(
      props.currency
        ? [
            new Date(values.date * 1000),
            accValue,
            accAmount * paymentsCurrentToken.value!.currentPrice,
          ]
        : [new Date(values.date * 1000), accAmount]
    );
  }
  return [...header, ...data];
});

const options = computed(() => ({
  title: `Transfers of ${(selectedToken.value || '').toUpperCase()} on ${
    paymentPortfolio.value?.chain
  } ${props.currency ? 'in ' + paymentPortfolio.value?.currency : ''}`,
  legend: { position: 'top' },
  hAxis: {
    title: 'Date',
  },
  vAxis: {
    minValue: 0,
  },
  axisTitlesPosition: 'out',
  seriesType: 'line',
  series: { 0: { type: 'line' } },
}));
</script>

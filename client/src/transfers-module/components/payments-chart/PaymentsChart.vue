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
import { computed } from 'vue';
import { GChart } from 'vue-google-charts';
import { usePaymentsStore } from 'src/transfers-module/store/payments.store';
import { Payment } from 'src/transfers-module/model/payments';

const store = usePaymentsStore();

const props = defineProps({
  currency: Boolean,
});

const hasData = computed(() => {
  return (store.paymentsCurrentToken?.values || []).length !== 0;
});

const dataTable = computed(() => {
  const header = props.currency
    ? [['date', 'Accumulated value', 'Accumulated value now']]
    : [['date', 'Accumulated amount']];
  const minDay = store.paymentsCurrentToken!.values[0].isoDate;
  const temp = new Date(minDay);
  temp.setHours(0);
  temp.setMilliseconds(0);
  temp.setSeconds(0);
  const data = [];
  let accValue = 0;
  let accAmount = 0;
  const excludedHashes = store.excludedEntries.map((e: Payment) => e.hash);
  const sortedValues = (store.paymentsCurrentToken?.values || [])
    .filter((p: Payment) => excludedHashes.indexOf(p.hash) == -1)
    .sort((a: Payment, b: Payment) => (a.date > b.date ? 1 : -1));
  for (let values of sortedValues) {
    accAmount += values?.amount || 0;
    accValue += values?.value || 0;
    data.push(
      props.currency
        ? [
            new Date(values.date * 1000),
            accValue,
            accAmount * store.paymentsCurrentToken.currentPrice,
          ]
        : [new Date(values.date * 1000), accAmount]
    );
  }
  return [...header, ...data];
});

const options = computed(() => ({
  title: `Transfers of ${store.selectedToken.toUpperCase()} on ${
    store.paymentList.chain
  } ${props.currency ? 'in ' + store.paymentList.currency : ''}`,
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

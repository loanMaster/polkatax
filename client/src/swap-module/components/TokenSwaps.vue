<template>
  <swap-filter-toggles v-if="store.swaps" class="text-center" />
  <div class="table q-my-md" v-if="store.swaps">
    <swap-table />
  </div>
  <div class="justify-around items-center column q-mb-lg" v-if="store.swaps">
    <swaps-summary-table />
    <q-list bordered separator v-if="allValuesKnown">
      <q-item class="justify-between">
        <q-item-section avatar>
          Current value of total assets sold:
        </q-item-section>
        <q-item-section class="content-end">{{ totalSales }}</q-item-section>
      </q-item>

      <q-item class="justify-between">
        <q-item-section> Current value of total assets bought: </q-item-section>
        <q-item-section class="content-end">{{ totalBuys }}</q-item-section>
      </q-item>

      <q-item class="justify-between">
        <q-item-section avatar> Total gain/loss: </q-item-section>
        <q-item-section class="content-end">{{ totalGain }}</q-item-section>
      </q-item>
    </q-list>
    <div v-if="!allValuesKnown" class="q-mx-auto text-center">
      Unfortunately, for some tokens prices could not be determined. <br />
      A summary of total loss / gain could therefore not be calculated.
    </div>
  </div>
</template>

<script setup lang="ts">
import SwapFilterToggles from './swap-filter-toggles/SwapFilterToggles.vue';
import SwapsSummaryTable from './swap-summary-table/SwapSummaryTable.vue';
import SwapTable from './swap-table/SwapTable.vue';

import { computed } from 'vue';
import { TradingSummary } from 'app/client/src/swap-module/model/swaps';
import { formatCurrency } from 'src/shared-module/util/number-formatters';
import { usePaymentsStore } from 'src/transfers-module/store/payments.store';

const store = usePaymentsStore();

const totalSales = computed(() => {
  return formatCurrency(
    store.swapSummary.reduce(
      (acc: number, item: TradingSummary) =>
        (acc += isNaN(item.sold.valueNow) ? 0 : item.sold.valueNow),
      0
    ),
    store.swaps.currency
  );
});
const totalBuys = computed(() => {
  return formatCurrency(
    store.swapSummary.reduce(
      (acc: number, item: TradingSummary) =>
        (acc += isNaN(item.bought.valueNow) ? 0 : item.bought.valueNow),
      0
    ),
    store.swaps.currency
  );
});
const totalGain = computed(() => {
  return formatCurrency(
    store.swapSummary.reduce(
      (acc: number, item: TradingSummary) =>
        (acc += isNaN(item.bought.valueNow)
          ? 0
          : item.bought.valueNow - item.sold.valueNow),
      0
    ),
    store.swaps.currency
  );
});

const allValuesKnown = computed(() => {
  return store.swapSummary.every(
    (item: TradingSummary) =>
      item.total.amount === 0 ||
      (!isNaN(item.bought.valueNow) && !isNaN(item.sold.valueNow))
  );
});
</script>

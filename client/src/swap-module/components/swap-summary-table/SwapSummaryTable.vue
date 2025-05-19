<template>
  <div class="q-pa-md full-width">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="block"
      no-data-label="No trades found"
      :pagination="initialPagination"
    >
      <template v-slot:top>
        <span class="text-h6" style="line-break: anywhere"
          >Summary of trades on {{ swaps?.chain }}</span
        >
        <q-space />

        <q-btn color="primary" class="q-mr-sm" @click="exportCsv"
          >Export CSV
        </q-btn>
        <q-btn color="primary" @click="exportJson">Export JSON</q-btn>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { SummaryPosition, SwapList, TradingSummary } from '../../model/swaps';
import { formatValue } from '../../../shared-module/util/number-formatters';
import { Parser } from '@json2csv/plainjs';
import { usePaymentsStore } from '../../../transfers-module/store/payments.store';
import { saveAs } from 'file-saver';
import { deepFlattenToObject } from '../../../shared-module/util/flatten';

const store = usePaymentsStore();
const swaps: Ref<SwapList | undefined> = ref(undefined);
const swapSummary: Ref<TradingSummary[]> = ref([]);

const swapListSub = store.swaps$.subscribe((swapListReq) => {
  swaps.value = swapListReq.data;
});

const tradingSummarySub = store.swapSummary$.subscribe((tradingSummary) => {
  swapSummary.value = tradingSummary;
});

onUnmounted(() => {
  swapListSub.unsubscribe();
  tradingSummarySub.unsubscribe();
});

const columns = computed(() => [
  {
    name: 'token',
    align: 'right',
    label: 'Token',
    field: 'token',
    format: (t: string) => t.toUpperCase(),
  },
  {
    name: 'soldAmount',
    align: 'right',
    label: 'Total sold',
    field: 'sold',
    format: (s: SummaryPosition) => formatValue(Math.abs(s.amount)),
  },
  {
    name: 'soldValue',
    align: 'right',
    label: `Value (${swaps.value?.currency})`,
    field: 'sold',
    format: (s: SummaryPosition) => formatValue(Math.abs(s.fiatValue!)),
  },
  {
    name: 'soldValueNow',
    align: 'right',
    label: `Value now (${swaps.value?.currency})`,
    field: 'sold',
    format: (s: SummaryPosition) => formatValue(Math.abs(s.valueNow!)),
  },
  {
    name: 'boughtAmount',
    align: 'right',
    label: 'Total bought',
    field: 'bought',
    format: (s: SummaryPosition) => formatValue(s.amount),
  },
  {
    name: 'boughtValue',
    align: 'right',
    label: `Value (${swaps.value?.currency})`,
    field: 'bought',
    format: (s: SummaryPosition) => formatValue(s.fiatValue),
  },
  {
    name: 'boughtValueNow',
    align: 'right',
    label: `Value now (${swaps.value?.currency})`,
    field: 'bought',
    format: (s: SummaryPosition) => formatValue(s.valueNow),
  },
  {
    name: 'change',
    align: 'right',
    label: 'Change',
    field: 'total',
    format: (s: SummaryPosition) => formatValue(s.amount),
  },
  {
    name: 'totalValue',
    align: 'right',
    label: `Value (${swaps.value?.currency})`,
    field: 'total',
    format: (s: SummaryPosition) => formatValue(s.fiatValue),
  },
  {
    name: 'totalValueNow',
    align: 'right',
    label: `Value now (${swaps.value?.currency})`,
    field: 'total',
    format: (s: SummaryPosition) => formatValue(s.valueNow),
  },
]);

const rows = computed(() => {
  return swapSummary.value;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function exportCsv() {
  const parser = new Parser();
  const values = [
    ...(swapSummary.value.map((s: TradingSummary) => deepFlattenToObject(s)) ||
      []),
  ];
  values[0] = {
    Chain: swaps.value?.chain,
    Currency: swaps.value?.currency,
    'Wallet address': swaps.value?.address,
    ...values[0],
  } as any;
  const csv = parser.parse(values);
  saveAs(
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'swaps-summary.csv'
  );
}

function exportJson() {
  saveAs(
    new Blob([JSON.stringify(swapSummary.value)], {
      type: 'text/plain;charset=utf-8',
    }),
    'swaps-summary.json'
  );
}
</script>

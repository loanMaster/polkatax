<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="block"
      no-data-label="No payments found"
      :pagination="initialPagination"
      selection="multiple"
      v-model:selected="store.excludedEntries"
    >
      <template v-slot:header-selection="scope">
        Excluded <q-toggle v-model="scope.selected" />
      </template>

      <template v-slot:body-selection="scope">
        <q-toggle v-model="scope.selected" />
      </template>

      <template v-slot:top>
        <span class="text-h6" style="line-break: anywhere"
          >Transfers ({{ store.selectedToken.toUpperCase() }} on
          {{ store.paymentList.chain }})</span
        >
        <q-space />

        <q-btn color="primary" class="q-mr-sm" @click="exportCsv"
          >Export CSV
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportKoinlyCsv"
          >Koinly-friendly CSV
        </q-btn>
        <q-btn color="primary" @click="exportJson">Export JSON</q-btn>
      </template>

      <template v-slot:body-cell="props">
        <q-td
          :props="props"
          :style="{ color: props.row.amount < 0 ? 'red' : undefined }"
          v-if="props.col.name !== 'tx'"
        >
          {{ props.value }}
        </q-td>
        <q-td v-if="props.col.name === 'tx'" class="text-center">
          <a :href="props.value" target="_blank"
            ><img src="img/external_link.png"
          /></a>
        </q-td>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { saveAs } from 'file-saver';
import { Parser } from '@json2csv/plainjs';
import {
  formatValue,
  tokenAmountFormatter,
} from '../../../shared-module/util/number-formatters';
import { usePaymentsStore } from '../../store/payments.store';
import { getTxLink } from 'src/shared-module/util/tx-link';
import { Swap } from 'src/src/swap-module/model/swaps';
import { formatDate, formatDateUTC } from 'src/shared-module/util/date-utils';
import { Payment } from 'src/transfers-module/model/payments';

const store = usePaymentsStore();
const sortAmounts = (value1: number, value2: number) =>
  Math.abs(value1) > Math.abs(value2) ? 1 : -1;

const columns = computed(() => [
  {
    name: 'Date',
    required: true,
    label: 'Date',
    align: 'left',
    field: (row: Swap) => formatDate(row.date * 1000),
    sortable: true,
  },
  {
    name: 'block',
    align: 'right',
    label: 'Block',
    field: 'block',
    sortable: true,
  },
  {
    name: 'transfer',
    align: 'right',
    label: `Amount (${token.value.toUpperCase()})`,
    field: 'amount',
    format: (num: number) => amountFormatter.value.format(Math.abs(num)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'transferFrom',
    align: 'center',
    label: 'from',
    field: 'from',
    format: (value: string) => value.substring(0, 10) + '...',
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'transferTo',
    align: 'center',
    label: 'to',
    field: 'to',
    format: (value: string) => value.substring(0, 10) + '...',
    sortable: true,
  },
  {
    name: 'price',
    align: 'right',
    label: `Price (${store.paymentList?.currency})`,
    field: 'price',
    format: (num: number) => formatValue(num),
    sortable: true,
  },
  {
    name: 'value',
    align: 'right',
    label: `Value (${store.paymentList?.currency})`,
    field: 'value',
    format: (num: number) => formatValue(Math.abs(num)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'valueNow',
    align: 'right',
    label: `Value now (${store.paymentList?.currency})`,
    field: 'valueNow',
    format: (num: number) => formatValue(Math.abs(num)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'functionName',
    align: 'left',
    label: 'Function',
    field: 'functionName',
    sortable: false,
  },
  {
    name: 'tx',
    align: 'center',
    label: 'Transaction',
    field: 'hash',
    format: (hash: string) => getTxLink(hash, store?.paymentList?.chain || ''),
    sortable: false,
  },
]);

const rows = computed(() => {
  return store.paymentsCurrentToken?.values;
});

const token = computed(() => {
  return store.selectedToken;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function exportKoinlyCsv() {
  const parser = new Parser();
  const excludedHashes = store.excludedEntries.map((e) => e.hash);
  const values = [...(store.paymentsCurrentToken?.values || [])]
    .filter((v) => excludedHashes.indexOf(v.hash) === -1)
    .map((v) => {
      return {
        'Koinly Date': formatDateUTC(v.date * 1000),
        Amount: v.amount,
        Currency: store.selectedToken,
        TxHash: v.hash,
      };
    });
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'payments.csv');
}

function exportCsv() {
  const parser = new Parser();
  const excludedHashes = store.excludedEntries.map((e) => e.hash);
  const values = [...(store.paymentsCurrentToken?.values || [])]
    .filter((v) => excludedHashes.indexOf(v.hash) === -1)
    .map((v) => {
      return {
        ...v,
        date: formatDateUTC(v.date * 1000),
      };
    });
  values[0] = {
    Token: store.selectedToken,
    Chain: store.paymentList?.chain,
    Currency: store.paymentList?.currency,
    'Wallet address': store.paymentList?.address,
    ...values[0],
    totalAmount: store.paymentsCurrentToken?.summary!.amount,
    totalValue: store.paymentsCurrentToken?.summary!.value,
    totalValueNow: store.paymentsCurrentToken?.summary?.valueNow,
  } as any;
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'payments.csv');
}

function exportJson() {
  const excludedHashes = store.excludedEntries.map((e) => e.hash);
  const filteredPayments = store
    .paymentsCurrentToken!.values.filter(
      (v) => excludedHashes.indexOf(v.hash) === -1
    )
    .map((p: Payment) => {
      return {
        ...p,
        date: formatDateUTC(p.date * 1000),
      };
    });

  saveAs(
    new Blob(
      [
        JSON.stringify({
          ...store.paymentsCurrentToken,
          values: filteredPayments,
        }),
      ],
      {
        type: 'text/plain;charset=utf-8',
      }
    ),
    'payments.json'
  );
}

const amountFormatter = computed(() => tokenAmountFormatter(4));
</script>

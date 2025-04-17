<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="block"
      no-data-label="No trades found"
      :pagination="initialPagination"
    >
      <template v-slot:top>
        <span class="text-h6" style="line-break: anywhere"
          >Trades on {{ store.swaps.chain }}</span
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

      <template v-slot:body-cell-tokensbought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-amountbought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-pricebought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-valuebought="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-tokenssold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-amountsold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-valuesold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-pricesold="props">
        <q-td :props="props">
          <div v-for="(item, idx) in props.value" v-bind:key="idx">
            {{ item }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-tx="props">
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
  formatTokenAmount,
  formatValue,
} from '../../../shared-module/util/number-formatters';
import { usePaymentsStore } from 'src/transfers-module/store/payments.store';
import { Swap, SwappedTokens } from 'app/client/src/swap-module/model/swaps';
import { formatDate, formatDateUTC } from 'src/shared-module/util/date-utils';
import { getTxLink } from 'src/shared-module/util/tx-link';

const store = usePaymentsStore();

const filterSwappedTokens = (tokens: SwappedTokens, sales = true) =>
  Object.keys(tokens).filter(
    (tokenName: string) => tokens[tokenName].type === (sales ? 'sell' : 'buy')
  );

const getSales = (tokens: SwappedTokens) => filterSwappedTokens(tokens, true);
const getBuys = (tokens: SwappedTokens) => filterSwappedTokens(tokens, false);

const calculateValue = (tokens: SwappedTokens) => {
  let value = getSales(tokens).reduce(
    (acc, token) => acc + tokens[token].value,
    0
  );
  if (isNaN(value)) {
    value = getBuys(tokens).reduce(
      (acc, token) => acc + tokens[token].value,
      0
    );
  }
  return value;
};

const sortAmounts = (value1: number[], value2: number[]) =>
  (value1[0] || 0) > (value2[0] || 0) ? 1 : -1;
const sortLabels = (value1: string[], value2: string[]) =>
  (value1[0] || '') > (value2[0] || '') ? 1 : -1;

const columns = computed(() => [
  {
    name: 'date',
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
    name: 'contract',
    align: 'center',
    label: 'Contract',
    field: 'contract',
    format: (value: string) =>
      value ? value.substring(0, 10) + (value.length > 10 ? '...' : '') : '-',
    sortable: true,
  },
  {
    name: 'tokenssold',
    align: 'right',
    label: 'Token sold',
    field: 'tokensSold',
    sort: sortLabels,
    sortable: true,
  },
  {
    name: 'amountsold',
    align: 'right',
    label: 'Amount',
    field: 'amountSold',
    format: (amounts: number[]) =>
      amounts.map((amount) => formatTokenAmount(amount, 4)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'pricesold',
    align: 'right',
    label: `Price (${store.swaps?.currency})`,
    field: 'priceSold',
    format: (amounts: number[]) => amounts.map((amount) => formatValue(amount)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'tokensbought',
    align: 'right',
    label: 'Token bought',
    field: 'tokensBought',
    sort: sortLabels,
    sortable: true,
  },
  {
    name: 'amountbought',
    align: 'right',
    label: 'Amount',
    field: 'amountBought',
    format: (value: number[]) =>
      value.map((value) => formatTokenAmount(value, 4)),
    sort: sortAmounts,
    sortable: true,
  },
  {
    name: 'pricebought',
    align: 'right',
    label: `Price (${store.swaps?.currency})`,
    format: (value: number[]) => value.map((value) => formatValue(value)),
    sort: sortAmounts,
    field: 'priceBought',
    sortable: true,
  },
  {
    name: 'value',
    align: 'right',
    label: `Transaction Value (${store.swaps?.currency})`,
    format: (value: number) => formatValue(value),
    field: 'value',
    sortable: true,
  },
  {
    name: 'functionnName',
    required: true,
    align: 'left',
    label: 'Function',
    field: 'functionName',
    sortable: true,
  },
  {
    name: 'tx',
    align: 'center',
    label: 'Transaction',
    field: 'hash',
    format: (hash: string) => getTxLink(hash, store.swaps.chain),
    sortable: false,
  },
]);

const rows = computed(() => {
  const flattened: any[] = [];
  store.filteredSwaps.forEach((swap: Swap) => {
    flattened.push({
      block: swap.block,
      date: swap.date,
      contract: swap.contract || '',
      functionName: swap.functionName,
      hash: swap.hash,
      tokensSold: getSales(swap.tokens).map((t) => t.toUpperCase()),
      amountSold: getSales(swap.tokens).map(
        (token) => swap.tokens[token].amount
      ),
      priceSold: getSales(swap.tokens).map((token) => swap.tokens[token].price),
      tokensBought: getBuys(swap.tokens).map((t) => t.toUpperCase()),
      amountBought: getBuys(swap.tokens).map(
        (token) => swap.tokens[token].amount
      ),
      priceBought: getBuys(swap.tokens).map(
        (token) => swap.tokens[token].price
      ),
      value: calculateValue(swap.tokens),
    });
  });
  return flattened;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function extractRowForCSVExport(swap: Swap) {
  const firstTokenPair: any = {
    ...swap,
    date: formatDateUTC(swap.date * 1000),
  };
  const otherTokens: any = [];
  let temp: any = {};
  Object.keys(swap.tokens).forEach((t) => {
    const tokenInfo = swap.tokens[t];
    if (tokenInfo.type === 'sell') {
      if (!firstTokenPair.sold_token) {
        firstTokenPair.sold_token = t.toUpperCase();
        firstTokenPair.sold_amount = tokenInfo.amount;
        firstTokenPair.sale_price = tokenInfo.price;
        firstTokenPair.sale_value = tokenInfo.value;
      } else {
        if (temp.sold_token) {
          otherTokens.push(temp);
          temp = {};
        }
        temp.sold_token = t.toUpperCase();
        temp.sold_amount = tokenInfo.amount;
        temp.sale_price = tokenInfo.price;
        temp.sale_value = tokenInfo.value;
      }
    }

    if (tokenInfo.type === 'buy') {
      if (!firstTokenPair.bought_token) {
        firstTokenPair.bought_token = t.toUpperCase();
        firstTokenPair.bought_amount = tokenInfo.amount;
        firstTokenPair.purchase_price = tokenInfo.price;
        firstTokenPair.purchase_value = tokenInfo.value;
      } else {
        if (temp.bought_token) {
          otherTokens.push(temp);
          temp = {};
        }
        temp.bought_token = t.toUpperCase();
        temp.bought_amount = tokenInfo.amount;
        temp.purchase_price = tokenInfo.price;
        temp.purchase_value = tokenInfo.value;
      }
    }
  });
  if (temp.bought_token || temp.sold_token) {
    otherTokens.push(temp);
  }
  delete firstTokenPair.tokens;
  return [firstTokenPair, otherTokens];
}

function exportCsv() {
  const parser = new Parser();
  const flattened: any[] = [];
  store.filteredSwaps.forEach((swap: Swap) => {
    const [firstTokenPair, otherTokens] = extractRowForCSVExport(swap);
    flattened.push(firstTokenPair);
    otherTokens.forEach((t: any) => flattened.push(t));
  });
  const values = [...flattened];
  values[0] = {
    Chain: store.swaps.chain,
    Currency: store.swaps.currency,
    'Wallet address': store.swaps.address,
    ...values[0],
  } as any;
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'swaps.csv');
}

function exportKoinlyCsv() {
  const parser = new Parser();
  const flattened: any[] = [];
  store.filteredSwaps.forEach((swap: Swap) => {
    const [firstTokenPair, otherTokens] = extractRowForCSVExport(swap);
    flattened.push({
      Date: firstTokenPair.date,
      'Sent Amount': firstTokenPair.sold_amount,
      'Sent Currency': firstTokenPair.sold_token,
      'Received Amount': firstTokenPair.bought_amount,
      'Received Currency': firstTokenPair.bought_token,
      TxHash: firstTokenPair.hash,
    });
    otherTokens.forEach((t: any) =>
      flattened.push({
        'Sent Amount': t.sold_amount,
        'Sent Currency': t.sold_token,
        'Received Amount': t.bought_amount,
        'Received Currency': t.bought_token,
      })
    );
  });
  const values = [...flattened];
  values[0] = {
    ...values[0],
  } as any;
  const csv = parser.parse(values);
  saveAs(new Blob([csv], { type: 'text/plain;charset=utf-8' }), 'swaps.csv');
}

function exportJson() {
  const swapsWithDateCol = store.filteredSwaps.map((s: Swap) => {
    return {
      ...s,
      date: formatDateUTC(s.date * 1000),
    };
  });
  saveAs(
    new Blob(
      [
        JSON.stringify({
          ...store.swaps,
          swaps: swapsWithDateCol,
        }),
      ],
      {
        type: 'text/plain;charset=utf-8',
      }
    ),
    'swaps.json'
  );
}
</script>

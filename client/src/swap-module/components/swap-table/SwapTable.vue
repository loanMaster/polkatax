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
import { formatDate } from 'src/shared-module/util/date-utils';
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
    (acc, token) => (acc += tokens[token].value),
    0
  );
  if (isNaN(value)) {
    value = getBuys(tokens).reduce(
      (acc, token) => (acc += tokens[token].value),
      0
    );
  }
  return formatValue(value);
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
    name: 'transferTo',
    align: 'center',
    label: 'Contract',
    field: 'contract',
    format: (value: string) => value.substring(0, 10) + '...',
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
      priceSold: getSales(swap.tokens).map(
        (token) => store.swaps.currentPrices[token]
      ),
      tokensBought: getBuys(swap.tokens).map((t) => t.toUpperCase()),
      amountBought: getBuys(swap.tokens).map(
        (token) => swap.tokens[token].amount
      ),
      priceBought: getBuys(swap.tokens).map(
        (token) => store.swaps.currentPrices[token]
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

function exportCsv() {
  const parser = new Parser();
  const flattened: any[] = [];
  store.filteredSwaps.forEach((swap: Swap) => {
    const first: any = {
      ...swap,
      date: formatDate(swap.date * 1000),
    };
    const nextTokens: any = [];
    let temp: any = {};
    Object.keys(swap.tokens).forEach((t) => {
      const tokenInfo = swap.tokens[t];
      if (tokenInfo.type === 'sell') {
        if (!first.sold_token) {
          first.sold_token = t.toUpperCase();
          first.sold_amount = tokenInfo.amount;
          first.sale_price = tokenInfo.price;
          first.sale_value = tokenInfo.value;
        } else {
          if (temp.sold_token) {
            nextTokens.push(temp);
            temp = {};
          }
          temp.sold_token = t.toUpperCase();
          temp.sold_amount = tokenInfo.amount;
          temp.sale_price = tokenInfo.price;
          temp.sale_value = tokenInfo.value;
        }
      }

      if (tokenInfo.type === 'buy') {
        if (!first.bought_token) {
          first.bought_token = t.toUpperCase();
          first.bought_amount = tokenInfo.amount;
          first.purchase_price = tokenInfo.price;
          first.purchase_value = tokenInfo.value;
        } else {
          if (temp.bought_token) {
            nextTokens.push(temp);
            temp = {};
          }
          temp.bought_token = t.toUpperCase();
          temp.bought_amount = tokenInfo.amount;
          temp.purchase_price = tokenInfo.price;
          temp.purchase_value = tokenInfo.value;
        }
      }
    });
    delete first.tokens;
    flattened.push(first);
    nextTokens.forEach((t: any) => flattened.push(t));
    if (temp.bought_token || temp.sold_token) {
      flattened.push(temp);
    }
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

function exportJson() {
  saveAs(
    new Blob(
      [
        JSON.stringify({
          ...store.swaps,
          swaps: store.filteredSwaps,
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

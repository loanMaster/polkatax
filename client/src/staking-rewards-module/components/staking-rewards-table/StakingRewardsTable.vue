<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="name"
      no-data-label="No rewards found"
      :pagination="initialPagination"
    >
      <template v-slot:top>
        <span class="text-h6" style="line-break: anywhere"
          >Rewards ({{ rewardsStore.rewards.chain }}) -
          {{ rewardsStore.rewards.timeFrame }} -
          {{ rewardsStore.rewards.address }}</span
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
import { computed, ref } from 'vue';
import { saveAs } from 'file-saver';
import { Parser } from '@json2csv/plainjs';
import { Reward } from '../../model/rewards';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import {
  tokenAmountFormatter,
  valueFormatter,
} from '../../../shared-module/util/number-formatters';

interface RewardsTableHeader extends Reward {
  'Reward token': string;
  Chain: string;
  Currency: string;
  'Wallet address': string;
  totalAmount: number;
  totalValue: number;
  totalValueNow: number;
}

const rewardsStore = useStakingRewardsStore();

const columns = computed(() => [
  {
    name: 'Date',
    required: true,
    label: 'Date',
    align: 'left',
    field: (row: Reward) => row.isoDate,
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
    name: 'reward',
    align: 'right',
    label: `Reward (${rewardToken.value})`,
    field: 'amount',
    format: (num: number) => amountFormatter.value.format(num),
    sortable: true,
  },
  {
    name: 'price',
    align: 'right',
    label: `Price (${rewardsStore?.rewards?.currency})`,
    field: 'price',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
  {
    name: 'value',
    align: 'right',
    label: `Value (${rewardsStore?.rewards?.currency})`,
    field: 'value',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
  {
    name: 'valueNow',
    align: 'right',
    label: `Value now (${rewardsStore?.rewards?.currency})`,
    field: 'valueNow',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
]);

const rows = computed(() => {
  return rewardsStore?.rewards?.values;
});

const tokenDigits = computed(() => {
  let max = 0;
  rewardsStore?.rewards?.values.forEach((v: Reward) => {
    const parts = v.amount.toString().split('.');
    if (parts.length < 2) {
      return 0;
    }
    const digits = parts[1].length;
    if (digits > max) {
      max = digits;
    }
  });
  return max;
});

const rewardToken = computed(() => {
  return rewardsStore?.rewards?.token;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function exportCsv() {
  const parser = new Parser();
  const values = [...(rewardsStore?.rewards?.values || [])];
  values[0] = {
    'Reward token': rewardsStore?.rewards?.token,
    Chain: rewardsStore?.rewards?.chain,
    Currency: rewardsStore?.rewards?.currency,
    'Wallet address': rewardsStore?.rewards?.address,
    'NominationPool Id': rewardsStore?.rewards?.nominationPoolId || '',
    ...values[0],
    totalAmount: rewardsStore?.rewards?.summary.amount,
    totalValue: rewardsStore?.rewards?.summary.value,
    totalValueNow: rewardsStore?.rewards?.summary?.valueNow,
  } as RewardsTableHeader;
  const csv = parser.parse(values);
  saveAs(
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'staking-rewards.csv'
  );
}

function exportJson() {
  saveAs(
    new Blob([JSON.stringify(rewardsStore.rewards)], {
      type: 'text/plain;charset=utf-8',
    }),
    'staking-rewards.json'
  );
}

const amountFormatter = computed(() => tokenAmountFormatter(tokenDigits.value));
</script>

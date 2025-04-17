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
        <div>
          <span class="text-h6" style="line-break: anywhere"
            >Rewards ({{ rewards?.chain }}) - {{ timeFrame }}</span
          ><br />
          <span class="text-h6" style="line-break: anywhere"
            >Address {{ rewards?.address }}</span
          >
        </div>
        <q-space />
        <q-btn color="primary" class="q-mr-sm" @click="exportCsv"
          >Export CSV
        </q-btn>
        <q-btn color="primary" class="q-mr-sm" @click="exportKoinlyCsv"
          >Koinly-friendly CSV
        </q-btn>
        <q-btn color="primary" @click="exportJson">Export JSON</q-btn>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { saveAs } from 'file-saver';
import { Parser } from '@json2csv/plainjs';
import { Reward, Rewards } from '../../model/rewards';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import {
  tokenAmountFormatter,
  valueFormatter,
} from '../../../shared-module/util/number-formatters';
import {
  formatTimeFrame,
  formatDate,
  formatDateUTC,
} from '../../../shared-module/util/date-utils';
import { Swap } from 'app/client/src/swap-module/model/swaps';

interface RewardsTableHeader extends Reward {
  'Reward token': string;
  Chain: string;
  Currency: string;
  'Wallet address': string;
  totalAmount: number;
  totalValue: number;
  totalValueNow: number;
  utcDate: string;
}

const rewardsStore = useStakingRewardsStore();
const rewards: Ref<Rewards | undefined> = ref(undefined);

const subscription = rewardsStore.rewards.subscribe((dataRequest) => {
  rewards.value = dataRequest.data;
});

onUnmounted(() => {
  subscription.unsubscribe();
});

const timeFrame = computed(() => {
  return rewards.value ? formatTimeFrame(rewards.value!.timeFrame) : '';
});

const columns = computed(() => [
  {
    name: 'date',
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
    label: `Price (${rewards.value?.currency})`,
    field: 'price',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
  {
    name: 'value',
    align: 'right',
    label: `Value (${rewards.value?.currency})`,
    field: 'value',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
  {
    name: 'valueNow',
    align: 'right',
    label: `Value now (${rewards.value?.currency})`,
    field: 'valueNow',
    format: (num: number) => valueFormatter.format(num),
    sortable: true,
  },
]);

const rows = computed(() => {
  return rewards.value?.values;
});

const tokenDigits = computed(() => {
  let max = 0;
  rewards.value?.values.forEach((v: Reward) => {
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
  return rewards.value?.token;
});

const initialPagination = ref({
  sortBy: 'block',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

function exportCsv() {
  const parser = new Parser();
  const values = [...(rewards.value?.values || [])].map((v) => {
    return {
      ...v,
      utcDate: formatDateUTC(v.date * 1000),
    };
  });
  values[0] = {
    'Reward token': rewards.value?.token,
    Chain: rewards.value?.chain,
    Currency: rewards.value?.currency,
    'Wallet address': rewards.value?.address,
    'NominationPool Id': rewards.value?.nominationPoolId || '',
    ...values[0],
    totalAmount: rewards.value?.summary.amount,
    totalValue: rewards.value?.summary.value,
    totalValueNow: rewards.value?.summary?.valueNow,
  } as RewardsTableHeader;
  const csv = parser.parse(values);
  saveAs(
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'staking-rewards.csv'
  );
}

function exportKoinlyCsv() {
  const parser = new Parser();
  const values = [...(rewards.value?.values || [])].map((v) => {
    return {
      'Koinly Date': formatDateUTC(v.date * 1000),
      Amount: v.amount,
      Currency: rewards.value?.token,
      TxHash: v.hash,
    };
  });
  const csv = parser.parse(values);
  saveAs(
    new Blob([csv], { type: 'text/plain;charset=utf-8' }),
    'staking-rewards.csv'
  );
}

function exportJson() {
  const values = [...(rewards.value?.values || [])].map((v) => {
    return {
      ...v,
      date: formatDateUTC(v.date * 1000),
    };
  });
  saveAs(
    new Blob([JSON.stringify({ ...rewardsStore.rewards, values: values })], {
      type: 'text/plain;charset=utf-8',
    }),
    'staking-rewards.json'
  );
}

const amountFormatter = computed(() => tokenAmountFormatter(tokenDigits.value));
</script>

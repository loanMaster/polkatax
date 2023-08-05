<template>
  <google-chart
    .data="rewardDataTable"
    type="LineChart"
    .options="options"
    style="width: 100%; min-height: 400px"
  ></google-chart>
</template>
<script setup lang="ts">
import '@google-web-components/google-chart';
import { dataTable } from '@google-web-components/google-chart/loader.js';
import { computed, onMounted, Ref, ref } from 'vue';
import { useRewardsStore } from '../../../stores/rewards.store';
import { Reward } from '../../..//model/rewards';

const rewardDataTable: Ref<google.visualization.DataTable | undefined> =
  ref(undefined);
const rewardsStore = useRewardsStore();

const props = defineProps({
  currency: Boolean,
});

onMounted(() => {
  drawChart();
});

const drawChart = async () => {
  rewardDataTable.value = await dataTable(undefined);
  rewardDataTable.value.addColumn('date', 'X');
  if (props.currency) {
    rewardDataTable.value.addColumn('number', 'Value at payout time');
    rewardDataTable.value.addColumn('number', 'Value now');
  } else {
    rewardDataTable.value.addColumn('number', 'Reward');
  }

  const data = (rewardsStore.rewards?.values || []).map((r: Reward) => {
    return props.currency
      ? [new Date(r.date * 1000), r.value, r.valueNow]
      : [new Date(r.date * 1000), r.amount];
  });
  rewardDataTable.value.addRows(data);
};

rewardsStore.$onAction(({ name, after }) => {
  if (name === 'fetchRewards') {
    after(() => drawChart());
  }
});

const options = computed(() => ({
  title: `Rewards (${
    props.currency
      ? rewardsStore.rewards!.currency
      : rewardsStore.rewards!.token
  })`,
  curveType: rewardsStore.rewards!.values.length > 10 ? 'function' : undefined,
  legend: { position: 'top' },
  hAxis: {
    title: 'Date',
  },
  axisTitlesPosition: 'out',
}));
</script>

<template>
  <GChart
    v-if="hasData"
    :data="rewardDataTable"
    type="LineChart"
    :options="options"
    style="width: 100%; min-height: 400px"
  ></GChart>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRewardsStore } from '../../../stores/rewards.store';
import { Reward } from '../../..//model/rewards';
import { GChart } from 'vue-google-charts';

const rewardsStore = useRewardsStore();

const props = defineProps({
  currency: Boolean,
});

const hasData = computed(() => {
  return (rewardsStore.rewards?.values || []).length !== 0;
});

const rewardDataTable = computed(() => {
  const header = props.currency
    ? [['date', 'Value', 'Value now']]
    : [['date', 'Amount']];
  const data = (rewardsStore.rewards?.values || []).map((r: Reward) => {
    return props.currency
      ? [new Date(r.date * 1000), r.value, r.valueNow]
      : [new Date(r.date * 1000), r.amount];
  });

  return [...header, ...data];
});

const options = computed(() => ({
  title: `Rewards (${
    props.currency
      ? rewardsStore.rewards!.currency
      : rewardsStore.rewards!.token
  })`,
  curveType: rewardsStore.rewards!.values.length > 50 ? 'function' : undefined,
  legend: { position: 'top' },
  hAxis: {
    title: 'Date',
  },
  axisTitlesPosition: 'out',
}));
</script>

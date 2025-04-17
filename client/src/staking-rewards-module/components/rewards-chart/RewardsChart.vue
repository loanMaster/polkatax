<template>
  <GChart
    v-if="hasData"
    :data="rewardDataTable"
    :type="chartType"
    :options="options"
    style="width: 100%; min-height: 400px"
  ></GChart>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { GChart } from 'vue-google-charts';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import { formatDate } from '../../../shared-module/util/date-utils';

const rewardsStore = useStakingRewardsStore();

const props = defineProps({
  currency: Boolean,
  chartType: String,
});

const hasData = computed(() => {
  return (rewardsStore.rewards?.values || []).length !== 0;
});

const rewardDataTable = computed(() => {
  const header = props.currency
    ? [['date', 'Value at payout time', 'Value now']]
    : [['date', 'Amount']];
  const minDay = rewardsStore.rewards!.values[0].isoDate;
  const maxDay =
    rewardsStore.rewards!.values[rewardsStore.rewards!.values.length - 1]
      .isoDate;
  const temp = new Date(minDay);
  temp.setHours(0);
  temp.setMilliseconds(0);
  temp.setSeconds(0);
  const data = [];
  let isoDate = formatDate(temp.getTime());
  do {
    isoDate = formatDate(temp.getTime());
    data.push(
      props.currency
        ? [
            new Date(isoDate + ':00:00:00'),
            rewardsStore.rewards?.dailyValues[isoDate]?.value || 0,
            rewardsStore.rewards?.dailyValues[isoDate]?.valueNow || 0,
          ]
        : [
            new Date(isoDate + ':00:00:00'),
            rewardsStore.rewards?.dailyValues[isoDate]?.amount || 0,
          ]
    );
    temp.setDate(temp.getDate() + 1);
  } while (isoDate !== maxDay);
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
  vAxis: {
    minValue: 0,
  },
  axisTitlesPosition: 'out',
}));
</script>

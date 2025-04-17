<template>
  <div class="text-h6">Summary of staking rewards ({{ timeFrame }})</div>
  <table class="q-my-lg q-mx-auto">
    <tr>
      <td class="text-left q-pa-sm">Total rewards:</td>
      <td class="text-right q-pa-sm">
        {{
          formatTokenAmount(rewardsStore.rewards!.summary.amount) +
          ' ' +
          rewardsStore.rewards!.token
        }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Average rewards per day:</td>
      <td class="text-right q-pa-sm">
        {{
          formatTokenAmount(averageDailyRewards) +
          ' ' +
          rewardsStore.rewards!.token
        }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value at payout time:</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(rewardsStore.rewards!.summary.value) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value now:</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(rewardsStore.rewards!.summary.valueNow) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Current price:</td>
      <td class="text-right q-pa-sm">
        {{ formatPrice(rewardsStore.rewards!.currentPrice) }}
      </td>
    </tr>
  </table>
  <div>
    Verify your rewards here:
    <a
      :href="`https://${rewardsStore.rewards.chain}.subscan.io/account/${rewardsStore.rewards.address}?tab=reward`"
      style="line-break: anywhere"
      target="_blank"
    >
      https://{{ rewardsStore.rewards!.chain }}.subscan.io/account/{{
        rewardsStore.rewards!.address
      }}?tab=reward
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import { formatTimeFrame } from '../../../shared-module/util/date-utils';

const rewardsStore = useStakingRewardsStore();

const averageDailyRewards = computed(() => {
  if (!rewardsStore.rewards) {
    return 0;
  }
  return (
    (rewardsStore.rewards!.summary.amount /
      (rewardsStore.rewards!.endDate - rewardsStore.rewards!.startDate)) *
    24 *
    60 *
    60 *
    1000
  );
});

const timeFrame = computed(() => {
  return rewardsStore.rewards
    ? formatTimeFrame(rewardsStore.rewards!.timeFrame)
    : '';
});

function formatCurrency(value: number) {
  if (isNaN(value)) {
    return '?';
  }
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    style: 'currency',
    currency: rewardsStore.rewards!.currency.toUpperCase(),
  }).format(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    style: 'currency',
    currency: rewardsStore.rewards!.currency.toUpperCase(),
    maximumSignificantDigits: 4,
  }).format(value);
}

function formatTokenAmount(value: number) {
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}
</script>

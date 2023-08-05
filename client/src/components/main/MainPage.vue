<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div class="q-my-md flex justify-between align-center items-center">
      <div class="dropdown"><token-dropdown /></div>
      <div class="dropdown"><currency-dropdown /></div>
      <time-frame-dropdown />
      <q-input
        filled
        v-model="rewardsStore.address"
        label="Wallet address"
        @keyup.enter="fetchRewards"
      />
      <q-btn
        color="primary"
        label="Submit"
        @click="fetchRewards"
        :disable="isDisabled"
      />
    </div>
    <div class="text-center q-my-xl" v-if="rewardsStore.rewards">
      <div class="text-h6">
        Summary of staking rewards ({{ rewardsStore.rewards.timeFrame }})
      </div>
      <table class="q-my-lg q-mx-auto">
        <tr>
          <td class="text-left q-pa-sm">Total rewards:</td>
          <td class="text-right q-pa-sm">
            {{
              rewardsStore.rewards.summary.amount +
              ' ' +
              rewardsStore.rewards.token
            }}
          </td>
        </tr>
        <tr>
          <td class="text-left q-pa-sm">
            Value at payout time ({{ rewardsStore.rewards.currency }}):
          </td>
          <td class="text-right q-pa-sm">
            {{ rewardsStore.rewards.summary.value.toFixed(2) }}
          </td>
        </tr>
        <tr>
          <td class="text-left q-pa-sm">
            Value now ({{ rewardsStore.rewards.currency }}):
          </td>
          <td class="text-right q-pa-sm">
            {{ rewardsStore.rewards.summary.valueNow.toFixed(2) }}
          </td>
        </tr>
        <tr>
          <td class="text-left q-pa-sm">
            Current price ({{ rewardsStore.rewards.currency }}):
          </td>
          <td class="text-right q-pa-sm">
            {{ rewardsStore.rewards.currentPrice }}
          </td>
        </tr>
      </table>
      <div>
        Verify your rewards here:
        <a
          :href="`https://${rewardsStore.rewards.chain}.subscan.io/account/${rewardsStore.rewards.address}?tab=reward`"
          target="_blank"
        >
          https://{{ rewardsStore.rewards.chain }}.subscan.io/account/{{
            rewardsStore.rewards.address
          }}?tab=reward
        </a>
      </div>
    </div>
    <div class="justify-around items-center column" v-if="rewardsStore.rewards">
      <rewards-chart :currency="false" />
      <rewards-chart :currency="true" />
    </div>
    <div class="table q-my-md" v-if="rewardsStore.rewards">
      <staking-rewards-table />
    </div>
    <div v-if="!rewardsStore.rewards" class="q-my-xl">
      <div class="text-h6 text-center">
        Export your staking rewards as CSV or JSON
      </div>
      <div class="text-h6 text-center q-mt-md">
        A wide range of substrate chains and fiat currencies are supported.
      </div>
      <div class="text-h6 text-center">
        Select a network, a fiat currency, a time frame and enter your wallet
        address. Then press submit.
      </div>
      <div class="text-center q-my-md">
        This program returns the staking rewards earned as nominator. This
        software comes without warranty. Please verify the exported results
      </div>
      <div class="q-mx-auto text-center">
        <img :src="meme" style="max-width: 80%" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import TokenDropdown from './token-dropdown/TokenDropdown.vue';
import RewardsChart from './rewards-chart/RewardsChart.vue';
import CurrencyDropdown from './currency-dropdown/CurrencyDropdown.vue';
import StakingRewardsTable from './staking-rewards-table/StakingRewardsTable.vue';
import TimeFrameDropdown from './time-frame-dropdown/TimeFrameDropdown.vue';
import { useRewardsStore } from '../../stores/rewards.store';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
const $q = useQuasar();

const rewardsStore = useRewardsStore();

async function fetchRewards() {
  if (!isDisabled.value) {
    try {
      $q.loading.show({
        message:
          'Fetching staking rewards. This may take a while. Please be patient...',
        html: true,
        boxClass: 'bg-grey-2 text-grey-9',
        spinnerColor: 'primary',
      });
      await rewardsStore.fetchRewards();
    } catch (error: Response) {
      const message =
        error.status && error.status === 429
          ? 'Too many requests. Please try again later'
          : error.status && error.status === 400
          ? 'The data provided is invalid. Please check the wallet address.'
          : 'There was an error fetching your data. Please try again later';
      $q.dialog({
        title: 'An error occurred',
        message,
        persistent: true,
      });
    } finally {
      $q.loading.hide();
    }
  }
}

const isDisabled = computed(() => {
  return (
    rewardsStore.address.trim() === '' ||
    !rewardsStore.currency ||
    !rewardsStore.chain
  );
});

const meme = ref(`img/${Math.floor(Math.random() * 2).toFixed(0)}.jpg`);
</script>
<style scoped>
.dropdown {
  width: 238px;
}
.content {
  max-width: 1600px;
  min-height: 0 !important;
}
</style>

<template>
  <q-page class="q-px-sm q-mx-auto content">
    <div
      class="q-my-md flex justify-between align-center items-center column-md row-lg row-xl column-xs column-sm"
    >
      <div class="dropdown"><chain-dropdown v-model="store.chain" /></div>
      <div class="dropdown"><currency-dropdown v-model="store.currency" /></div>
      <div class="dropdown">
        <date-picker
          v-model="store.startDate"
          label="Start date"
          @update:modelValue="validateDate"
        />
      </div>
      <div class="dropdown">
        <date-picker
          v-model="store.endDate"
          label="End date"
          @update:modelValue="validateDate"
        />
        <div
          :style="{ opacity: dateValidationError ? 1 : 0 }"
          style="color: red; margin-top: -12px; position: absolute"
          class="q-ml-md q-field--error"
        >
          ⓘ {{ dateValidationError }}
        </div>
      </div>
      <address-input v-model="store.address" />
      <q-btn
        color="primary"
        label="Submit"
        @click="fetchRewards"
        :disable="isDisabled"
      />
    </div>
    <q-tabs
      v-model="tab"
      dense
      align="center"
      class="bg-primary text-white shadow-2"
      :breakpoint="0"
    >
      <q-tab name="payments" label="Transfers" />
      <q-tab name="swaps" label="Swaps" />
    </q-tabs>
    <div>
      <token-transfers
        v-if="store.paymentList !== undefined && tab === 'payments'"
      />
      <token-swaps v-if="store.paymentList !== undefined && tab === 'swaps'" />
      <div v-if="store.paymentList === undefined" class="q-my-xl">
        <div class="text-h6 text-center">
          ⚠ This is an Alpha version and subject to change ⚠
        </div>
        <div class="text-h6 text-center">
          Export your transfers and swaps as CSV or JSON. <br />
          This information can be useful for taxation of air drops, LP rewards,
          trades and other payments.
        </div>
        <div class="text-h6 text-center q-mt-md">
          Polkadot SDK chains, Ethereum chains (L1/L2) and fiat currencies are
          supported.
        </div>
        <div class="text-h6 text-center">
          Select a network, a fiat currency, a time frame and enter your wallet
          address. Then press submit.
        </div>
        <div class="text-center q-my-md">
          This software comes without warranty. Please verify the exported
          results.
        </div>
        <div class="q-mx-auto text-center">
          <img :src="meme" style="max-width: 80%" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AddressInput from '../../shared-module/components/address-input/AddressInput.vue';
import CurrencyDropdown from '../../shared-module/components/currency-dropdown/CurrencyDropdown.vue';
import ChainDropdown from '../../shared-module/components/chain-dropdown/ChainDropdown.vue';
import DatePicker from '../../shared-module/components/date-picker/DatePicker.vue';
import TokenTransfers from './TokenTransfers.vue';
import TokenSwaps from '../../swap-module/components/TokenSwaps.vue';

import { computed, ref } from 'vue';
import { date, useQuasar } from 'quasar';
import { usePaymentsStore } from '../store/payments.store';
const $q = useQuasar();

const store = usePaymentsStore();
const tab = ref('payments');
const dateValidationError = ref('');

async function fetchRewards() {
  if (!isDisabled.value) {
    try {
      $q.loading.show({
        message:
          'Fetching transfers. This may take a while. Please be patient...',
        html: true,
        boxClass: 'bg-grey-2 text-grey-9',
        spinnerColor: 'primary',
      });
      await store.fetchTransfers();
    } catch (error: any) {
      const message =
        error.status && error.status === 429
          ? 'Too many requests. Please try again in one minute'
          : error.status && error.status === 400
          ? await error.text()
          : 'There was an error fetching your data. Please try again later';
      $q.dialog({
        title:
          error.status && error.status === 429
            ? 'Request limit exceeded'
            : 'An error occurred',
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
    store.address.trim() === '' ||
    !store.currency ||
    !store.chain ||
    !validateDate()
  );
});

function validateDate() {
  const timeStamp = Date.now();
  dateValidationError.value = '';
  const maxDate = date.formatDate(timeStamp, 'YYYY/MM/DD');
  if (store.startDate <= maxDate && store.endDate <= maxDate) {
    if (store.startDate > store.endDate) {
      dateValidationError.value = 'End date must not be before start date';
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

const meme = ref(`img/${Math.floor(Math.random() * 3).toFixed(0)}.jpg`);
</script>

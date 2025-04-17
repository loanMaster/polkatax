<template>
  <div class="q-pa-md" style="flex: auto; max-width: 200px">
    <q-select
      filled
      :model-value="selectedToken"
      @update:model-value="onListItemClick"
      :options="tokens"
      label="Token"
      :option-label="capitalize"
      stack-label
    />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { usePaymentsStore } from '../../store/payments.store';

const store = usePaymentsStore();

const selectedToken = computed(() => {
  return store.selectedToken;
});

const tokens = computed(() => {
  return Object.keys(store.paymentList?.tokens || {}).sort((a, b) =>
    a > b ? 1 : -1
  );
});

function capitalize(input: string) {
  return input.toUpperCase();
}

function onListItemClick(selectedToken: string) {
  store.selectedToken = selectedToken;
}
</script>

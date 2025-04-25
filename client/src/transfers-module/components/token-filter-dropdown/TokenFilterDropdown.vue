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
import { computed, onUnmounted, ref, Ref } from 'vue';
import { usePaymentsStore } from '../../store/payments.store';
import { PaymentPortfolio } from '../../model/payments';

const store = usePaymentsStore();

const selectedToken: Ref<string | undefined> = ref(undefined);
const paymentPortfolio: Ref<PaymentPortfolio | undefined> = ref(undefined);

const tokenSubscription = store.selectedToken$.subscribe(
  (token) => (selectedToken.value = token)
);
const paymentSubscription = store.paymentList$.subscribe(
  (paymentReq) => (paymentPortfolio.value = paymentReq.data)
);

onUnmounted(() => {
  tokenSubscription.unsubscribe();
  paymentSubscription.unsubscribe();
});

const tokens = computed(() => {
  return Object.keys(paymentPortfolio.value?.tokens || {}).sort((a, b) =>
    a > b ? 1 : -1
  );
});

function capitalize(input: string) {
  return input.toUpperCase();
}

function onListItemClick(selectedToken: string) {
  store.selectToken(selectedToken);
}
</script>

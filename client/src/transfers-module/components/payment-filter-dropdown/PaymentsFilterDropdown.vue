<template>
  <div class="q-pa-md">
    <q-btn-dropdown :label="selectedPaymentsFilter" push no-caps>
      <q-list>
        <q-item
          v-for="paymentFilter in Object.values(paymentFilters)"
          :key="paymentFilter"
          clickable
          v-close-popup
          @click="onListItemClick(paymentFilter)"
        >
          <q-item-section>
            <q-item-label>{{ paymentFilter }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>
<script setup lang="ts">
import { onUnmounted, Ref, ref } from 'vue';
import { usePaymentsStore } from '../../store/payments.store';

const paymentFilters = ref([
  'All transfers',
  'Outgoing transfers only',
  'Incoming transfers only',
]);

const store = usePaymentsStore();
const selectedPaymentsFilter: Ref<string | undefined> = ref(undefined);

const subscription = store.paymentsFilter$.subscribe((f) => {
  selectedPaymentsFilter.value = f;
});

onUnmounted(() => {
  subscription.unsubscribe();
});

function onListItemClick(paymentsFilter: string) {
  store.setPaymentsFilter(paymentsFilter);
}
</script>

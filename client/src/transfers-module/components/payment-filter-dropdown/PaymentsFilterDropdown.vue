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
import { computed, ref } from 'vue';
import { usePaymentsStore } from '../../store/payments.store';

const paymentFilters = ref([
  'All transfers',
  'Outgoing transfers only',
  'Incoming transfers only',
]);

const store = usePaymentsStore();

const selectedPaymentsFilter = computed(() => {
  return Object.values(paymentFilters.value).find(
    (k) => k === store.paymentsFilter
  );
});

function onListItemClick(paymentsFilter: string) {
  store.paymentsFilter = paymentsFilter;
}
</script>

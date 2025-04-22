<template>
  <div class="row justify-center items-center" v-if="paymentsCurrentToken">
    <token-filter-dropdown />
    <payments-filter-dropdown />
  </div>
  <div class="table q-my-md" v-if="paymentsCurrentToken">
    <payments-table />
  </div>

  <div class="justify-around items-center column" v-if="paymentsCurrentToken">
    <payments-summary/>
  </div>

  <div class="justify-around items-center column" v-if="paymentsCurrentToken">
    <payments-chart :currency="false" />
    <payments-chart :currency="true" />
  </div>

  <div v-if="paymentsCurrentToken === undefined">
    <div class="text-h6 text-center">No transfers found</div>
  </div>
</template>

<script setup lang="ts">
import PaymentsTable from './payments-table/PaymentsTable.vue';
import PaymentsChart from './payments-chart/PaymentsChart.vue';
import PaymentsSummary from './payments-summary/PaymentsSummary.vue';
import PaymentsFilterDropdown from './payment-filter-dropdown/PaymentsFilterDropdown.vue';
import TokenFilterDropdown from './token-filter-dropdown/TokenFilterDropdown.vue';
import { usePaymentsStore } from '../store/payments.store';
import { TokenPaymentsData } from '../model/payments';
import { onUnmounted, Ref, ref } from 'vue';

const store = usePaymentsStore();

const paymentsCurrentToken: Ref<TokenPaymentsData | undefined> = ref(undefined);

const subscription = store.paymentsCurrentToken$.subscribe((paymentOfToken) => {
  paymentsCurrentToken.value = paymentOfToken;
});

onUnmounted(() => {
  subscription.unsubscribe();
});
</script>

<template>
  <div
    class="row justify-center items-center"
    v-if="store.paymentsCurrentToken"
  >
    <token-filter-dropdown />
    <payments-filter-dropdown />
  </div>
  <div class="table q-my-md" v-if="store.paymentsCurrentToken">
    <payments-table />
  </div>

  <div
    class="justify-around items-center column"
    v-if="store.paymentsCurrentToken"
  >
    <payments-summary />
  </div>

  <div
    class="justify-around items-center column"
    v-if="store.paymentsCurrentToken"
  >
    <payments-chart :currency="false" />
    <payments-chart :currency="true" />
  </div>

  <div v-if="store.paymentsCurrentToken === undefined">
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

const store = usePaymentsStore();
</script>

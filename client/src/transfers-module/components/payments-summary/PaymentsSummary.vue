<template>
  <div class="text-h6">Transfers summary</div>
  <table class="q-my-lg q-mx-auto">
    <tr>
      <td class="text-left q-pa-sm">Chain:</td>
      <td class="text-right q-pa-sm">
        {{ store.paymentList.chain }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Token:</td>
      <td class="text-right q-pa-sm">
        {{ store.selectedToken.toUpperCase() }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Total transfers:</td>
      <td class="text-right q-pa-sm">
        {{
          formatTokenAmount(store.paymentsCurrentToken.summary.amount) +
          ' ' +
          store.selectedToken.toUpperCase()
        }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value at time of transaction(s):</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(store.paymentsCurrentToken.summary.value) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value now:</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(store.paymentsCurrentToken.summary.valueNow) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Current price:</td>
      <td class="text-right q-pa-sm">
        {{ formatPrice(store.paymentsCurrentToken.currentPrice) }}
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import {
  currencyFormatter,
  tokenAmountFormatter,
} from '../../../shared-module/util/number-formatters';
import { usePaymentsStore } from 'src/transfers-module/store/payments.store';

const store = usePaymentsStore();

function formatCurrency(value: number) {
  if (isNaN(value)) {
    return '-';
  }
  return currencyFormatter(store.paymentList.currency).format(value);
}

function formatPrice(value: number) {
  if (isNaN(value)) {
    return '-';
  }
  return currencyFormatter(store.paymentList.currency).format(value);
}

function formatTokenAmount(value: number) {
  if (isNaN(value)) {
    return '-';
  }
  return tokenAmountFormatter(4).format(value);
}
</script>

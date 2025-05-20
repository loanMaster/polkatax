<template>
  <div class="text-h6">Transfers summary</div>
  <table class="q-my-lg q-mx-auto">
    <tr>
      <td class="text-left q-pa-sm">Chain:</td>
      <td class="text-right q-pa-sm">
        {{ paymentList?.chain }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Token:</td>
      <td class="text-right q-pa-sm">
        {{ (selectedToken || '').toUpperCase() }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Total transfers:</td>
      <td class="text-right q-pa-sm">
        {{
          formatTokenAmount(paymentsCurrentToken?.summary?.amount || 0) +
          ' ' +
          (selectedToken || '').toUpperCase()
        }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value at time of transaction(s):</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(paymentsCurrentToken?.summary?.fiatValue || 0) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Value now:</td>
      <td class="text-right q-pa-sm">
        {{ formatCurrency(paymentsCurrentToken?.summary?.valueNow || 0) }}
      </td>
    </tr>
    <tr>
      <td class="text-left q-pa-sm">Current price:</td>
      <td class="text-right q-pa-sm">
        {{ formatPrice(paymentsCurrentToken?.currentPrice || 0) }}
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { onUnmounted, Ref, ref } from 'vue';
import {
  currencyFormatter,
  tokenAmountFormatter,
} from '../../../shared-module/util/number-formatters';
import { PaymentPortfolio, TokenPaymentsData } from '../../model/payments';
import { usePaymentsStore } from '../../store/payments.store';

const store = usePaymentsStore();

const paymentList: Ref<PaymentPortfolio | undefined> = ref(undefined);
const paymentsCurrentToken: Ref<TokenPaymentsData | undefined> = ref(undefined);
const selectedToken: Ref<string | undefined> = ref(undefined);

const subscriptionAllPayments = store.paymentList$.subscribe((payments) => {
  paymentList.value = payments.data;
});

const subscriptionCurrentTokenPayments = store.paymentsCurrentToken$.subscribe(
  (paymentOfToken) => {
    paymentsCurrentToken.value = paymentOfToken;
  }
);

const selectedTokenSubscription = store.selectedToken$.subscribe((token) => {
  selectedToken.value = token;
});

onUnmounted(() => {
  subscriptionAllPayments.unsubscribe();
  subscriptionCurrentTokenPayments.unsubscribe();
  selectedTokenSubscription.unsubscribe();
});

function formatCurrency(value: number) {
  if (isNaN(value)) {
    return '-';
  }
  return currencyFormatter(paymentList.value?.currency).format(value);
}

function formatPrice(value: number | undefined) {
  if (value === undefined || isNaN(value)) {
    return '-';
  }
  return currencyFormatter(paymentList.value?.currency).format(value);
}

function formatTokenAmount(value: number) {
  if (isNaN(value)) {
    return '-';
  }
  return tokenAmountFormatter(4).format(value);
}
</script>

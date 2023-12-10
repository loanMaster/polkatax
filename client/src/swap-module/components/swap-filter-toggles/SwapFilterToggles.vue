<template>
  <div class="q-pa-md">
    <span>Filter trades according to type of swap</span>
    <div class="col">
      <q-checkbox
        v-model="store.swapTypeFilter.twoAssets"
        label="Show trades with two assets"
      />
      <q-checkbox
        v-model="store.swapTypeFilter.multipleAssets"
        label="Show trades with more than two assets"
      >
        <q-icon name="info">
          <q-tooltip
            anchor="top middle"
            self="bottom middle"
            :offset="[10, 10]"
            class="text-body2"
          >
            These are usually transactions to provide/remove liquidity to/from a
            dex
          </q-tooltip>
        </q-icon>
      </q-checkbox>
    </div>
    <div class="q-mt-md">Filter trades according to assets</div>
    <div class="flex justify-center">
      <q-checkbox
        :model-value="all"
        @update:model-value="toggleAll"
        label="All"
      />
      <div v-for="token in store.visibleSwapTokens" v-bind:key="token">
        <q-checkbox v-model="token.value" :label="token.name.toUpperCase()" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { usePaymentsStore } from 'src/transfers-module/store/payments.store';
import { computed } from 'vue';

const store = usePaymentsStore();

const all = computed(() => {
  return store.visibleSwapTokens.every((t: { value: boolean }) => t.value);
});

function toggleAll() {
  if (all.value) {
    store.visibleSwapTokens.forEach(
      (t: { value: boolean }) => (t.value = false)
    );
  } else {
    store.visibleSwapTokens.forEach(
      (t: { value: boolean }) => (t.value = true)
    );
  }
}
</script>

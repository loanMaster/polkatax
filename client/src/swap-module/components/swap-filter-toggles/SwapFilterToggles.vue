<template>
  <div class="q-pa-md">
    <span>Filter trades according to type of swap</span>
    <div class="col">
      <q-checkbox
        :modelValue="swapTypeFilter?.twoAssets"
        @update:model-value="toggleTwoAssets"
        label="Show trades with two assets"
      />
      <q-checkbox
        :modelValue="swapTypeFilter?.multipleAssets"
        label="Show trades with more than two assets"
        @update:model-value="toggleMultipleAssets"
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
      <div v-for="token in visibleSwapTokens" v-bind:key="token.name">
        <q-checkbox
          :model-value="token.value"
          :label="token.name.toUpperCase()"
          @update:model-value="(value) => toggleOne(token.name, value)"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { usePaymentsStore } from '../../../transfers-module/store/payments.store';
import { computed, onUnmounted, ref, Ref } from 'vue';

const store = usePaymentsStore();
const visibleSwapTokens: Ref<{ name: string; value: boolean }[]> = ref([]);
const swapTypeFilter: Ref<
  | {
      twoAssets: boolean;
      multipleAssets: boolean;
    }
  | undefined
> = ref(undefined);

const visibleSwapTokensSub = store.visibleSwapTokens$.subscribe(
  (visibleTokens) => {
    visibleSwapTokens.value = visibleTokens;
  }
);

function toggleOne(token: string, visible: boolean) {
  store.updateSwapAssetVisibility(token, visible);
}

const filterSub = store.swapTypeFilter$.subscribe((filter) => {
  swapTypeFilter.value = filter;
});

onUnmounted(() => {
  visibleSwapTokensSub.unsubscribe();
  filterSub.unsubscribe();
});

function toggleTwoAssets(event: boolean) {
  store.setSwapsFilter({
    twoAssets: event,
    multipleAssets: swapTypeFilter.value?.multipleAssets || false,
  });
}

function toggleMultipleAssets(event: boolean) {
  store.setSwapsFilter({
    twoAssets: swapTypeFilter.value?.twoAssets || false,
    multipleAssets: event,
  });
}

const all = computed(() => {
  return visibleSwapTokens.value.every((t: { value: boolean }) => t.value);
});

function toggleAll() {
  store.toggleAllVisibleSwapTokens();
}
</script>

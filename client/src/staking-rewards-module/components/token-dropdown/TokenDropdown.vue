<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      v-model="chain"
      :label="chain ? chain.label : 'Token'"
      :options="filteredChains"
      option-value="chain"
      option-label="symbol"
      color="teal"
      @update:model-value="onNewValueSelected"
      clearable
      options-selected-class="text-deep-orange"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label
              >{{ scope.opt.label || scope.opt.chain }}
            </q-item-label>
            <q-item-label caption>{{ scope.opt.symbol }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, Ref, ref } from 'vue';
import { useStakingRewardsStore } from '../../store/staking-rewards.store';
import { Chain } from '../../../shared-module/model/chain';

const chains: Ref<Chain[]> = ref([]);
const filteredChains: Ref<Chain[]> = ref([]);
const emits = defineEmits(['update:modelValue']);

const store = useStakingRewardsStore();

const subscription = store.chainList.subscribe((chains) => {
  chains.value = chains
    .sort((a: Chain, b: Chain) => (a.label > b.label ? 1 : -1))
    .map((c: Chain) => c.token);
  filteredChains.value = chains.value;
});

onUnmounted(() => {
  subscription.unsubscribe();
});

const props = defineProps({
  modelValue: String,
});

function onNewValueSelected(value: Chain) {
  emits('update:modelValue', value);
}

function filterFn(val: string, update: (cb: () => void) => void) {
  if (val.trim() === '') {
    update(() => {
      filteredChains.value = chains.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredChains.value = chains.value.filter(
      (v: Chain) =>
        v.token.toLowerCase().indexOf(needle) > -1 ||
        v.token.toLowerCase().indexOf(needle) > -1
    );
  });
}

const chain = computed(() => {
  return chains.value.find((c) => c.domain === props.modelValue);
});
</script>

<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      :model-value="chain"
      :label="chain ? chain.name : 'Blockchain'"
      :options="filteredChains"
      option-value="chain"
      option-label="label"
      color="teal"
      @update:model-value="onNewValueSelected"
      clearable
      options-selected-class="text-deep-orange"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label caption>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Chain } from '../../../shared-module/model/chain';

const chains = ref(
  chainList.sort((a: Chain, b: Chain) => (a.label > b.label ? 1 : -1))
);
const filteredChains = ref(chains.value);

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: String,
});

function onNewValueSelected(value: Chain) {
  emits('update:modelValue', value ? value.chain : '');
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
      (v: Chain) => v.label.toLowerCase().indexOf(needle) > -1
    );
  });
}

const chain = computed(() => {
  return chainList.find((t: Chain) => t.chain === props.modelValue);
});
</script>

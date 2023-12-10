<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      v-model="chain"
      :label="chain ? chain.label : 'Token'"
      :options="filteredTokens"
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
import { tokenList } from '../../../shared-module/const/tokenList';
import { computed, ref } from 'vue';
import { Token } from '../../../shared-module/model/token';

const tokens = ref(
  tokenList
    .filter((t) => t.stakingRewards === undefined || t.stakingRewards)
    .sort((a, b) => (a.chain > b.chain ? 1 : -1))
);
const filteredTokens = ref(tokens.value);

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: String,
});

function onNewValueSelected(value: Token) {
  emits('update:modelValue', value ? value.chain : '');
}

function filterFn(val: string, update: (cb: () => void) => void) {
  if (val.trim() === '') {
    update(() => {
      filteredTokens.value = tokens.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredTokens.value = tokens.value.filter(
      (v: Token) =>
        v.symbol.toLowerCase().indexOf(needle) > -1 ||
        v.label.toLowerCase().indexOf(needle) > -1
    );
  });
}

const chain = computed(() => {
  return tokenList.find((t) => t.chain === props.modelValue);
});
</script>

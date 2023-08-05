<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      v-model="model"
      :label="model ? model.label : 'Token'"
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
            <q-item-label>{{
              scope.opt.label || scope.opt.chain
            }}</q-item-label>
            <q-item-label caption>{{ scope.opt.symbol }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRewardsStore } from '../../../stores/rewards.store';
import { tokenList } from '../../../const/tokenList';
import { Token } from '../../../model/token';

const rewardsStore = useRewardsStore();
const tokens = ref(tokenList.sort((a, b) => (a.chain > b.chain ? 1 : -1)));
const filteredTokens = ref(tokens.value);

const model = ref(undefined);

function onNewValueSelected(value: Token) {
  rewardsStore.chain = value ? value.chain : '';
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
</script>

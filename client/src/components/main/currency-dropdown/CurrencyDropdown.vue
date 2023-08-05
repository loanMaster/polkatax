<template>
  <div class="q-pa-md">
    <q-select
      filled
      @filter="filterFn"
      use-input
      v-model="model"
      label="Currency"
      :options="filteredCurrencies"
      option-value="name"
      color="teal"
      @update:model-value="onNewValueSelected"
      clearable
      :options-html="true"
      options-selected-class="text-deep-orange"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label
              ><span v-html="scope.opt.flag" />
              {{ scope.opt.name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRewardsStore } from '../../../stores/rewards.store';
import { currencyList } from '../../../const/currencyList';
import { Currency } from '../../../model/currency';

const rewardsStore = useRewardsStore();
const currencies = currencyList
  .sort((a, b) => (a.name > b.name ? 1 : -1))
  .map((c) => {
    return {
      ...c,
      label: `${c.flag} ${c.name}`,
    };
  });
const filteredCurrencies = ref(currencies);

const model = ref(undefined);

function onNewValueSelected(value: Currency) {
  rewardsStore.currency = value ? value.name : '';
}

function filterFn(val: string, update: (cb: () => void) => void) {
  if (val.trim() === '') {
    update(() => {
      filteredCurrencies.value = currencies;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredCurrencies.value = currencies.filter(
      (v: Currency) => v.name.toLowerCase().indexOf(needle) > -1
    );
  });
}
</script>

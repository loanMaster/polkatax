<template>
  <div class="q-pa-md">
    <q-input
      filled
      :model-value="props.modelValue"
      @update:model-value="onNewValueSelected"
      mask="date"
      :rules="['date']"
      :label="props.label"
    >
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              :model-value="props.modelValue"
              @update:model-value="onNewValueSelected"
              :navigation-min-year-month="minYearMonth"
              :navigation-max-year-month="maxYearMonth"
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: String,
  label: String,
});

function onNewValueSelected(date: string) {
  emits('update:modelValue', date);
}

const minYearMonth = computed(() => {
  return `${new Date().getFullYear() - 10}/01`;
});

const maxYearMonth = computed(() => {
  const month = String(new Date().getMonth() + 1);
  return `${new Date().getFullYear()}/${
    month.length >= 2 ? month : '0' + month
  }`;
});
</script>

<style>
.q-field--with-bottom {
  padding: 0;
}
</style>

<template>
  <div class="q-pa-md">
    <q-input
      filled
      :model-value="props.modelValue"
      @update:model-value="onNewValueSelected"
      mask="date"
      :rules="['date', (d) => d <= maxDate || 'Date must not be in the future']"
      :label="props.label"
    >
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              :model-value="props.modelValue"
              @update:model-value="onNewValueSelected"
              :navigation-min-year-month="minYearMonth"
              :options="dateRangeFn"
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
import { date } from 'quasar';

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

const maxDate = computed(() => {
  const timeStamp = Date.now();
  return date.formatDate(timeStamp, 'YYYY/MM/DD');
});

function dateRangeFn(newDate: string) {
  return newDate <= maxDate.value;
}
</script>

<style>
.q-field--with-bottom {
  padding: 0;
}
</style>

<template>
  <div class="q-pa-md">
    <q-btn-dropdown :label="selectedTimeFrame" push no-caps>
      <q-list>
        <q-item
          v-for="timeFrame in Object.keys(timeFrames)"
          :key="timeFrame"
          :label="timeFrames[timeFrame]"
          clickable
          v-close-popup
          @click="onListItemClick(timeFrame)"
        >
          <q-item-section>
            <q-item-label>{{ timeFrames[timeFrame] }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>
<script setup lang="ts">
import { TimeFrames } from '../../../shared-module/model/time-frames';
import { computed, ref } from 'vue';

const emits = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: String,
});

function onListItemClick(timeFrame: string | number) {
  console.log(String(timeFrame))
  emits('update:modelValue', timeFrame);
}

const selectedTimeFrame = computed(() => {
  return props.modelValue !== undefined ? TimeFrames[props.modelValue] : '';
});

const timeFrames = ref(TimeFrames);
</script>

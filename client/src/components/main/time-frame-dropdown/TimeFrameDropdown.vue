<template>
  <div class="q-pa-md">
    <q-btn-dropdown :label="selectedTimeFrame" push no-caps>
      <q-list>
        <q-item
          v-for="timeFrame in Object.values(timeFrames)"
          :key="timeFrame"
          clickable
          v-close-popup
          @click="onListItemClick(timeFrame)"
        >
          <q-item-section>
            <q-item-label>{{ timeFrame }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRewardsStore } from '../../../stores/rewards.store';
import { TimeFrames } from '../../../model/time-frames';

const rewardStore = useRewardsStore();

function onListItemClick(timeFrame: string) {
  rewardStore.timeFrame = timeFrame;
}

const selectedTimeFrame = computed(() => {
  return Object.values(TimeFrames).find((k) => k === rewardStore.timeFrame);
});

const timeFrames = ref(TimeFrames);
</script>

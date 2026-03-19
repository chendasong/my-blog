<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

interface Props {
  startDate: string
}
const props = defineProps<Props>()
const days = computed(() => dayjs().diff(dayjs(props.startDate), 'day'))
</script>

<template>
  <div class="day-counter">
    <span class="day-counter__num">{{ days }}</span>
    <span class="day-counter__label">天</span>
  </div>
</template>

<style scoped>
.day-counter {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.day-counter__num {
  font-size: 3rem;
  font-weight: 700;
  background: var(--gradient-warm);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}
.day-counter__label {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}
</style>

<script setup>
import { computed } from 'vue'
import { STATUS, TASK_STATUS, TONE_CLASSES } from '../../data/statusConfig'

const props = defineProps({
  // Either pass a known status key ("IN_REVIEW") + kind, or pass label/tone directly.
  status: { type: String, default: null },
  kind: { type: String, default: 'request' }, // 'request' | 'task'
  label: { type: String, default: null },
  tone: { type: String, default: null },
  dot: { type: Boolean, default: true },
})

const resolved = computed(() => {
  if (props.label) return { label: props.label, tone: props.tone || 'gray' }
  const table = props.kind === 'task' ? TASK_STATUS : STATUS
  return table[props.status] || { label: props.status, tone: 'gray' }
})

const toneClass = computed(() => TONE_CLASSES[resolved.value.tone] || TONE_CLASSES.gray)

const dotClass = computed(() => ({
  gray: 'bg-gray-500',
  'gray-strong': 'bg-gray-900',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}[resolved.value.tone] || 'bg-gray-500'))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-badge px-2.5 py-1 text-caption font-medium whitespace-nowrap"
    :class="toneClass"
  >
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full" :class="dotClass" aria-hidden="true" />
    {{ resolved.label }}
  </span>
</template>

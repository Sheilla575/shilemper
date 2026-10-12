<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  tone: { type: String, default: 'default' }, // default | warning | danger | success
  hint: { type: String, default: null },
})

const toneText = {
  default: 'text-gray-900',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
}
</script>

<template>
  <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
    <p class="text-small text-gray-500">{{ label }}</p>
    <p class="mt-1 text-2xl font-bold" :class="toneText[tone]">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-caption" :class="tone === 'default' ? 'text-gray-500' : toneText[tone]">{{ hint }}</p>
  </div>
</template>

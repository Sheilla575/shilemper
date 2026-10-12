<script setup>
import { CheckCircle2, Clock3 } from 'lucide-vue-next'
import { formatDateTime } from '../../utils/format'

defineProps({
  steps: { type: Array, required: true },
})
</script>

<template>
  <div class="mb-xl overflow-x-auto pb-1">
    <ol class="flex min-w-[760px] items-start">
      <li v-for="(s, i) in steps" :key="`stepper-${s.step}`" class="relative flex-1 text-center">
        <span v-if="i < steps.length - 1" class="absolute left-1/2 right-0 top-3.5 h-px" :class="s.done ? 'bg-success' : 'bg-gray-200'" />
        <span class="relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full text-small font-semibold" :class="s.active ? 'bg-brand-700 text-white ring-4 ring-brand-100' : (s.done ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400')">
          <CheckCircle2 v-if="s.done && !s.active" class="h-4 w-4" />
          <span v-else>{{ s.step }}</span>
        </span>
          <p class="mt-2 px-1 text-caption leading-tight" :class="s.done || s.active ? 'font-semibold text-brand-700' : 'text-gray-400'">{{ s.title }}</p>
        <p class="mt-1 flex items-center justify-center gap-1 px-1 text-[10px] leading-tight text-gray-400">
          <Clock3 class="h-3 w-3 shrink-0" />
          {{ s.estimated ? 'Est. ' : '' }}{{ formatDateTime(s.at) }}
        </p>
      </li>
    </ol>
  </div>
</template>

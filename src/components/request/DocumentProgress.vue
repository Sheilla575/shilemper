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
      <li v-for="(step, index) in steps" :key="`document-progress-${step.step}`" class="relative flex-1 text-center">
        <span v-if="index < steps.length - 1" class="absolute left-1/2 right-0 top-3.5 h-px" :class="step.done ? 'bg-success' : 'bg-gray-200'" />
        <span class="relative z-10 mx-auto flex h-7 w-7 items-center justify-center rounded-full text-small font-semibold" :class="step.active ? 'bg-brand-700 text-white ring-4 ring-brand-100' : (step.done ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400')">
          <CheckCircle2 v-if="step.done && !step.active" class="h-4 w-4" />
          <span v-else>{{ step.step }}</span>
        </span>
        <p class="mt-2 px-1 text-caption leading-tight" :class="step.done || step.active ? 'font-semibold text-brand-700' : 'text-gray-400'">{{ step.title }}</p>
        <p class="mt-1 flex items-center justify-center gap-1 px-1 text-[10px] leading-tight text-gray-400">
          <Clock3 class="h-3 w-3 shrink-0" />
          {{ step.estimated ? 'Est. ' : '' }}{{ formatDateTime(step.at) }}
        </p>
      </li>
    </ol>
  </div>
</template>

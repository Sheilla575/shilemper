<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  title: { type: String, required: true },
  maxWidth: { type: String, default: 'max-w-lg' },
})
defineEmits(['close'])
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-lg" @click.self="$emit('close')">
    <div class="w-full rounded-modal bg-white shadow-modal max-h-[90vh] flex flex-col" :class="maxWidth">
      <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200 shrink-0">
        <h3 class="text-cardtitle text-gray-900">{{ title }}</h3>
        <button class="text-gray-500 hover:text-gray-900" aria-label="Tutup" @click="$emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>
      <div class="p-2xl overflow-y-auto">
        <slot />
      </div>
      <div v-if="$slots.footer" class="flex items-center justify-end gap-2 px-2xl py-lg border-t border-gray-200 bg-gray-50 rounded-b-modal shrink-0">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  size: { type: String, default: 'md' }, // md | sm
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  title: { type: String, default: null }, // tooltip for disabled reason
})
defineEmits(['click'])

const variantClass = computed(() => ({
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-500',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:text-gray-300',
  danger: 'bg-danger text-white hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-300',
}[props.variant]))

const sizeClass = computed(() => (props.size === 'sm' ? 'h-8 px-3 text-small' : 'h-10 px-4 text-body'))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :title="disabled ? title : null"
    class="inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-colors disabled:cursor-not-allowed"
    :class="[variantClass, sizeClass]"
    @click="$emit('click', $event)"
  >
    <slot name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>

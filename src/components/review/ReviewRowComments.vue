<script setup>
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'

const props = defineProps({ item: { type: Object, required: true }, actor: { type: Object, required: true } })
const draft = ref('')

function addComment() {
  const text = draft.value.trim()
  if (!text) return
  if (!props.item.comments) props.item.comments = []
  props.item.comments.push({ id: `${Date.now()}-${Math.random()}`, author: props.actor.name, text, at: new Date().toISOString() })
  draft.value = ''
}
</script>

<template>
  <div class="min-w-[220px] space-y-2">
    <div v-for="comment in item.comments || []" :key="comment.id" class="rounded-input bg-gray-50 px-3 py-2 text-caption text-gray-700"><p><span class="font-semibold text-gray-900">{{ comment.author }}</span><span class="text-gray-400"> · {{ new Date(comment.at).toLocaleString('id-ID') }}</span></p><p class="mt-1">{{ comment.text }}</p></div>
    <p v-if="!(item.comments || []).length" class="py-3 text-center text-caption text-gray-500">Belum ada komentar pada row ini.</p>
    <div class="flex gap-1">
      <input v-model="draft" type="text" class="h-8 min-w-0 flex-1 rounded-input border border-gray-200 px-2 text-caption focus:border-brand-500" placeholder="Tambah komentar..." @keyup.enter="addComment" />
      <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button bg-brand-50 text-brand-700 hover:bg-brand-100" aria-label="Kirim komentar" @click="addComment"><Send class="h-3.5 w-3.5" /></button>
    </div>
  </div>
</template>

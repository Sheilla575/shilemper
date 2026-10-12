<script setup>
import { computed } from 'vue'
import { Eye, Download, FileText } from 'lucide-vue-next'
import Button from '../ui/Button.vue'
import ReviewCommentsPanel from './ReviewCommentsPanel.vue'

const props = defineProps({
  cycle: { type: Object, default: null },
  actor: { type: Object, required: true },
  cycleRequiresRevision: { type: Boolean, default: false },
  readyToStartNext: { type: Boolean, default: false },
})
defineEmits(['preview', 'download', 'export', 'start-next'])
const items = computed(() => props.cycle?.items || [])
const commentItems = computed(() => items.value.map((item, index) => ({
  ...item, no: index + 1,
  get comments() { return item.comments },
  set comments(value) { item.comments = value },
})))
const editable = computed(() => props.cycle && ['ACTIVE', 'REVISION_REQUIRED'].includes(props.cycle.status))
const plainText = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
</script>

<template>
  <section v-if="cycle">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 p-3">
      <p class="text-small text-gray-500">{{ editable ? 'Isi ON REVIEW untuk menanggapi catatan. Klausul dan hasil review Legal hanya dapat dibaca.' : 'Review selesai. Dokumen dan seluruh catatan pada cycle ini hanya dapat dibaca.' }}</p>
      <Button variant="secondary" size="sm" @click="$emit('export', cycle)"><template #icon-left><FileText class="h-4 w-4" /></template>Export ke DOC</Button>
    </div>
    <div class="mb-lg flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-white text-brand-700 shadow-sm"><FileText class="h-4 w-4" /></div>
        <div class="min-w-0"><p class="break-all text-small font-semibold text-gray-900">{{ cycle.revisionDocument }}</p><p class="text-caption text-gray-500">File dokumen kontrak · Cycle {{ cycle.cycleNumber }}</p></div>
      </div>
      <div class="flex gap-2">
        <button type="button" class="file-action" aria-label="Preview dokumen" title="Preview dokumen" @click="$emit('preview', cycle)"><Eye class="h-4 w-4" /></button>
        <button type="button" class="file-action" aria-label="Unduh dokumen" title="Unduh dokumen" @click="$emit('download', cycle)"><Download class="h-4 w-4" /></button>
      </div>
    </div>
    <div class="overflow-x-auto rounded-input border border-gray-200">
      <table class="min-w-[760px] w-full text-body">
        <thead class="bg-gray-50"><tr class="text-left text-caption uppercase tracking-wide text-gray-500">
          <th class="w-14 px-3 py-3">No.</th><th class="w-[28%] px-3 py-3">Klausul Kontrak</th><th class="w-[38%] px-3 py-3">Catatan / Review</th><th class="px-3 py-3">On Review</th>
        </tr></thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="item.reviewItemId" class="border-t border-gray-200 align-top">
            <td class="p-3 text-gray-500">{{ index + 1 }}</td>
            <td class="p-3"><p class="whitespace-pre-wrap text-gray-900">{{ plainText(item.clause) }}</p><p v-if="item.clauseContent" class="mt-2 text-small text-gray-500">{{ plainText(item.clauseContent) }}</p></td>
            <td class="p-3"><p class="whitespace-pre-wrap">{{ plainText(item.reviewNote) || 'Belum ada catatan.' }}</p><p class="mt-3 text-caption text-gray-500">{{ item.reviewer }}<span v-if="item.status === 'RESOLVED'" class="ml-2 text-success">Selesai</span></p></td>
            <td class="p-3">
              <textarea v-if="editable && item.status !== 'RESOLVED'" v-model="item.onReview" rows="5" :aria-label="'On Review baris ' + (index + 1)" class="w-full resize-y rounded-input border border-gray-200 bg-white p-3 text-body leading-6 text-gray-700 focus:border-brand-500" placeholder="Jelaskan revisi atau tanggapan Anda…" />
              <p v-else class="whitespace-pre-wrap rounded-input bg-gray-50 p-3 text-gray-500">{{ item.onReview || 'Belum ada tanggapan.' }}</p>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="4" class="p-8 text-center text-gray-500">Belum ada catatan review pada cycle ini.</td></tr>
        </tbody>
      </table>
    </div>
    <ReviewCommentsPanel :items="commentItems" :actor="actor" :disabled="!editable" />
    <div v-if="cycleRequiresRevision" class="mt-xl flex flex-wrap items-center justify-between gap-4 rounded-input border border-gray-200 bg-gray-50 p-4">
      <div><p class="text-small font-semibold text-gray-900">Tindak lanjut revisi dokumen</p><p class="mt-1 text-small text-gray-500">{{ readyToStartNext ? 'Tanggapan lengkap. Unggah dokumen revisi untuk memulai cycle berikutnya.' : 'Lengkapi ON REVIEW pada semua catatan yang belum selesai.' }}</p></div>
      <Button variant="primary" :disabled="!readyToStartNext" @click="$emit('start-next')">Unggah Revisi &amp; Mulai Cycle Baru</Button>
    </div>
  </section>
</template>

<style scoped>
.file-action { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; }
.file-action:hover { border-color: #2563eb; color: #1e40af; }
</style>

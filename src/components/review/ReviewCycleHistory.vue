<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronDown, Download, Eye, FileText, MessageSquare } from 'lucide-vue-next'
import Badge from '../ui/Badge.vue'
import { getCyclesByRequest } from '../../data/reviewCycles'
import { formatDateTime } from '../../utils/format'

const props = defineProps({ requestId: { type: String, required: true }, fallbackCycle: { type: Object, default: null }, workspaceCycleId: { type: String, default: null } })
const emit = defineEmits(['open-comments'])
const cycles = computed(() => {
  const saved = getCyclesByRequest(props.requestId)
  return saved.length ? saved : props.fallbackCycle ? [props.fallbackCycle] : []
})
const openIds = ref([])
watch(() => props.requestId, () => {
  openIds.value = cycles.value.slice(-1).map((cycle) => cycle.cycleId)
}, { immediate: true })
const latestCycle = computed(() => cycles.value.at(-1))
watch(() => latestCycle.value?.cycleId, (id) => {
  if (id && !openIds.value.includes(id)) openIds.value.push(id)
})
const plainText = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')

const cycleLabel = (status) => status === 'REVISION_REQUIRED' ? 'Menunggu Revisi' : status === 'ACTIVE' ? 'Sedang Direview' : 'Selesai'
const cycleTone = (status) => status === 'COMPLETED' ? 'success' : status === 'ACTIVE' ? 'info' : 'warning'
const itemTone = (status) => status === 'RESOLVED' ? 'success' : status === 'IN_REVIEW' ? 'warning' : 'danger'

function toggleCycle(cycleId) {
  openIds.value = openIds.value.includes(cycleId)
    ? openIds.value.filter((id) => id !== cycleId)
    : [...openIds.value, cycleId]
}

function exportCycle(cycle) {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]))
  const rows = cycle.items.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.clause)}</td><td>${escapeHtml(item.reviewNote || '-')}</td><td>${escapeHtml(item.onReview || '-')}</td></tr>`).join('')
  const html = `<html><head><meta charset="utf-8"><title>Review Cycle ${cycle.cycleNumber}</title></head><body><h1>Review Cycle ${cycle.cycleNumber}</h1><p><b>Dokumen:</b> ${escapeHtml(cycle.revisionDocument)}</p><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>No.</th><th>KLAUSUL KONTRAK</th><th>CATATAN / REVIEW</th><th>ON REVIEW</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'application/msword' }))
  const link = window.document.createElement('a')
  link.href = url
  link.download = `Review-Cycle-${cycle.cycleNumber}.doc`
  link.click()
  URL.revokeObjectURL(url)
}

function previewDocument(cycle) {
  window.open(cycle.documentUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', '_blank', 'noopener,noreferrer')
}

function downloadDocument(cycle) {
  const link = window.document.createElement('a')
  link.href = cycle.documentUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  link.download = cycle.revisionDocument || `Dokumen-Cycle-${cycle.cycleNumber}.pdf`
  link.target = '_blank'
  link.click()
}

function openRowComments(item, cycle) {
  emit('open-comments', { item, cycleLabel: `Cycle ${cycle.cycleNumber}${cycle.status === 'ACTIVE' ? ' (Aktif)' : ''}`, readOnly: cycle.status !== 'ACTIVE' })
}
</script>

<template>
  <section class="review-timeline rounded-card border border-gray-200 bg-white p-4 sm:p-6 shadow-card">
    <div class="mb-xl flex flex-wrap items-start justify-between gap-3">
      <div><h2 class="text-sectiontitle text-gray-900">Tabel Review</h2><p class="mt-1 text-small text-gray-500">Tinjau dokumen, tulis catatan, dan telusuri perubahan di setiap cycle.</p></div>
      <span class="rounded-badge bg-gray-100 px-3 py-1.5 text-caption font-semibold text-gray-600">{{ cycles.length }} cycle</span>
    </div>

    <div v-if="latestCycle" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
      <div><p class="text-small font-semibold text-brand-700">Cycle {{ latestCycle.cycleNumber }} · {{ cycleLabel(latestCycle.status) }}</p><p class="mt-1 text-small text-gray-500">{{ latestCycle.status === 'ACTIVE' ? 'Kerjakan review pada cycle terbaru. Buka cycle sebelumnya untuk membandingkan.' : 'Hasil review tersimpan. Buka cycle untuk melihat catatan dan dokumennya.' }}</p></div>
      <button type="button" class="rounded-button border border-brand-200 bg-white px-3 py-2 text-small font-semibold text-brand-700" @click="openIds = cycles.map(cycle => cycle.cycleId)">Buka semua cycle</button>
    </div>
    <div v-if="cycles.length" class="relative">
      <div class="absolute bottom-5 left-[11px] top-5 w-px bg-gray-200"></div>
      <div v-for="cycle in cycles" :key="cycle.cycleId" class="relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 pb-xl last:pb-0">
        <div class="relative z-10 mt-[17px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm" :class="cycle.status === 'ACTIVE' ? 'bg-brand-600' : cycle.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'"><span class="h-2 w-2 rounded-full bg-white"></span></div>

        <article class="overflow-hidden rounded-card border transition" :class="openIds.includes(cycle.cycleId) ? 'border-brand-200 shadow-card' : 'border-gray-200'">
          <button type="button" class="flex w-full items-center justify-between gap-4 px-lg py-3 text-left transition hover:bg-gray-50" :class="openIds.includes(cycle.cycleId) ? 'bg-brand-50/40' : 'bg-white'" :aria-expanded="openIds.includes(cycle.cycleId)" @click="toggleCycle(cycle.cycleId)">
            <div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h3 class="text-bodystrong text-gray-900">Cycle {{ cycle.cycleNumber }}</h3><Badge :label="cycleLabel(cycle.status)" :tone="cycleTone(cycle.status)" /></div><p class="mt-1 truncate text-caption text-gray-500">{{ cycle.revisionDocument }} · {{ cycle.items.length }} baris review</p></div>
            <ChevronDown class="h-4 w-4 shrink-0 text-gray-500 transition-transform" :class="openIds.includes(cycle.cycleId) ? 'rotate-180' : ''" />
          </button>

          <div v-if="openIds.includes(cycle.cycleId)" class="border-t border-gray-200 bg-white p-lg sm:p-xl">
            <slot v-if="$slots.active && (workspaceCycleId ? cycle.cycleId === workspaceCycleId : cycle.status === 'ACTIVE')" name="active" :cycle="cycle" />

            <template v-else>
              <p class="mb-4 rounded-input bg-gray-50 px-3 py-2 text-small text-gray-500">{{ cycle.status === 'ACTIVE' ? 'Review pada cycle ini sedang berlangsung.' : 'Arsip cycle · Hanya baca. Catatan pada versi ini tidak dapat diubah.' }}</p>
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2"><p class="text-caption text-gray-500">{{ formatDateTime(cycle.startedAt) }}<span v-if="cycle.completedAt"> · selesai {{ formatDateTime(cycle.completedAt) }}</span></p><button type="button" class="inline-flex h-8 items-center gap-2 rounded-button border border-gray-200 bg-white px-3 text-caption font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700" @click="exportCycle(cycle)"><FileText class="h-3.5 w-3.5" />Export ke DOC</button></div>
              <div class="mb-lg flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3">
                <div class="flex min-w-0 items-center gap-3"><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-white text-brand-700 shadow-sm"><FileText class="h-4 w-4" /></div><div class="min-w-0"><p class="truncate text-small font-semibold text-gray-900">{{ cycle.revisionDocument }}</p><p class="text-caption text-gray-500">File dokumen kontrak · Cycle {{ cycle.cycleNumber }}</p></div></div>
                <div class="flex shrink-0 items-center gap-2"><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700" title="Preview dokumen" @click="previewDocument(cycle)"><Eye class="h-4 w-4" /></button><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700" title="Unduh dokumen" @click="downloadDocument(cycle)"><Download class="h-4 w-4" /></button></div>
              </div>
              <div class="overflow-x-auto rounded-input border border-gray-200">
                <table class="min-w-[760px] w-full text-small">
                  <thead class="bg-gray-50"><tr class="border-b border-gray-200 text-left text-caption font-semibold uppercase tracking-wide text-gray-500"><th class="w-12 px-3 py-2.5">No</th><th class="w-[28%] px-3 py-2.5">Klausul Kontrak</th><th class="w-[38%] px-3 py-2.5">Catatan / Review</th><th class="w-[16%] px-3 py-2.5">On Review</th><th class="w-[18%] px-3 py-2.5 text-center">Aksi</th></tr></thead>
                  <tbody><tr v-for="(item, index) in cycle.items" :key="item.reviewItemId" class="border-b border-gray-100 align-top last:border-0"><td class="px-3 py-3 text-gray-500">{{ index + 1 }}</td><td class="px-3 py-3"><p class="font-semibold text-gray-900">{{ plainText(item.clause) }}</p><p v-if="item.clauseContent" class="mt-1 text-caption text-gray-500">{{ item.clauseContent }}</p><div class="mt-1 flex flex-wrap items-center gap-1"><span v-if="item.ownerName" class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">Milik: {{ item.ownerName }}</span></div></td><td class="px-3 py-3 text-gray-700"><p>{{ plainText(item.reviewNote) || '-' }}</p><div class="mt-2 flex flex-wrap items-center gap-2"><Badge :label="item.status" :tone="itemTone(item.status)" /><span class="text-caption text-gray-400">{{ item.reviewer }}</span></div></td><td class="px-3 py-3 text-gray-700">{{ item.onReview || '-' }}</td><td class="px-3 py-3 text-center"><div class="flex flex-col items-center gap-1.5"><div v-if="item.decision" class="flex items-center gap-1"><span v-if="item.decision === 'APPROVED'" class="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">✓ Approved</span><span v-else-if="item.decision === 'REJECTED'" class="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">✗ Rejected</span></div><button type="button" class="relative inline-flex h-8 w-8 items-center justify-center rounded-button text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition" title="Lihat/Diskusi Komentar" :aria-label="`Komentar baris ${index + 1}`" @click="openRowComments(item, cycle)"><MessageSquare class="h-4 w-4" /><span v-if="(item.comments || []).length" class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{{ item.comments.length }}</span></button></div></td></tr></tbody>
                </table>
              </div>
            </template>
          </div>
        </article>
      </div>
    </div>
    <p v-else class="rounded-input border border-dashed border-gray-200 py-8 text-center text-small text-gray-500">Belum ada cycle review.</p>
  </section>
</template>

<style scoped>
.review-timeline :deep(table) { table-layout: fixed; }
.review-timeline :deep(th) { padding-top: 14px; padding-bottom: 14px; font-size: 11px; letter-spacing: .04em; }
.review-timeline :deep(td) { line-height: 1.7; overflow-wrap: anywhere; }
.review-timeline :deep(tbody tr:hover) { background: #fafcff; }
.review-timeline :deep(td + td) { border-left: 1px solid #edf1f7; }
.review-timeline :deep(button) { transition: background-color .15s, border-color .15s; }
</style>

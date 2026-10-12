<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Download, Eye, FileText, FileSpreadsheet, ShieldCheck, CheckCircle2, Upload } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Modal from '../../components/ui/Modal.vue'
import DocumentProgress from '../../components/request/DocumentProgress.vue'
import PdfPreviewPanel from '../../components/document/PdfPreviewPanel.vue'
import DocumentMembers from '../../components/document/DocumentMembers.vue'
import ReviewRowComments from '../../components/review/ReviewRowComments.vue'
import ActiveReviewCycle from '../../components/review/ActiveReviewCycle.vue'
import ReviewCycleHistory from '../../components/review/ReviewCycleHistory.vue'
import { USERS } from '../../data/users'
import { REQUEST_DETAIL, getRequestById, getDocumentProgress, updateRequestWorkflow } from '../../data/requests'
import { getCyclesByRequest, getActiveCycle } from '../../data/reviewCycles'
import { createRevisionReviewTask } from '../../data/legal'
import { formatDateTime } from '../../utils/format'
import { getDocumentMembers } from '../../data/documentMembers'

const route = useRoute()
const router = useRouter()
const user = USERS.requestor
const documentMembers = getDocumentMembers()
const ticketTab = ref('info')
const documentInfoOpen = ref(true)

const summary = computed(() => getRequestById(route.params.id) || {
  id: route.params.id,
  title: 'Permohonan Review Dokumen',
  partner: '—',
  type: 'Dokumen',
  classification: 'Legal',
  status: 'DRAFT',
})
// Reuse the existing detail structure for every request in the mock.  A real
// API will supply these nested fields per request; this avoids a dead-end page
// merely because a request ID differs from the seeded demonstration record.
const detail = computed(() => {
  if (route.params.id === REQUEST_DETAIL.id) return REQUEST_DETAIL
  return {
    ...REQUEST_DETAIL,
    ...summary.value,
    requestor: REQUEST_DETAIL.requestor,
    legalPic: REQUEST_DETAIL.legalPic,
    counterparty: { ...REQUEST_DETAIL.counterparty, name: summary.value.partner, type: `${summary.value.type || 'Dokumen'} · ${summary.value.classification || 'Legal'}` },
    documents: REQUEST_DETAIL.documents.map((document) => ({ ...document, main: document.main, name: document.main ? `Draft_${summary.value.id}.pdf` : document.name })),
  }
})

const riskTone = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'info' }
const findingStatusTone = { 'In Review': 'info', Open: 'warning', Resolved: 'success' }
const previewDocument = ref(null)
const showRevisionModal = ref(false)
const revisionFile = ref(null)
const revisionError = ref('')
const signedDocument = ref(null)
const signatureError = ref('')
const selectedHistoryCycleId = ref(null)
const reviewHistoryOpen = ref(false)
const documentProgress = computed(() => getDocumentProgress(detail.value?.workflow || REQUEST_DETAIL.workflow))
const cycles = computed(() => getCyclesByRequest(route.params.id))
const visibleCycle = computed(() => getActiveCycle(route.params.id) || cycles.value.at(-1) || null)
const activeItems = computed(() => visibleCycle.value?.items.filter((item) => item.status !== 'RESOLVED') || [])
const canSubmitRevision = computed(() => cycles.value.at(-1)?.status === 'REVISION_REQUIRED')
const allOnReviewFilled = computed(() => activeItems.value.length > 0 && activeItems.value.every((item) => String(item.onReview || '').trim()))
const archivedCycles = computed(() => cycles.value.filter((cycle) => cycle.cycleId !== visibleCycle.value?.cycleId))
const selectedHistoryCycle = computed(() => archivedCycles.value.find((cycle) => cycle.cycleId === selectedHistoryCycleId.value) || archivedCycles.value.at(-1) || null)
const isReadyForSignature = computed(() => detail.value?.status === 'REVIEW_COMPLETED' || detail.value?.workflow?.find((step) => step.step === 7)?.active)

const fileIcon = (name) => {
  if (name.endsWith('.xlsx')) return FileSpreadsheet
  if (name.includes('NIB') || name.includes('Surat_Kuasa')) return ShieldCheck
  return FileText
}

function openPreview(doc) {
  previewDocument.value = { name: doc.name, source: doc.previewUrl }
}

function closePreview() {
  previewDocument.value = null
}

function selectRevisionFile(event) {
  revisionFile.value = event.target.files?.[0] || null
  revisionError.value = ''
}

function openRevisionModal() {
  if (!allOnReviewFilled.value) return
  revisionFile.value = null
  revisionError.value = ''
  showRevisionModal.value = true
}

function submitRevision() {
  if (!revisionFile.value) { revisionError.value = 'Pilih dokumen revisi terlebih dahulu.'; return }
  createRevisionReviewTask(route.params.id, user, revisionFile.value.name, revisionFile.value)
  selectedHistoryCycleId.value = null
  showRevisionModal.value = false
}

function selectSignedDocument(event) {
  const file = event.target.files?.[0] || null
  signatureError.value = ''
  if (!file) return
  if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
    signatureError.value = 'Unggah dokumen PDF atau Word yang sudah ditandatangani.'
    return
  }
  signedDocument.value = file
}

function completeSignature() {
  if (!signedDocument.value) {
    signatureError.value = 'Pilih dokumen yang sudah ditandatangani terlebih dahulu.'
    return
  }
  const completedAt = new Date().toISOString()
  const request = getRequestById(route.params.id)
  if (request) { request.status = 'COMPLETED'; request.updatedAt = completedAt }
  detail.value.status = 'COMPLETED'
  detail.value.finalSignedDocument = { name: signedDocument.value.name, uploadedAt: completedAt }
  updateRequestWorkflow(7, { done: true, active: false, at: completedAt, estimated: false, desc: 'Dokumen telah ditandatangani para pihak dan diunggah oleh Requestor.' })
  signedDocument.value = null
}

function downloadCycleDocument(cycle) {
  const link = window.document.createElement('a')
  link.href = cycle.documentUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  link.download = cycle.revisionDocument || `Cycle-${cycle.cycleNumber}.pdf`
  link.target = '_blank'
  link.click()
}

function previewCycleDocument(cycle) {
  previewDocument.value = {
    name: cycle.revisionDocument || `Cycle ${cycle.cycleNumber}`,
    source: cycle.documentUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
  }
}

function exportCycleReview(cycle) {
  const rows = cycle.items.map((item, index) => `<tr><td>${index + 1}</td><td>${item.clause}</td><td>${item.clauseContent || '-'}</td><td>${item.reviewNote || '-'}</td><td>${item.onReview || '-'}</td><td>${item.status}</td><td>${item.reviewer || '-'}</td></tr>`).join('')
  const html = `<html><head><meta charset="utf-8"><title>Review Cycle ${cycle.cycleNumber}</title></head><body><h1>Review Cycle ${cycle.cycleNumber}</h1><p><b>Dokumen utama:</b> ${cycle.revisionDocument}</p><p>Unduh dokumen utama cycle ini dari SITARA untuk melampirkannya bersama laporan review.</p><table border="1" cellspacing="0" cellpadding="6"><tr><th>No.</th><th>Klausul</th><th>Isi Klausul</th><th>Rekomendasi Legal</th><th>On Review Requestor</th><th>Status</th><th>Reviewer</th></tr>${rows}</table></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'application/msword' }))
  const link = window.document.createElement('a')
  link.href = url
  link.download = `Review-Cycle-${cycle.cycleNumber}.doc`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Dashboard', 'My Requests', route.params.id]">
    <template v-if="detail">
      <div class="flex items-start justify-between mb-2xl gap-lg flex-wrap">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-small font-semibold text-gray-500">{{ detail.id }}</span>
            <Badge :status="detail.status" />
            <span v-if="detail.confidential" class="inline-flex items-center gap-1 text-caption font-semibold text-gray-700 bg-gray-100 rounded-badge px-2.5 py-1">
              <Lock class="h-3 w-3" /> Confidential (Div. Komersial &amp; Legal)
            </span>
          </div>
          <h1 class="mt-2 text-pagetitle text-gray-900 max-w-3xl">{{ detail.title }}</h1>
          <p class="mt-1 text-body text-gray-500">{{ detail.counterparty.name }}</p>
        </div>
        <Button variant="secondary" @click="router.push('/requestor/requests')">Back to Requests</Button>
      </div>

      <section class="mb-2xl rounded-card border border-gray-200 bg-white p-2xl shadow-card">
        <div class="mb-lg flex items-center justify-between gap-3"><h2 class="text-cardtitle text-gray-900">Progress</h2><span class="text-caption text-gray-500">Tahap {{ documentProgress.filter(s => s.done).length }} dari {{ documentProgress.length }} Selesai</span></div>
        <DocumentProgress :steps="documentProgress" />
      </section>

      <DocumentMembers class="mb-2xl" v-model:active-tab="ticketTab" v-model:info-open="documentInfoOpen" :collapsible-info="true" :members="documentMembers" :document-info="{ id: detail.id, title: detail.title, status: detail.status, partner: detail.counterparty.name, type: detail.counterparty.type }">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-lg mb-2xl">
        <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
          <p class="text-caption text-gray-500 mb-2">REQUESTOR</p>
          <p class="text-bodystrong text-gray-900">{{ detail.requestor.name }}</p>
          <p class="text-small text-gray-500">{{ detail.requestor.division }}</p>
        </div>
        <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
          <p class="text-caption text-gray-500 mb-2">PIC TIM LEGAL</p>
          <p class="text-bodystrong text-gray-900">{{ detail.legalPic.name }}</p>
          <p class="text-small text-gray-500">{{ detail.legalPic.role }}</p>
        </div>
        <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
          <p class="text-caption text-gray-500 mb-2">PIHAK KONTRAK</p>
          <p class="text-bodystrong text-gray-900">{{ detail.counterparty.name }}</p>
          <p class="text-small text-gray-500">{{ detail.counterparty.pic }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
        <div class="lg:col-span-2 space-y-2xl">
          <div v-if="false" class="border-t border-gray-200 pt-2xl">
            <div class="flex items-center justify-between mb-lg">
          <h2 class="text-cardtitle text-gray-900">Progress</h2>
              <span class="text-caption text-gray-500">Tahap {{ documentProgress.filter(s => s.done).length }} dari {{ documentProgress.length }} Selesai</span>
            </div>
            <DocumentProgress :steps="documentProgress" />
          </div>

          <div class="border-t border-gray-200 pt-2xl">
            <div class="flex items-center justify-between mb-lg">
              <h2 class="text-cardtitle text-gray-900">Request Documents &amp; Attachments</h2>
              <span class="text-caption text-gray-500">{{ detail.documents.length }} Verified Documents</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="doc in detail.documents"
                :key="doc.name"
                class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <component :is="fileIcon(doc.name)" class="h-4.5 w-4.5 text-gray-500 shrink-0" />
                  <div class="min-w-0">
                    <p class="text-bodystrong text-gray-900 truncate">{{ doc.name }}</p>
                    <p class="text-caption text-gray-500">{{ doc.size }}<span v-if="doc.desc"> · {{ doc.desc }}</span></p>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <Badge :label="doc.status" :tone="doc.main ? 'info' : 'success'" :dot="false" />
                  <button type="button" class="text-gray-500 hover:text-gray-900" aria-label="Pratinjau" @click="openPreview(doc)"><Eye class="h-4 w-4" /></button>
                  <button class="text-gray-500 hover:text-gray-900" aria-label="Unduh"><Download class="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="false" class="rounded-card border border-gray-200 bg-white shadow-card p-2xl">
            <div class="flex items-center justify-between mb-lg">
              <div><h2 class="text-cardtitle text-gray-900">Cycle {{ visibleCycle?.cycleNumber }} · Review Dokumen Revisi</h2><p class="mt-1 text-small text-gray-500">Fokus pada dokumen revisi dan issue yang masih perlu ditindaklanjuti pada cycle ini.</p></div>
              <Button v-if="canSubmitRevision" variant="primary" size="sm" @click="openRevisionModal">Unggah Revisi &amp; Mulai Cycle Baru</Button>
            </div>
            <div v-if="visibleCycle" class="mb-lg flex flex-wrap items-center justify-between gap-3 rounded-input border border-brand-100 bg-brand-50/50 px-4 py-3">
              <div><p class="text-caption font-semibold uppercase tracking-wide text-brand-700">Dokumen cycle {{ visibleCycle.cycleNumber }}</p><p class="mt-0.5 text-small font-semibold text-gray-900">{{ visibleCycle.revisionDocument }}</p></div>
              <div class="flex items-center gap-2"><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:text-brand-700" title="Preview dokumen" aria-label="Preview dokumen" @click="previewCycleDocument(visibleCycle)"><Eye class="h-4 w-4" /></button><Button variant="secondary" size="sm" @click="downloadCycleDocument(visibleCycle)">Unduh</Button></div>
            </div>
            <p v-if="!activeItems.length" class="text-small text-gray-500 mb-lg">Tidak ada issue aktif pada cycle ini.</p>
            <div class="overflow-x-auto">
            <table class="min-w-[980px] w-full text-body">
              <thead>
                <tr class="text-left text-small text-gray-500 border-b border-gray-200">
                  <th class="py-2 pr-3 font-medium w-10">No</th>
                  <th class="py-2 pr-3 font-medium">Section / Clause</th>
                  <th class="py-2 pr-3 font-medium">Legal Recommendation</th>
                  <th class="py-2 pr-3 font-medium min-w-[280px]">On Review</th>
                  <th class="py-2 pr-3 font-medium">Status</th>
                  <th class="py-2 font-medium">Reviewer &amp; Time</th>
                  <th class="py-2 pl-3 font-medium min-w-[220px]">Komentar</th>
                  <th class="py-2 pl-3 font-medium w-12 text-center">Cek</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(f, index) in activeItems" :key="f.reviewItemId" class="border-b border-gray-100 last:border-0 align-top">
                  <td class="py-3 pr-3 text-gray-500">{{ index + 1 }}</td>
                  <td class="py-3 pr-3">
                    <p class="text-bodystrong text-gray-900">{{ f.clause }}</p>
                    <p class="text-caption text-gray-500">{{ f.clauseContent }}</p>
                  </td>
                  <td class="py-3 pr-3 max-w-xs">
                    <p class="text-small text-gray-700">{{ f.reviewNote }}</p>
                  </td>
                  <td class="py-3 pr-3 min-w-[280px]">
                    <textarea v-model="f.onReview" rows="4" placeholder="Jelaskan poin atau kebutuhan review untuk klausul ini..." class="w-full min-w-[260px] appearance-none rounded-input border border-gray-200 !bg-white px-3 py-2 text-small !text-gray-700 placeholder:!text-gray-400 focus:border-brand-500 focus:!bg-white" style="color-scheme: light"></textarea>
                    <p class="mt-1 text-caption text-gray-400">Diisi dan diperbarui oleh Requestor.</p>
                  </td>
                  <td class="py-3 pr-3"><Badge :label="f.status" :tone="findingStatusTone[f.status] || 'warning'" :dot="false" /></td>
                  <td class="py-3">
                    <p class="text-small text-gray-900">{{ f.reviewer }}</p>
                    <p class="text-caption text-gray-500">{{ formatDateTime(f.updatedAt) }}</p>
                  </td>
                  <td class="py-3 pl-3"><ReviewRowComments :item="f" :actor="user" /></td>
                  <td class="py-3 pl-3 text-center"><input v-model="f.checked" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" aria-label="Tandai row sudah dicek" /></td>
                </tr>
              </tbody>
            </table>
            </div>
            <p class="mt-lg text-caption text-gray-400">Kolom On Review hanya dapat diisi oleh Requestor; hasil review Legal tetap read-only.</p>
          </div>

          <div v-if="archivedCycles.length" class="border-t border-gray-200 pt-2xl">
            <button type="button" class="flex w-full items-center justify-between gap-3 text-left" @click="reviewHistoryOpen = !reviewHistoryOpen"><div><h2 class="text-cardtitle text-gray-900">Cycle Sebelumnya</h2><p class="mt-1 text-small text-gray-500">Cycle 0 dan cycle yang sudah selesai tersimpan sebagai snapshot read-only.</p></div><span class="rounded-input border border-gray-200 px-3 py-1.5 text-caption font-semibold text-gray-600">{{ reviewHistoryOpen ? 'Tutup' : 'Buka' }} · {{ archivedCycles.length }} cycle</span></button>
            <div v-if="reviewHistoryOpen" class="mt-lg space-y-3">
              <button v-for="cycle in archivedCycles" :key="cycle.cycleId" type="button" class="w-full rounded-input border p-3 text-left transition" :class="selectedHistoryCycle?.cycleId === cycle.cycleId ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'" @click="selectedHistoryCycleId = selectedHistoryCycle?.cycleId === cycle.cycleId ? null : cycle.cycleId">
                <div class="flex items-center justify-between gap-3"><p class="text-bodystrong text-gray-900">Cycle {{ cycle.cycleNumber }}</p><Badge :label="cycle.status === 'REVISION_REQUIRED' ? 'Revision Required' : cycle.status" :tone="cycle.status === 'COMPLETED' ? 'success' : cycle.status === 'ACTIVE' ? 'info' : 'warning'" /></div>
                <p class="mt-1 text-small text-gray-500">{{ cycle.items.length }} issue · {{ cycle.items.filter(i => i.status === 'RESOLVED').length }} resolved · Dokumen: {{ cycle.revisionDocument }}</p>
              </button>
            </div>
            <div v-if="reviewHistoryOpen && selectedHistoryCycle" class="mt-lg rounded-input border border-gray-200 bg-gray-50 p-lg">
              <div class="flex flex-wrap items-center justify-between gap-2"><div><p class="text-bodystrong text-gray-900">Detail Cycle {{ selectedHistoryCycle.cycleNumber }}</p><p class="mt-0.5 text-caption text-gray-500">Dimulai {{ formatDateTime(selectedHistoryCycle.startedAt) }}<span v-if="selectedHistoryCycle.completedAt"> · Selesai {{ formatDateTime(selectedHistoryCycle.completedAt) }}</span></p></div><Badge :label="selectedHistoryCycle.status === 'REVISION_REQUIRED' ? 'Revision Required' : selectedHistoryCycle.status" :tone="selectedHistoryCycle.status === 'COMPLETED' ? 'success' : selectedHistoryCycle.status === 'ACTIVE' ? 'info' : 'warning'" /></div>
              <div class="mt-3 flex flex-wrap items-center justify-between gap-2"><p class="text-small text-gray-700"><span class="font-semibold">Dokumen direview:</span> {{ selectedHistoryCycle.revisionDocument }}</p><div class="flex items-center gap-2"><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:text-brand-700" title="Preview dokumen" aria-label="Preview dokumen" @click="previewCycleDocument(selectedHistoryCycle)"><Eye class="h-4 w-4" /></button><Button variant="secondary" size="sm" @click="downloadCycleDocument(selectedHistoryCycle)">Unduh Dokumen</Button><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-brand-700 transition hover:border-brand-300 hover:bg-brand-50" title="Export Review DOC" aria-label="Export Review DOC" @click="exportCycleReview(selectedHistoryCycle)"><FileText class="h-4 w-4" /></button></div></div>
              <div class="mt-3 overflow-x-auto"><table class="min-w-[760px] w-full bg-white text-small"><thead><tr class="border-b border-gray-200 text-left text-caption uppercase tracking-wider text-gray-500"><th class="px-3 py-2 w-12">No.</th><th class="px-3 py-2">Klausul</th><th class="px-3 py-2">Catatan Review</th><th class="px-3 py-2">Status</th><th class="px-3 py-2">Reviewer &amp; Waktu</th></tr></thead><tbody><tr v-for="(item, index) in selectedHistoryCycle.items" :key="item.reviewItemId" class="border-b border-gray-100 align-top last:border-0"><td class="px-3 py-3 text-gray-500">{{ index + 1 }}</td><td class="px-3 py-3 font-semibold text-gray-900">{{ item.clause }}</td><td class="px-3 py-3 text-gray-700">{{ item.reviewNote }}</td><td class="px-3 py-3"><Badge :label="item.status" :tone="item.status === 'RESOLVED' ? 'success' : item.status === 'IN_REVIEW' ? 'warning' : 'danger'" /></td><td class="px-3 py-3 text-gray-500">{{ item.reviewer }}<br>{{ formatDateTime(item.createdAt) }}<span v-if="item.resolvedAt"><br>Resolved {{ formatDateTime(item.resolvedAt) }}</span></td></tr></tbody></table></div>
            </div>
          </div>
        </div>

        <div v-if="false" class="space-y-2xl">
          <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl">
            <p class="text-caption text-gray-400 mb-1">CATATAN DISPOSISI TIM LEGAL · INTERNAL SIDE</p>
            <p class="text-caption text-gray-500 mb-2">{{ formatDateTime(detail.disposition.at) }}</p>
            <blockquote class="text-small text-gray-700 italic border-l-2 border-brand-500 pl-3">
              "{{ detail.disposition.note }}"
            </blockquote>
            <p class="mt-2 text-caption text-gray-500">— {{ detail.disposition.author }}</p>
          </div>

          <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl">
            <h3 class="text-cardtitle text-gray-900 mb-lg">Tindakan Requestor</h3>
            <div class="space-y-2">
              <Button variant="primary" class="w-full">Konfirmasi Kesepakatan Liability Cap</Button>
              <Button variant="secondary" class="w-full">Hubungi Reviewer (Ahmad Fauzi)</Button>
              <Button variant="ghost" class="w-full">Unduh Lembar Telaah (PDF)</Button>
            </div>
          </div>
        </div>
      </div>
        </DocumentMembers>

      <section v-if="isReadyForSignature" class="mb-2xl rounded-card border border-success/40 bg-success-light/20 p-2xl shadow-card">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex min-w-0 gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white"><CheckCircle2 class="h-5 w-5" /></div><div><p class="text-caption font-semibold uppercase tracking-wide text-success">Review final selesai</p><h2 class="mt-1 text-sectiontitle text-gray-900">Dokumen siap untuk tanda tangan</h2><p class="mt-2 max-w-2xl text-small leading-6 text-gray-600">Unduh draf final, lakukan tanda tangan bersama Client, lalu unggah dokumen yang sudah ditandatangani untuk menutup request.</p></div></div>
          <Button variant="secondary" size="sm" @click="visibleCycle && downloadCycleDocument(visibleCycle)"><template #icon-left><Download class="h-3.5 w-3.5" /></template>Unduh Draf Final</Button>
        </div>
        <div class="mt-xl grid gap-3 sm:grid-cols-3"><div class="rounded-input border border-success/30 bg-white p-3"><p class="text-caption font-semibold text-success">01 · Draf Final</p><p class="mt-1 text-small text-gray-700">Review Legal sudah disetujui.</p></div><div class="rounded-input border border-success/30 bg-white p-3"><p class="text-caption font-semibold text-success">02 · Tanda Tangan</p><p class="mt-1 text-small text-gray-700">Ditandatangani Requestor dan Client.</p></div><div class="rounded-input border border-success/30 bg-white p-3"><p class="text-caption font-semibold text-success">03 · Tutup Request</p><p class="mt-1 text-small text-gray-700">Unggah dokumen bertanda tangan.</p></div></div>
        <div class="mt-xl flex flex-col gap-3 rounded-input border border-success/30 bg-white p-4 sm:flex-row sm:items-center"><div class="min-w-0 flex-1"><label for="signed-document" class="block text-small font-semibold text-gray-900">Dokumen sudah ditandatangani *</label><p class="mt-1 text-caption text-gray-500">Format PDF, DOC, atau DOCX.</p></div><input id="signed-document" type="file" accept=".pdf,.doc,.docx" class="block w-full text-small text-gray-600 sm:max-w-xs file:mr-3 file:rounded-button file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-small file:font-semibold file:text-brand-700" @change="selectSignedDocument" /><Button variant="primary" :disabled="!signedDocument" @click="completeSignature"><template #icon-left><Upload class="h-3.5 w-3.5" /></template>Unggah &amp; Tutup Request</Button></div>
        <p v-if="signedDocument" class="mt-2 text-small text-success">Dipilih: {{ signedDocument.name }}</p><p v-if="signatureError" class="mt-2 text-small text-danger">{{ signatureError }}</p>
      </section>

      <section v-else-if="detail.status === 'COMPLETED' && detail.finalSignedDocument" class="mb-2xl flex items-start gap-3 rounded-card border border-success/40 bg-success-light/20 p-2xl shadow-card"><CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-success" /><div><p class="text-bodystrong text-success">Request selesai dan dokumen telah ditandatangani</p><p class="mt-1 text-small text-gray-700">{{ detail.finalSignedDocument.name }} telah diunggah sebagai dokumen final.</p></div></section>

      <ReviewCycleHistory :request-id="String(route.params.id)" :workspace-cycle-id="visibleCycle?.cycleId">
      <template #active>
      <ActiveReviewCycle
        :cycle="visibleCycle"
        :actor="user"
        :cycle-requires-revision="canSubmitRevision"
        :ready-to-start-next="allOnReviewFilled"
        @preview="previewCycleDocument"
        @download="downloadCycleDocument"
        @export="exportCycleReview"
        @start-next="openRevisionModal"
      />
      </template>
      </ReviewCycleHistory>
    </template>

    <Modal v-if="showRevisionModal" title="Unggah Revisi Dokumen" max-width="max-w-lg" @close="showRevisionModal = false">
      <p class="text-small text-gray-600">Dokumen ini akan menjadi snapshot untuk Cycle {{ cycles.length }}. Hanya issue yang belum resolved dari cycle sebelumnya yang akan dibawa ke review baru.</p>
      <div class="mt-lg">
        <label class="block text-small font-semibold text-gray-900 mb-1.5" for="revision-document">Dokumen revisi utama *</label>
        <input id="revision-document" type="file" accept=".pdf,.doc,.docx" class="block w-full rounded-input border border-gray-200 p-2 text-small text-gray-700 file:mr-3 file:rounded-button file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-small file:font-semibold file:text-brand-700" @change="selectRevisionFile" />
        <p v-if="revisionFile" class="mt-2 text-small text-success">Dipilih: {{ revisionFile.name }}</p>
        <p v-if="revisionError" class="mt-2 text-small text-danger">{{ revisionError }}</p>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showRevisionModal = false">Batal</Button>
        <Button variant="primary" @click="submitRevision">Unggah &amp; Buat Cycle {{ cycles.length }}</Button>
      </template>
    </Modal>

    <PdfPreviewPanel :document="previewDocument" @close="closePreview" />
  </AppLayout>
</template>

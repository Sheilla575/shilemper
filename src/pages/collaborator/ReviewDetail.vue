<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, Download, FileText, File, CheckCircle2, XCircle, Save, Lock, ChevronDown, MessageSquare, Pencil, Send } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Modal from '../../components/ui/Modal.vue'
import PdfPreviewPanel from '../../components/document/PdfPreviewPanel.vue'
import DocumentMembers from '../../components/document/DocumentMembers.vue'
import DocumentProgress from '../../components/request/DocumentProgress.vue'
import ReviewCycleHistory from '../../components/review/ReviewCycleHistory.vue'
import RowCommentSidebar from '../../components/review/RowCommentSidebar.vue'
import { USERS } from '../../data/users'
import { getCollabTaskById, ROW_STATUS_CONFIG, COLLAB_TASK_STATUS } from '../../data/collaborator'
import { getReviewTaskById } from '../../data/legal'
import { getActiveCycle, getCyclesByRequest } from '../../data/reviewCycles'
import { REQUEST_DETAIL, updateRequestWorkflow, getDocumentProgress } from '../../data/requests'
import { formatDateTime } from '../../utils/format'
import { getDocumentMembers } from '../../data/documentMembers'

const route = useRoute()
const router = useRouter()
const user = USERS.collaborator
const documentMembers = getDocumentMembers()
const ticketTab = ref('info')
const documentInfoOpen = ref(true)

const task = computed(() => getCollabTaskById(route.params.taskId))
const activeCycle = computed(() => task.value ? getActiveCycle(task.value.requestId) : null)
const requestWorkflow = computed(() => REQUEST_DETAIL.workflow)
const documentProgress = computed(() => getDocumentProgress(requestWorkflow.value))

// Local editable copy — locked once already submitted (task.submittedAt set) or after
// this session's own submit (DESIGN.md §41: entries become immutable on submission).
const alreadySubmitted = computed(() => !!task.value?.submittedAt)
const rows = ref(task.value ? task.value.reviewTable.map((r) => ({ ...r, reviewer: r.reviewer ?? user.name, updatedAt: r.updatedAt ?? r.createdAt ?? task.value.startedAt ?? task.value.assignedAt })) : [])
const started = ref(!!task.value?.startedAt)

const showSubmitModal = ref(false)
const savedDraft = ref(false)
const submitted = ref(alreadySubmitted.value)
const previewDocument = ref(null)
const submissionOpen = ref(true)
const documentsOpen = ref(true)
const activeEditor = ref(null)

const workspaceCycle = computed(() => activeCycle.value || getCyclesByRequest(task.value?.requestId).at(-1) || {
  cycleId: task.value?.taskId, cycleNumber: 0,
  status: submitted.value ? 'COMPLETED' : 'ACTIVE',
  revisionDocument: task.value?.mainDocument?.name || 'Dokumen kontrak',
  items: rows.value, startedAt: task.value?.startedAt || task.value?.assignedAt,
})
const rowStatusOptions = ['OPEN', 'COMMENTED', 'ACCEPTED', 'REVISION']
const isLocked = computed(() => submitted.value || !started.value)

const isCommentSidebarOpen = ref(false)
const activeCommentRow = ref(null)
const activeCommentCycleLabel = ref('')
const activeCommentReadOnly = ref(false)

const approvedCount = computed(() => rows.value.filter(r => r.decision === 'APPROVED').length)
const rejectedCount = computed(() => rows.value.filter(r => r.decision === 'REJECTED').length)

const canEditCollaboratorRow = (row) => !isLocked.value && (row.ownerRole === 'COLLABORATOR' || row.reviewerId === user.id || row.decision === 'REJECTED' || row.status === 'REVISION' || (!row.ownerRole && row.reviewer === user.name))

function setRowDecision(row, decision) {
  row.decision = row.decision === decision ? 'PENDING' : decision
  task.value.reviewTable = rows.value.map((r) => ({ ...r }))
}

function toggleEditRow(row) {
  row.isEditing = !row.isEditing
}

function saveAndResubmitRow(row) {
  row.isEditing = false
  row.updatedAt = new Date().toISOString()
  if (row.decision === 'REJECTED') {
    row.status = 'OPEN'
  }
}

function openRowComments(row, cycleLabel = '', readOnly = false) {
  activeCommentRow.value = row
  activeCommentCycleLabel.value = cycleLabel || (workspaceCycle.value ? `Cycle ${workspaceCycle.value.cycleNumber} (Aktif)` : 'Cycle Aktif')
  activeCommentReadOnly.value = readOnly
  isCommentSidebarOpen.value = true
}

function handleOpenHistoryComments({ item, cycleLabel, readOnly }) {
  openRowComments(item, cycleLabel, readOnly)
}

function startReview() {
  // Backend: record review_started_at, task status -> In Progress (DESIGN.md §41).
  started.value = true
  const startedAt = new Date().toISOString()
  task.value.startedAt = startedAt
  updateRequestWorkflow(5, {
    at: startedAt,
    active: true,
    done: false,
    estimated: false,
    desc: `${user.name} mulai menelaah ${task.value.collaborator?.scope || 'klausul terkait'} sebagai kolaborator.`,
  })
}

function saveDraft() {
  if (isLocked.value) return
  task.value.reviewTable = rows.value.map(row => ({ ...row }))
  savedDraft.value = true
  setTimeout(() => { savedDraft.value = false }, 2500)
}

const allRowsResolved = computed(() => rows.value.length > 0 && rows.value.every((r) => r.status === 'ACCEPTED' || r.status === 'REVISION'))

function confirmSubmit() {
  // Backend: task status -> Completed, completed_at recorded, entries become
  // immutable, Legal notified and sees result attributed to this collaborator
  // (DESIGN.md §41-42).
  const submittedAt = new Date().toISOString()
  task.value.reviewTable = rows.value.map((row) => ({ ...row }))
  task.value.submittedAt = submittedAt
  task.value.status = 'COMPLETED'
  task.value.startedAt = task.value.startedAt || submittedAt

  // Keep the three-role demo connected: Team Legal immediately receives the
  // collaborator result on the same request/task record.
  const legalTask = getReviewTaskById(task.value.taskId)
  if (legalTask?.collaborator) {
    const collaboratorRows = rows.value.map((row, index) => ({
      ...row,
      no: (legalTask.reviewTable?.length || 0) + index + 1,
      reviewItemId: row.reviewItemId || `COLLAB-${task.value.taskId}-${index + 1}`,
      reviewerId: user.id,
      reviewer: user.name,
      ownerRole: 'COLLABORATOR',
      updatedAt: submittedAt,
      createdAt: row.createdAt || submittedAt,
    }))
    legalTask.reviewTable = [
      ...(legalTask.reviewTable || []).filter((row) => row.reviewerId !== user.id),
      ...collaboratorRows,
    ]
    const legalCycle = getActiveCycle(task.value.requestId)
    if (legalCycle) {
      legalCycle.items = [
        ...legalCycle.items.filter((item) => item.reviewerId !== user.id),
        ...collaboratorRows.map((row) => ({ ...row, reviewNote: row.comment })),
      ]
    }
    legalTask.collaborator.submittedAt = submittedAt
    legalTask.collaborator.status = 'COMPLETED'
    legalTask.status = 'IN_PROGRESS'
  }
  updateRequestWorkflow(5, {
    at: submittedAt,
    active: true,
    done: false,
    estimated: false,
    annotations: rows.value.filter((row) => String(row.comment || '').replace(/<[^>]*>/g, '').trim()).length,
    desc: `${user.name} menyelesaikan review kolaborator dan mengirim hasilnya ke Tim Legal.`,
  })
  submitted.value = true
  showSubmitModal.value = false
}

function openPreview(name) {
  previewDocument.value = { name }
}

function previewRevisionDocument() {
  if (!workspaceCycle.value) return
  previewDocument.value = { name: workspaceCycle.value.revisionDocument, source: workspaceCycle.value.documentUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' }
}

function downloadRevisionDocument() {
  if (!workspaceCycle.value) return
  const link = window.document.createElement('a')
  link.href = workspaceCycle.value.documentUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  link.download = workspaceCycle.value.revisionDocument || `Cycle-${workspaceCycle.value.cycleNumber}.pdf`
  link.target = '_blank'
  link.click()
}

function exportReview() {
  const escape = (value) => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))
  const text = value => escape(String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '))
  const body = rows.value.map(row => '<tr><td>' + row.no + '</td><td>' + text(row.clause) + '</td><td>' + text(row.comment) + '</td><td>' + text(row.onReview) + '</td></tr>').join('')
  const html = '<html><head><meta charset="utf-8"></head><body><h1>Review Cycle ' + workspaceCycle.value.cycleNumber + '</h1><table border="1"><tr><th>No.</th><th>KLAUSUL KONTRAK</th><th>CATATAN / REVIEW</th><th>ON REVIEW</th></tr>' + body + '</table></body></html>'
  const url = URL.createObjectURL(new Blob([html], { type: 'application/msword' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'Review-' + task.value.taskId + '.doc'
  link.click()
  URL.revokeObjectURL(url)
}

function closePreview() {
  previewDocument.value = null
}

function updateCell(row, field, event) {
  row[field] = event.currentTarget.innerHTML
  row.updatedAt = new Date().toISOString()
}

function addReviewRow() {
  if (isLocked.value) return
  rows.value.push({ no: rows.value.length + 1, clause: '', clauseContent: '', comment: '', onReview: '', status: 'OPEN', reviewer: user.name, updatedAt: new Date().toISOString() })
  task.value.reviewTable = rows.value.map((row) => ({ ...row }))
}

function rememberEditor(event) {
  activeEditor.value = event.currentTarget
}

function applyTextFormat(command, value = null) {
  if (!activeEditor.value?.isConnected || isLocked.value) return
  activeEditor.value.focus()
  document.execCommand(command, false, value)
  activeEditor.value.dispatchEvent(new Event('input', { bubbles: true }))
}
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal', 'My Review Tasks', route.params.taskId]">
    <template v-if="task">
      <div class="flex items-start justify-between mb-2xl gap-lg flex-wrap">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-small font-semibold text-gray-500">{{ task.taskId }}</span>
            <Badge
              :label="submitted ? 'Selesai' : (started ? COLLAB_TASK_STATUS.IN_PROGRESS.label : COLLAB_TASK_STATUS.ASSIGNED.label)"
              :tone="submitted ? 'success' : (started ? 'warning' : 'gray')"
            />
          </div>
          <h1 class="mt-2 text-pagetitle text-gray-900 max-w-3xl">{{ task.title }}</h1>
          <p class="mt-1 text-body text-gray-500">{{ task.requestId }} · {{ task.partner }} · {{ task.classification }}</p>
        </div>
        <Button variant="secondary" @click="router.push('/collaborator/tasks')">Kembali ke Tugas</Button>
      </div>

      <section class="mb-2xl rounded-card border border-gray-200 bg-white p-2xl shadow-card"><div class="mb-lg flex items-center justify-between gap-3 flex-wrap"><div><h2 class="text-cardtitle text-gray-900">Progress</h2><p class="mt-1 text-small text-gray-500">Progress yang sama ditampilkan untuk Requestor, Legal, dan Collaborator.</p></div><span class="rounded-badge bg-brand-50 px-3 py-1 text-caption font-semibold text-brand-700">Review Kolaborator</span></div><DocumentProgress :steps="documentProgress" /></section>

      <DocumentMembers class="mb-2xl" v-model:active-tab="ticketTab" v-model:info-open="documentInfoOpen" :collapsible-info="true" :request-info="true" :members="documentMembers" :document-info="{ id: task.taskId, requestId: task.requestId, title: task.title, partner: task.partner, requestKind: task.requestKind, mainDocument: task.mainDocument, attachments: task.attachments }">

      <div class="rounded-card border border-brand-100 bg-brand-50 p-lg mb-2xl">
            <p class="text-caption text-brand-700 font-semibold mb-1">ASSIGNED REVIEW SCOPE</p>
        <p class="text-bodystrong text-gray-900">{{ task.scope }}</p>
        <p class="text-small text-gray-600 mt-1">Ditugaskan oleh {{ task.assignedBy }} · {{ formatDateTime(task.assignedAt) }}. Anda hanya dapat menelaah baris klausul dalam lingkup ini.</p>
      </div>

      <div v-if="false" class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl">
        <div class="mb-lg flex items-center justify-between gap-3 flex-wrap">
          <div><h2 class="text-cardtitle text-gray-900">Progress</h2><p class="mt-1 text-small text-gray-500">Progress yang sama ditampilkan untuk Requestor, Legal, dan Collaborator.</p></div>
          <span class="rounded-badge bg-brand-50 px-3 py-1 text-caption font-semibold text-brand-700">Review Kolaborator</span>
        </div>
          <DocumentProgress :steps="documentProgress" />
        <p class="mt-1 text-caption text-gray-500">Timestamp berasal dari state workflow bersama dan diperbarui saat aktivitas review berlangsung.</p>
      </div>

      <div v-if="submitted" class="rounded-card border border-success bg-success-light/40 p-lg mb-2xl flex items-center gap-3">
        <CheckCircle2 class="h-5 w-5 text-success shrink-0" />
        <div>
              <p class="text-bodystrong text-success">Hasil review telah dikirim ke Tim Legal</p>
              <p class="text-small text-gray-700 mt-0.5">Catatan review terkunci sampai Tim Legal membuka kembali tugas ini.</p>
        </div>
      </div>

      <div v-if="false" class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl" :class="{ 'submission-collapsed': !submissionOpen }">
        <div class="mb-lg flex items-center justify-between gap-3 flex-wrap">
          <button type="button" class="flex items-center gap-2 text-left" @click="submissionOpen = !submissionOpen">
            <ChevronDown class="h-5 w-5 text-gray-500 transition-transform" :class="submissionOpen ? '' : '-rotate-90'" />
            <span><span class="block text-cardtitle text-gray-900">Form Pengajuan Requestor</span><span class="mt-1 block text-small text-gray-500">Informasi pengajuan yang menjadi konteks review kolaborator.</span></span>
          </button>
          <span class="text-caption font-semibold text-gray-500 bg-gray-100 rounded-badge px-2.5 py-1">Hanya baca</span>
        </div>
        <div v-if="submissionOpen" class="grid grid-cols-1 gap-lg sm:grid-cols-2">
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Jenis Permintaan</label><input :value="task.requestKind || 'Belum tersedia'" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Ketersediaan Dokumen</label><input :value="task.documentCategory || 'Digital Document'" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div v-if="task.mainDocument" class="sm:col-span-2"><label class="block text-small font-semibold text-gray-900 mb-1.5">Dokumen untuk Direview</label><input :value="task.mainDocument.name" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-2xl">
        <!-- Left: Document + timeline -->
        <div class="space-y-2xl">
          <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl" :class="{ 'document-collapsed': !documentsOpen }">
            <button type="button" class="mb-lg flex w-full items-center gap-2 text-left" @click="documentsOpen = !documentsOpen">
              <ChevronDown class="h-5 w-5 text-gray-500 transition-transform" :class="documentsOpen ? '' : '-rotate-90'" />
              <h2 class="text-cardtitle text-gray-900">Dokumen</h2>
            </button>
            <div v-if="documentsOpen" class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3">
              <div class="flex items-center gap-3 min-w-0">
                <FileText class="h-4.5 w-4.5 text-danger shrink-0" />
                <div class="min-w-0">
                  <p class="text-bodystrong text-gray-900 truncate">{{ task.mainDocument?.name || `Draft_Kontrak_${task.requestId}.pdf` }}</p>
                  <p class="text-caption text-gray-500">Dokumen Utama · Hanya baca</p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" class="text-gray-500 hover:text-gray-900" aria-label="Pratinjau" @click="openPreview(task.mainDocument?.name || `Draft_Kontrak_${task.requestId}.pdf`)"><Eye class="h-4 w-4" /></button>
                <button class="text-gray-500 hover:text-gray-900" aria-label="Unduh"><Download class="h-4 w-4" /></button>
              </div>
            </div>
            <div v-if="documentsOpen && activeCycle" class="mt-2 flex items-center justify-between rounded-file border border-brand-200 bg-brand-50/40 px-lg py-3">
              <div class="flex items-center gap-3 min-w-0"><FileText class="h-4.5 w-4.5 text-brand-700 shrink-0" /><div class="min-w-0"><p class="text-bodystrong text-gray-900 truncate">{{ activeCycle.revisionDocument }}</p><p class="text-caption text-brand-700">Dokumen Revisi Requestor · Cycle {{ activeCycle.cycleNumber }}</p></div></div>
              <div class="flex items-center gap-2 shrink-0"><button type="button" class="text-gray-500 hover:text-brand-700" aria-label="Pratinjau dokumen revisi" title="Preview dokumen revisi" @click="previewRevisionDocument"><Eye class="h-4 w-4" /></button><button type="button" class="text-gray-500 hover:text-brand-700" aria-label="Unduh dokumen revisi" title="Unduh dokumen revisi" @click="downloadRevisionDocument"><Download class="h-4 w-4" /></button></div>
            </div>
            <div v-for="file in (task.attachments || [])" :key="file.name" class="mt-2 flex items-center justify-between rounded-file border border-gray-200 px-lg py-3">
              <div class="flex items-center gap-3 min-w-0"><FileText class="h-4.5 w-4.5 text-gray-500 shrink-0" /><div class="min-w-0"><p class="text-bodystrong text-gray-900 truncate">{{ file.name }}</p><p class="text-caption text-gray-500">Lampiran Dokumen</p></div></div>
              <button type="button" class="text-gray-500 hover:text-gray-900 shrink-0" aria-label="Pratinjau lampiran" @click="openPreview(file.name)"><Eye class="h-4 w-4" /></button>
            </div>
            <p class="mt-lg text-caption text-gray-400">Anda dapat melihat dan mengunduh dokumen sesuai akses kolaborator.</p>
          </div>

        </div>

      </div>
      </DocumentMembers>

      <ReviewCycleHistory :request-id="task.requestId" :workspace-cycle-id="workspaceCycle.cycleId" :fallback-cycle="workspaceCycle" @open-comments="handleOpenHistoryComments">
      <template #active>
        <!-- Review workspace -->
        <div class="space-y-2xl">
          <!-- Not started yet: Assigned action bar (DESIGN.md §82) -->
          <div v-if="!started" class="rounded-card border border-gray-200 bg-white shadow-card p-3xl text-center">
            <p class="text-cardtitle text-gray-900">Review belum dimulai</p>
            <p class="mt-1 text-small text-gray-500 max-w-md mx-auto">Klik Mulai Review untuk membuka dokumen dan tabel review pada lingkup {{ task.scope }}.</p>
            <Button variant="primary" class="mt-lg" @click="startReview">Mulai Review</Button>
          </div>

          <template v-else>
            <div>
              <div class="flex flex-wrap items-center justify-between gap-3 mb-lg">
                <p class="text-small text-gray-500">Isi klausul dan catatan review. ON REVIEW diisi oleh Requestor.</p>
                <span v-if="isLocked" class="inline-flex items-center gap-1.5 text-caption text-gray-400">
                  <Lock class="h-3 w-3" /> Terkunci — Sudah Dikirim
                </span>
                <span v-else class="text-caption text-gray-500">{{ rows.filter(r => r.status === 'ACCEPTED' || r.status === 'REVISION').length }} / {{ rows.length }} Terselesaikan</span>
              </div>
              <div class="mb-lg flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3">
                <div class="flex min-w-0 items-center gap-3"><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-white text-brand-700 shadow-sm"><FileText class="h-4 w-4" /></div><div class="min-w-0"><p class="truncate text-small font-semibold text-gray-900">{{ workspaceCycle.revisionDocument }}</p><p class="text-caption text-gray-500">File dokumen kontrak · Cycle {{ workspaceCycle.cycleNumber }}</p></div></div>
                <div class="flex shrink-0 items-center gap-2"><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:text-brand-700" title="Preview dokumen" aria-label="Preview dokumen" @click="previewRevisionDocument"><Eye class="h-4 w-4" /></button><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:text-brand-700" title="Unduh dokumen" aria-label="Unduh dokumen" @click="downloadRevisionDocument"><Download class="h-4 w-4" /></button></div>
              </div>
              <div class="mb-lg flex flex-wrap items-center gap-2 rounded-input border border-gray-200 bg-gray-50 px-3 py-2">
                <span class="mr-1 text-caption font-semibold text-gray-500">Format teks:</span>
                <button type="button" class="format-button font-bold" :disabled="isLocked" aria-label="Bold" @mousedown.prevent @click="applyTextFormat('bold')">B</button>
                <button type="button" class="format-button italic" :disabled="isLocked" aria-label="Italic" @mousedown.prevent @click="applyTextFormat('italic')">I</button>
                <button type="button" class="format-button underline" :disabled="isLocked" aria-label="Underline" @mousedown.prevent @click="applyTextFormat('underline')">U</button>
                <span class="mx-1 h-5 border-l border-gray-300" />
                <button type="button" class="format-button highlight-yellow" :disabled="isLocked" aria-label="Highlight kuning" @mousedown.prevent @click="applyTextFormat('hiliteColor', '#fef08a')" />
                <button type="button" class="format-button highlight-green" :disabled="isLocked" aria-label="Highlight hijau" @mousedown.prevent @click="applyTextFormat('hiliteColor', '#bbf7d0')" />
                <button type="button" class="format-button highlight-blue" :disabled="isLocked" aria-label="Highlight biru" @mousedown.prevent @click="applyTextFormat('hiliteColor', '#bfdbfe')" />
                <span class="ml-1 text-caption text-gray-500">Blok teks di cell lalu pilih format.</span>
              </div>
              <div class="mb-3 flex flex-wrap justify-end gap-2"><Button variant="secondary" size="sm" @click="exportReview">Export ke DOC</Button><Button variant="secondary" size="sm" :disabled="isLocked" @click="addReviewRow">Tambah Baris</Button></div>
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-small font-semibold text-gray-700">Status Keputusan Kolaborator:</span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-caption font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /> {{ approvedCount }} Disetujui (Approved)
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-caption font-bold text-red-700 border border-red-200">
                    <XCircle class="h-3.5 w-3.5 text-red-600" /> {{ rejectedCount }} Perlu Revisi (Rejected)
                  </span>
                </div>
              </div>

              <div class="overflow-x-auto rounded-input border border-gray-200">
                <table class="min-w-[760px] w-full text-body">
                  <thead class="bg-gray-50"><tr class="border-b border-gray-200 text-left text-caption uppercase tracking-wide text-gray-500">
                    <th class="w-12 p-3">No.</th><th class="w-[28%] p-3">Klausul Kontrak</th><th class="w-[38%] p-3">Catatan / Review</th><th class="w-[16%] p-3">On Review</th><th class="w-[18%] p-3 text-center">Aksi &amp; Keputusan</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="row in rows" :key="row.no" class="border-t border-gray-200 align-top">
                      <td class="p-3 text-gray-500">
                        <span>{{ row.no }}</span>
                        <span v-if="!canEditCollaboratorRow(row)" class="mt-1 flex justify-center text-gray-400" :title="`Baris milik ${row.ownerName || 'pengguna lain'}`">
                          <Lock class="h-3.5 w-3.5" />
                        </span>
                      </td>
                      <td class="p-3">
                        <div :contenteditable="canEditCollaboratorRow(row) && (row.isEditing || row.decision === 'REJECTED' || !row.clause)" role="textbox" :aria-label="'Klausul kontrak baris ' + row.no" class="spreadsheet-cell" :class="canEditCollaboratorRow(row) && (row.isEditing || row.decision === 'REJECTED') ? 'bg-white border-brand-300 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed'" data-placeholder="Tulis klausul kontrak…" v-html="row.clause" @focus="rememberEditor" @blur="updateCell(row, 'clause', $event)"></div>
                        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span class="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
                            Milik: {{ row.ownerName || (row.ownerRole === 'COLLABORATOR' ? 'Kolaborator' : 'Tim Legal') }}
                          </span>
                          <span v-if="row.decision === 'APPROVED'" class="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 class="h-3 w-3 text-emerald-600" /> Disetujui
                          </span>
                          <span v-else-if="row.decision === 'REJECTED'" class="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
                            <XCircle class="h-3 w-3 text-red-600" /> Perlu Revisi / Ditolak
                          </span>
                        </div>
                      </td>
                      <td class="p-3">
                        <div :contenteditable="canEditCollaboratorRow(row) && (row.isEditing || row.decision === 'REJECTED' || !row.comment)" role="textbox" :aria-label="'Catatan review baris ' + row.no" class="spreadsheet-cell" :class="canEditCollaboratorRow(row) && (row.isEditing || row.decision === 'REJECTED') ? 'bg-white border-brand-300 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed'" data-placeholder="Tulis catatan atau rekomendasi…" v-html="row.comment" @focus="rememberEditor" @blur="updateCell(row, 'comment', $event)"></div>
                        <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span class="text-caption text-gray-500">{{ row.reviewer || user.name }}</span>
                          <select v-model="row.status" :disabled="!canEditCollaboratorRow(row)" :aria-label="'Status review baris ' + row.no" class="h-8 rounded-input border border-gray-200 bg-white px-2 text-small disabled:bg-gray-50">
                            <option v-for="status in rowStatusOptions" :key="status" :value="status">{{ ROW_STATUS_CONFIG[status].label }}</option>
                          </select>
                        </div>
                      </td>
                      <td class="p-3"><div class="min-h-[112px] whitespace-pre-wrap rounded-input bg-gray-50 p-3 text-body text-gray-500">{{ row.onReview || '' }}</div></td>
                      <td class="p-3 text-center">
                        <div class="flex flex-col items-center gap-2">
                          <!-- Read-only Decision Label -->
                          <span v-if="row.decision === 'APPROVED'" class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-caption font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /> Disetujui
                          </span>
                          <span v-else-if="row.decision === 'REJECTED'" class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-caption font-bold text-red-700 border border-red-200 shadow-sm">
                            <XCircle class="h-3.5 w-3.5 text-red-600" /> Perlu Revisi
                          </span>
                          <span v-else class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-caption font-medium text-gray-500 border border-gray-200">
                            Belum Evaluasi
                          </span>

                          <!-- Pencil Edit & Resubmit Action Button for Row Owner -->
                          <div v-if="canEditCollaboratorRow(row)" class="mt-1">
                            <button
                              v-if="!row.isEditing"
                              type="button"
                              class="inline-flex items-center gap-1 rounded-button border border-gray-200 bg-white px-2.5 py-1 text-caption font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 shadow-sm transition"
                              title="Edit baris ini"
                              @click="toggleEditRow(row)"
                            >
                              <Pencil class="h-3.5 w-3.5 text-brand-600" /> Edit Poin
                            </button>
                            <div v-else class="flex flex-col gap-1 items-center">
                              <button
                                type="button"
                                class="inline-flex items-center gap-1 rounded-button bg-brand-600 px-2.5 py-1 text-caption font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                                title="Simpan & Kirim Ulang Poin Ini"
                                @click="saveAndResubmitRow(row)"
                              >
                                <Send class="h-3.5 w-3.5" /> Simpan & Kirim Ulang
                              </button>
                              <button
                                type="button"
                                class="text-[11px] text-gray-500 hover:underline"
                                @click="row.isEditing = false"
                              >
                                Batal
                              </button>
                            </div>
                          </div>

                          <!-- Action drawer -->
                          <button
                            type="button"
                            class="relative inline-flex items-center gap-1.5 rounded-button border border-gray-200 bg-white px-2.5 py-1 text-caption font-semibold text-gray-600 hover:border-brand-300 hover:text-brand-700 transition shadow-sm mt-1"
                            title="Buka Komentar"
                            @click="openRowComments(row)"
                          >
                            <MessageSquare class="h-3.5 w-3.5 text-brand-600" />
                            Diskusi
                            <span v-if="(row.comments || []).length" class="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm">
                              {{ row.comments.length }}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Collaborator Action Bar — In Progress (DESIGN.md §82) -->
            <div v-if="!isLocked" class="mt-xl flex flex-wrap items-center justify-between gap-4 rounded-input border border-gray-200 bg-gray-50 p-4">
              <p class="text-caption" :class="allRowsResolved ? 'text-success' : 'text-gray-500'">
                <span v-if="savedDraft" class="text-brand-700 font-semibold">Draft tersimpan.</span>
                <span v-else-if="allRowsResolved">Seluruh baris review table telah terselesaikan.</span>
                <span v-else>Lengkapi status setiap baris (Accepted/Revision) sebelum mengirim hasil.</span>
              </p>
              <div class="flex items-center gap-2">
                <Button variant="secondary" @click="saveDraft">
                  <template #icon-left><Save class="h-3.5 w-3.5" /></template>Simpan Draft
                </Button>
                <Button variant="primary" :disabled="!allRowsResolved" title="Lengkapi seluruh baris review table terlebih dahulu" @click="showSubmitModal = true">
                  Kirim Hasil Review
                </Button>
              </div>
            </div>
          </template>
        </div>
      </template>
      </ReviewCycleHistory>
    </template>

    <template v-else>
      <div class="rounded-card border border-gray-200 bg-white shadow-card p-3xl text-center">
        <File class="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p class="text-cardtitle text-gray-900">Tugas review tidak ditemukan</p>
        <p class="mt-1 text-small text-gray-500">Task ID "{{ route.params.taskId }}" tidak ada atau bukan bagian dari penugasan Anda.</p>
        <Button variant="secondary" class="mt-lg" @click="router.push('/collaborator/tasks')">Kembali ke Daftar Tugas</Button>
      </div>
    </template>

    <!-- Submit Confirmation (DESIGN.md §76) -->
    <Modal v-if="showSubmitModal" title="Kirim Hasil Review" max-width="max-w-md" @close="showSubmitModal = false">
      <p class="text-small text-gray-700">
        Hasil review lingkup <span class="font-semibold">{{ task.scope }}</span> akan dikirim ke {{ task.assignedBy }} dan tercatat atas nama Anda. Setelah dikirim, entri review table tidak dapat diubah lagi.
      </p>
      <template #footer>
              <Button variant="secondary" @click="showSubmitModal = false">Batal</Button>
        <Button variant="primary" @click="confirmSubmit">Kirim Hasil Review</Button>
      </template>
    </Modal>
    <PdfPreviewPanel :document="previewDocument" @close="closePreview" />
    <RowCommentSidebar
      :is-open="isCommentSidebarOpen"
      :row="activeCommentRow"
      :cycle-label="activeCommentCycleLabel"
      :read-only="activeCommentReadOnly"
      :actor="user"
      @close="isCommentSidebarOpen = false"
    />
  </AppLayout>
</template>

<style scoped>
.submission-collapsed > div:not(:first-child),
.document-collapsed > div:not(:first-child) {
  display: none;
}

.spreadsheet-cell { min-height: 112px; padding: 12px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; line-height: 1.75; white-space: pre-wrap; }
.spreadsheet-cell[contenteditable="true"]:hover { border-color: #cbd5e1; }
.spreadsheet-cell[contenteditable="true"]:focus { border-color: #2563eb; outline: 2px solid #dbeafe; }
.spreadsheet-cell:empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
}

.format-button {
  display: inline-flex;
  height: 34px;
  width: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
}

.format-button:hover:not(:disabled) { border-color: #2563eb; }
.format-button:disabled { cursor: not-allowed; opacity: 0.4; }
.highlight-yellow { background: #fef08a; }
.highlight-green { background: #bbf7d0; }
.highlight-blue { background: #bfdbfe; }
</style>

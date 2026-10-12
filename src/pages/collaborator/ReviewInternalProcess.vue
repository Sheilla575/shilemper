<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, Download, FileText, File, CheckCircle2, XCircle, Lock, ChevronDown, MessageSquare, Send, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-vue-next'
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
import { getCollabTaskById, COLLAB_TASK_STATUS } from '../../data/collaborator'
import { getReviewTaskById } from '../../data/legal'
import { getActiveCycle, getCyclesByRequest } from '../../data/reviewCycles'
import { REQUEST_DETAIL, getDocumentProgress } from '../../data/requests'
import { formatDateTime } from '../../utils/format'
import { getDocumentMembers } from '../../data/documentMembers'

const route = useRoute()
const router = useRouter()
const user = USERS.collaborator
const documentMembers = getDocumentMembers()
const ticketTab = ref('info')
const documentInfoOpen = ref(true)

const taskId = computed(() => route.params.taskId || 'RVW-2026-0042-01')
const task = computed(() => getCollabTaskById(taskId.value) || getReviewTaskById(taskId.value))
const activeCycle = computed(() => task.value ? getActiveCycle(task.value.requestId) : null)
const requestWorkflow = computed(() => REQUEST_DETAIL.workflow)
const documentProgress = computed(() => getDocumentProgress(requestWorkflow.value))

const rows = ref(task.value ? task.value.reviewTable.map((r) => ({ ...r, decision: r.decision || 'PENDING' })) : [])

const previewDocument = ref(null)
const documentsOpen = ref(true)
const showCompleteModal = ref(false)
const completedProcess = ref(false)

const workspaceCycle = computed(() => activeCycle.value || getCyclesByRequest(task.value?.requestId).at(-1) || {
  cycleId: task.value?.taskId,
  cycleNumber: 0,
  status: 'ACTIVE',
  revisionDocument: task.value?.mainDocument?.name || 'Draft_Kontrak_REQ-2026-0042.pdf',
  items: rows.value,
  startedAt: task.value?.startedAt || task.value?.assignedAt,
})

const isCommentSidebarOpen = ref(false)
const activeCommentRow = ref(null)
const activeCommentCycleLabel = ref('')
const activeCommentReadOnly = ref(false)

const approvedCount = computed(() => rows.value.filter(r => r.decision === 'APPROVED').length)
const rejectedCount = computed(() => rows.value.filter(r => r.decision === 'REJECTED').length)
const pendingCount = computed(() => rows.value.filter(r => r.decision === 'PENDING').length)

function setRowDecision(row, decision) {
  row.decision = row.decision === decision ? 'PENDING' : decision
  if (task.value) {
    task.value.reviewTable = rows.value.map((r) => ({ ...r }))
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

function closePreview() {
  previewDocument.value = null
}

function confirmCompleteInternalReview() {
  completedProcess.value = true
  showCompleteModal.value = false
}
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Internal Review', 'Internal Review Process', taskId]">
    <template v-if="task">
      <!-- Header -->
      <div class="flex items-start justify-between mb-2xl gap-lg flex-wrap">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-small font-semibold text-gray-500">{{ task.taskId }}</span>
            <Badge label="Internal Review (Evaluator POV)" tone="purple" />
            <Badge
              :label="completedProcess ? 'Evaluasi Selesai' : 'Dalam Evaluasi'"
              :tone="completedProcess ? 'success' : 'warning'"
            />
          </div>
          <h1 class="mt-2 text-pagetitle text-gray-900 max-w-3xl">Internal Review — {{ task.title }}</h1>
          <p class="mt-1 text-body text-gray-500">{{ task.requestId }} · {{ task.partner }} · {{ task.classification }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="secondary" @click="router.push('/collaborator/tasks')">
            <template #icon-left><ArrowLeft class="h-4 w-4" /></template>Kembali
          </Button>
          <Button variant="primary" @click="showCompleteModal = true">
            <template #icon-left><ShieldCheck class="h-4 w-4" /></template>Selesaikan Review Internal
          </Button>
        </div>
      </div>

      <!-- Overview Info Banner -->
      <div class="rounded-card border border-purple-200 bg-purple-50/60 p-lg mb-2xl">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-circle bg-purple-100 text-purple-700">
            <UserCheck class="h-5 w-5" />
          </div>
          <div>
            <p class="text-bodystrong text-purple-950 font-semibold">Mode Penilaian / Evaluasi Internal Review</p>
            <p class="text-small text-purple-800 mt-0.5">
              Sebagai Kepala Divisi / Evaluator Internal, Anda dapat meninjau hasil telaah seluruh klausul, memberikan komentar via drawer diskusi, serta menentukan keputusan <span class="font-bold text-emerald-700">Approve</span> atau <span class="font-bold text-red-700">Reject</span> untuk tiap poin review.
            </p>
          </div>
        </div>
      </div>

      <div v-if="completedProcess" class="rounded-card border border-success bg-success-light/40 p-lg mb-2xl flex items-center gap-3">
        <CheckCircle2 class="h-5 w-5 text-success shrink-0" />
        <div>
          <p class="text-bodystrong text-success">Proses Internal Review Selesai</p>
          <p class="text-small text-gray-700 mt-0.5">Keputusan evaluasi internal telah dicatat dan diteruskan ke Tim Legal & Kepala Divisi terkait.</p>
        </div>
      </div>

      <!-- Progress Section -->
      <section class="mb-2xl rounded-card border border-gray-200 bg-white p-2xl shadow-card">
        <div class="mb-lg flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-cardtitle text-gray-900">Progress Workflow</h2>
            <p class="mt-1 text-small text-gray-500">Status alur proses dokumen dari pengajuan hingga persetujuan final.</p>
          </div>
          <span class="rounded-badge bg-purple-50 px-3 py-1 text-caption font-semibold text-purple-700">Internal Review Active</span>
        </div>
        <DocumentProgress :steps="documentProgress" />
      </section>

      <!-- Document Members & Details -->
      <DocumentMembers class="mb-2xl" v-model:active-tab="ticketTab" v-model:info-open="documentInfoOpen" :collapsible-info="true" :request-info="true" :members="documentMembers" :document-info="{ id: task.taskId, requestId: task.requestId, title: task.title, partner: task.partner, requestKind: task.requestKind, mainDocument: task.mainDocument, attachments: task.attachments }">
        <!-- Documents Section -->
        <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl" :class="{ 'document-collapsed': !documentsOpen }">
          <button type="button" class="mb-lg flex w-full items-center gap-2 text-left" @click="documentsOpen = !documentsOpen">
            <ChevronDown class="h-5 w-5 text-gray-500 transition-transform" :class="documentsOpen ? '' : '-rotate-90'" />
            <h2 class="text-cardtitle text-gray-900">Dokumen Acuan Review</h2>
          </button>
          <div v-if="documentsOpen" class="space-y-2">
            <div class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3">
              <div class="flex items-center gap-3 min-w-0">
                <FileText class="h-4.5 w-4.5 text-danger shrink-0" />
                <div class="min-w-0">
                  <p class="text-bodystrong text-gray-900 truncate">{{ task.mainDocument?.name || `Draft_Kontrak_${task.requestId}.pdf` }}</p>
                  <p class="text-caption text-gray-500">Dokumen Utama (Hanya Baca)</p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" class="text-gray-500 hover:text-gray-900" aria-label="Pratinjau" @click="openPreview(task.mainDocument?.name || `Draft_Kontrak_${task.requestId}.pdf`)"><Eye class="h-4 w-4" /></button>
                <button class="text-gray-500 hover:text-gray-900" aria-label="Unduh"><Download class="h-4 w-4" /></button>
              </div>
            </div>
            <div v-if="activeCycle" class="flex items-center justify-between rounded-file border border-purple-200 bg-purple-50/30 px-lg py-3">
              <div class="flex items-center gap-3 min-w-0">
                <FileText class="h-4.5 w-4.5 text-purple-700 shrink-0" />
                <div class="min-w-0">
                  <p class="text-bodystrong text-gray-900 truncate">{{ activeCycle.revisionDocument }}</p>
                  <p class="text-caption text-purple-700">Dokumen Revisi Requestor · Cycle {{ activeCycle.cycleNumber }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" class="text-gray-500 hover:text-purple-700" title="Preview dokumen revisi" @click="previewRevisionDocument"><Eye class="h-4 w-4" /></button>
                <button type="button" class="text-gray-500 hover:text-purple-700" title="Unduh dokumen revisi" @click="downloadRevisionDocument"><Download class="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </DocumentMembers>

      <!-- Review Workspace Table (Interactive Approve/Reject for Internal Review) -->
      <ReviewCycleHistory :request-id="task.requestId" :workspace-cycle-id="workspaceCycle.cycleId" :fallback-cycle="workspaceCycle" @open-comments="handleOpenHistoryComments">
        <template #active>
          <div class="space-y-2xl">
            <!-- Decision Summary Counter Header -->
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3">
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-small font-semibold text-gray-700">Status Keputusan Evaluator Internal:</span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-caption font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                  <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /> {{ approvedCount }} Disetujui (Approved)
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-caption font-bold text-red-700 border border-red-200 shadow-sm">
                  <XCircle class="h-3.5 w-3.5 text-red-600" /> {{ rejectedCount }} Perlu Revisi (Rejected)
                </span>
                <span v-if="pendingCount > 0" class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-caption font-bold text-amber-700 border border-amber-200 shadow-sm">
                  {{ pendingCount }} Belum Dinilai
                </span>
              </div>
              <span class="text-caption text-gray-500">Klik tombol Approve / Reject di kolom Aksi untuk tiap poin</span>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto rounded-input border border-gray-200 bg-white shadow-sm">
              <table class="min-w-[760px] w-full text-body">
                <thead class="bg-gray-50">
                  <tr class="border-b border-gray-200 text-left text-caption font-semibold uppercase tracking-wide text-gray-500">
                    <th class="w-12 p-3">No.</th>
                    <th class="w-[28%] p-3">Klausul Kontrak</th>
                    <th class="w-[38%] p-3">Catatan / Review</th>
                    <th class="w-[16%] p-3">On Review</th>
                    <th class="w-[18%] p-3 text-center">Aksi & Keputusan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rows" :key="row.reviewItemId || row.no" class="border-t border-gray-200 align-top hover:bg-gray-50/50 transition">
                    <td class="p-3 text-gray-500 font-medium">
                      <span>{{ row.no }}</span>
                    </td>
                    <td class="p-3">
                      <div class="spreadsheet-cell min-h-[80px] bg-gray-50/80 p-3 rounded-input text-gray-800 text-small font-medium border border-gray-200" v-html="row.clause"></div>
                      <div class="mt-2 flex flex-wrap items-center gap-1.5">
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
                      <div class="spreadsheet-cell min-h-[80px] bg-gray-50/80 p-3 rounded-input text-gray-700 text-small border border-gray-200" v-html="row.comment || '<span class=&quot;text-gray-400 italic&quot;>Tidak ada catatan</span>'"></div>
                      <div class="mt-2 flex items-center justify-between text-caption text-gray-500">
                        <span>Penelaah: {{ row.reviewer || 'Tim Reviewer' }}</span>
                      </div>
                    </td>
                    <td class="p-3">
                      <div class="min-h-[80px] whitespace-pre-wrap rounded-input bg-gray-50 p-3 text-small text-gray-500 border border-gray-200">
                        {{ row.onReview || '' }}
                      </div>
                    </td>
                    <td class="p-3 text-center">
                      <div class="flex flex-col items-center gap-2">
                        <!-- Interactive Approve / Reject Toggle Buttons -->
                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded px-2.5 py-1 text-caption font-semibold transition"
                            :class="row.decision === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'"
                            title="Setujui (Approve) poin review ini"
                            @click="setRowDecision(row, 'APPROVED')"
                          >
                            <CheckCircle2 class="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded px-2.5 py-1 text-caption font-semibold transition"
                            :class="row.decision === 'REJECTED' ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-300' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'"
                            title="Tolak / minta revisi (Reject) poin review ini"
                            @click="setRowDecision(row, 'REJECTED')"
                          >
                            <XCircle class="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                        <!-- Comment Sidebar Drawer Button -->
                        <button
                          type="button"
                          class="relative inline-flex items-center gap-1.5 rounded-button border border-gray-200 bg-white px-2.5 py-1 text-caption font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-700 transition shadow-sm"
                          title="Buka Komentar & Diskusi Poin Ini"
                          @click="openRowComments(row)"
                        >
                          <MessageSquare class="h-3.5 w-3.5 text-purple-600" />
                          Diskusi
                          <span v-if="(row.comments || []).length" class="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white shadow-sm">
                            {{ row.comments.length }}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Internal Review Bottom Action Bar -->
            <div class="mt-xl flex flex-wrap items-center justify-between gap-4 rounded-input border border-purple-200 bg-purple-50/50 p-4">
              <div>
                <p class="text-bodystrong text-purple-950 font-semibold">Proses Review Internal Poin 1–7</p>
                <p class="text-caption text-purple-700 mt-0.5">
                  {{ approvedCount }} Poin Disetujui · {{ rejectedCount }} Poin Memerlukan Revisi
                </p>
              </div>
              <Button variant="primary" class="bg-purple-700 hover:bg-purple-800" @click="showCompleteModal = true">
                <template #icon-left><Send class="h-4 w-4" /></template>Simpan & Process Internal Review
              </Button>
            </div>
          </div>
        </template>
      </ReviewCycleHistory>
    </template>

    <template v-else>
      <div class="rounded-card border border-gray-200 bg-white shadow-card p-3xl text-center">
        <File class="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p class="text-cardtitle text-gray-900">Tugas Internal Review tidak ditemukan</p>
        <p class="mt-1 text-small text-gray-500">Task ID "{{ taskId }}" tidak valid.</p>
        <Button variant="secondary" class="mt-lg" @click="router.push('/collaborator/tasks')">Kembali ke Daftar Tugas</Button>
      </div>
    </template>

    <!-- Complete Internal Review Modal -->
    <Modal v-if="showCompleteModal" title="Konfirmasi Process Review Internal" max-width="max-w-md" @close="showCompleteModal = false">
      <div class="space-y-3 text-small text-gray-700">
        <p>
          Anda akan menyelesaikan proses <span class="font-semibold text-purple-800">Internal Review</span> untuk task <span class="font-semibold">{{ taskId }}</span>.
        </p>
        <div class="rounded-input border border-gray-200 bg-gray-50 p-3 text-caption text-gray-600 space-y-1">
          <p class="font-semibold text-gray-900">Ringkasan Keputusan Internal:</p>
          <p class="text-emerald-700 font-medium">✓ Disetujui (Approved): {{ approvedCount }} poin</p>
          <p class="text-red-700 font-medium">✗ Perlu Revisi (Rejected): {{ rejectedCount }} poin</p>
        </div>
        <p class="text-caption text-gray-500">
          Notifikasi dan salinan hasil review akan dikirimkan secara otomatis kepada Kepala Divisi Legal & Kadiv pengaju.
        </p>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showCompleteModal = false">Batal</Button>
        <Button variant="primary" class="bg-purple-700 hover:bg-purple-800" @click="confirmCompleteInternalReview">Process & Kirim Hasil</Button>
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
.spreadsheet-cell { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
</style>

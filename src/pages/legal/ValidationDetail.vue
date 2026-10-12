<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, XCircle, Eye, Download, FileText, File, AlertTriangle, Users2, ChevronDown } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Modal from '../../components/ui/Modal.vue'
import PdfPreviewPanel from '../../components/document/PdfPreviewPanel.vue'
import DocumentMembers from '../../components/document/DocumentMembers.vue'
import DocumentProgress from '../../components/request/DocumentProgress.vue'
import { USERS } from '../../data/users'
import { getValidationById, COLLABORATORS, createReviewTaskFromValidation } from '../../data/legal'
import { REQUESTS } from '../../data/requests'
import { formatDateTime } from '../../utils/format'
import { getDocumentMembers } from '../../data/documentMembers'

const route = useRoute()
const router = useRouter()
const user = USERS.legal
const documentMembers = getDocumentMembers()
const ticketTab = ref('info')

const item = computed(() => getValidationById(route.params.id))
const submissionOpen = ref(true)
const checklistOpen = ref(true)
const documentsOpen = ref(true)

const showRejectModal = ref(false)
const showValidateModal = ref(false)
const validated = ref(item.value?.status === 'VALIDATED')
const rejected = ref(item.value?.status === 'RETURNED')
const rejectReason = ref('')
const previewDocument = ref(null)
const assignmentMode = ref('self')
const selectedCollaboratorId = ref('')
const collaboratorSearch = ref('')
const showCollaboratorOptions = ref(false)
const assignedCollaborators = ref([])

// Dipakai sebagai fallback sampai URL file dari API tersedia.
const fallbackPdfSource = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'

const requiredIncomplete = computed(() => item.value?.checklist.filter((c) => c.required && !c.complete) || [])
const validationLocked = computed(() => ['RETURNED', 'VALIDATED'].includes(item.value?.status))
const checklistDecision = (check) => check.decision || 'PENDING'
const undecidedRequired = computed(() => item.value?.checklist.filter((c) => c.required && checklistDecision(c) === 'PENDING') || [])
const rejectedDocuments = computed(() => item.value?.checklist.filter((c) => checklistDecision(c) === 'REJECTED') || [])
const rejectedWithoutNote = computed(() => rejectedDocuments.value.filter((c) => !c.note?.trim()))
const checklistComplete = computed(() => item.value?.checklist.filter((c) => c.required).every((c) => checklistDecision(c) === 'ACCEPTED'))
const submittedDocuments = computed(() => item.value?.checklist.filter((c) => c.complete) || [])
const documentProgress = computed(() => {
  const status = item.value?.status
  const validatedAt = item.value?.validatedAt
  const submittedAt = item.value?.submittedAt
  const validated = status === 'VALIDATED'
  const returned = status === 'RETURNED'
  return [
    { step: 1, title: 'Dikirim Requestor', at: submittedAt, done: true },
    { step: 2, title: 'Pemeriksaan Dokumen', at: validatedAt || submittedAt, done: validated || returned, active: !validated && !returned },
    { step: 3, title: 'Penugasan Review', at: validatedAt, done: validated, active: false },
    { step: 4, title: 'Legal Review', at: validatedAt, done: false, active: validated },
    { step: 5, title: 'Selesai', at: null, done: false, active: false, estimated: true },
  ]
})

function setChecklistDecision(check, decision) {
  if (validationLocked.value) return
  check.decision = decision
  check.complete = decision === 'ACCEPTED'
  if (decision !== 'REJECTED') check.note = ''
}

function confirmReject() {
  if (!rejectReason.value.trim() || rejectedWithoutNote.value.length) return
  const now = new Date().toISOString()
  const reason = rejectReason.value.trim()
  item.value.status = 'RETURNED'
  item.value.rejectionReason = reason
  item.value.returnedAt = now
  const request = REQUESTS.find((entry) => entry.id === item.value.id)
  if (request) {
    request.status = 'RETURNED'
    request.rejectionReason = reason
    request.updatedAt = now
  }
  // Backend: status -> Returned, rejection reason + returned_at stored, event created,
  // Requestor notified (DESIGN.md §27).
  rejected.value = true
  showRejectModal.value = false
}

function confirmValidate() {
  if (!item.value || !checklistComplete.value || (assignmentMode.value === 'collaborator' && !assignedCollaborators.value.length)) return
  const now = new Date().toISOString()
  const task = createReviewTaskFromValidation(item.value, assignmentMode.value, assignedCollaborators.value)
  item.value.status = 'VALIDATED'
  item.value.validatedAt = now
  item.value.taskId = task.taskId
  const request = REQUESTS.find((entry) => entry.id === item.value.id)
  if (request) {
    request.status = 'IN_REVIEW'
    request.taskId = task.taskId
    request.updatedAt = now
  }
  validated.value = true
  showValidateModal.value = false
  router.push(`/legal/reviews/${task.taskId}`)
}

function openPreview(document) {
  previewDocument.value = {
    name: document.name || document.label,
    source: document.previewUrl || fallbackPdfSource,
  }
}

function closePreview() {
  previewDocument.value = null
}

const selectedCollaborator = computed(() => COLLABORATORS.find((collaborator) => collaborator.id === selectedCollaboratorId.value))
const availableCollaborators = computed(() => {
  const query = collaboratorSearch.value.trim().toLowerCase()
  return COLLABORATORS.filter((collaborator) => {
    const notAssigned = !assignedCollaborators.value.some((assigned) => assigned.id === collaborator.id)
    const matchesSearch = !query || `${collaborator.name} ${collaborator.division}`.toLowerCase().includes(query)
    return notAssigned && matchesSearch
  })
})

function addCollaborator() {
  if (validationLocked.value) return
  if (!selectedCollaborator.value || assignedCollaborators.value.some((collaborator) => collaborator.id === selectedCollaborator.value.id)) return
  assignedCollaborators.value.push(selectedCollaborator.value)
  selectedCollaboratorId.value = ''
  collaboratorSearch.value = ''
  showCollaboratorOptions.value = false
}

function chooseCollaborator(collaborator) {
  selectedCollaboratorId.value = collaborator.id
  collaboratorSearch.value = collaborator.name
  showCollaboratorOptions.value = false
}

function removeCollaborator(id) {
  if (validationLocked.value) return
  assignedCollaborators.value = assignedCollaborators.value.filter((collaborator) => collaborator.id !== id)
}

</script>

<template>
  <AppLayout role-key="legal" :user="user" :breadcrumb="['Legal Portal', 'Validation Queue', route.params.id]">
    <template v-if="item">
      <div class="flex items-start justify-between mb-2xl gap-lg flex-wrap">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-small font-semibold text-gray-500">{{ item.id }}</span>
            <Badge
              :label="item.status === 'VALIDATED' ? 'Tervalidasi' : (item.status === 'RETURNED' ? 'Dikembalikan' : 'Menunggu Validasi')"
              :tone="item.status === 'VALIDATED' ? 'success' : (item.status === 'RETURNED' ? 'danger' : 'warning')"
              :dot="false"
            />
            <span v-if="item.resubmission" class="text-caption font-semibold text-info bg-info-light rounded-badge px-2.5 py-1">Diajukan Ulang</span>
          </div>
          <h1 class="mt-2 text-pagetitle text-gray-900 max-w-3xl">{{ item.title }}</h1>
          <p class="mt-1 text-body text-gray-500">{{ item.partner }} · {{ item.classification }} · {{ item.type }}</p>
        </div>
        <Button variant="secondary" @click="router.push('/legal/validation')">Back to Queue</Button>
      </div>

      <DocumentMembers class="mb-2xl" v-model:active-tab="ticketTab" :members="documentMembers" :document-info="{ id: item.id, title: item.title, status: item.status, partner: item.partner, type: item.classification }">

      <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl">
        <h2 class="text-cardtitle text-gray-900 mb-lg">Document Progress</h2>
        <DocumentProgress :steps="documentProgress" />
      </div>

      <div v-if="item.priorRejectionNote" class="rounded-card border border-warning-light bg-warning-light/40 p-lg mb-2xl flex gap-3">
        <AlertTriangle class="h-5 w-5 text-warning shrink-0" />
        <div>
          <p class="text-bodystrong text-warning">Catatan Penolakan Sebelumnya</p>
          <p class="text-small text-gray-700 mt-0.5">{{ item.priorRejectionNote }}</p>
        </div>
      </div>

      <div v-if="validated" class="rounded-card border border-success bg-success-light/40 p-lg mb-2xl flex items-center gap-3">
        <CheckCircle2 class="h-5 w-5 text-success shrink-0" />
        <div>
          <p class="text-bodystrong text-success">Documents validated successfully</p>
          <p class="text-small text-gray-700 mt-0.5">The form is locked and the Legal review task is now open.</p>
        </div>
      </div>
      <div v-if="rejected" class="rounded-card border border-danger bg-danger-light/40 p-lg mb-2xl flex items-center gap-3">
        <XCircle class="h-5 w-5 text-danger shrink-0" />
        <div>
          <p class="text-bodystrong text-danger">Permohonan dikembalikan ke Requestor</p>
          <p class="text-small text-gray-700 mt-0.5">Alasan: {{ rejectReason }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-2xl">
        <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
          <p class="text-caption text-gray-500 mb-2">REQUESTOR</p>
          <p class="text-bodystrong text-gray-900">{{ item.requestor.name }}</p>
          <p class="text-small text-gray-500">{{ item.requestor.division }}</p>
        </div>
        <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
          <p class="text-caption text-gray-500 mb-2">DIAJUKAN PADA</p>
          <p class="text-bodystrong text-gray-900">{{ formatDateTime(item.submittedAt) }}</p>
        </div>
      </div>

      <div class="flex flex-col">
      <div class="order-1 rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl" :class="{ 'submission-collapsed': !submissionOpen }">
        <button type="button" class="mb-lg flex w-full items-center gap-2 text-left" @click="submissionOpen = !submissionOpen">
          <ChevronDown class="h-5 w-5 text-gray-500 transition-transform" :class="submissionOpen ? '' : '-rotate-90'" />
          <h2 class="text-cardtitle text-gray-900">Requestor Submission</h2>
        </button>
        <div v-if="submissionOpen" class="grid grid-cols-1 gap-lg sm:grid-cols-2">
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Document Title</label><input :value="item.title" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Unit</label><input :value="item.classification" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Jenis Permintaan</label><input :value="item.requestKind || 'Belum tersedia'" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Nama Mitra</label><input :value="item.partner" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Jenis Mitra</label><input :value="item.type" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div><label class="block text-small font-semibold text-gray-900 mb-1.5">Ketersediaan Dokumen</label><input :value="item.documentCategory || 'Digital Document'" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
          <div v-if="item.mainDocument"><label class="block text-small font-semibold text-gray-900 mb-1.5">Dokumen untuk Direview</label><input :value="item.mainDocument.name" disabled class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700" /></div>
        </div>
        <template v-if="submissionOpen">
          <div class="mt-lg rounded-input bg-gray-50 px-3 py-2"><p class="text-caption text-gray-500">REQUESTOR</p><p class="mt-1 text-small text-gray-900">{{ item.requestor.name }} · {{ item.requestor.division }}</p></div>
        </template>
      </div>

      <div class="order-3 rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl">
        <div class="flex items-center justify-between mb-lg">
          <button type="button" class="flex items-center gap-2 text-left" @click="checklistOpen = !checklistOpen">
            <ChevronDown class="h-5 w-5 text-gray-500 transition-transform" :class="checklistOpen ? '' : '-rotate-90'" />
            <h2 class="text-cardtitle text-gray-900">Required Documents Checklist</h2>
          </button>
          <span
            class="text-caption font-semibold rounded-badge px-2.5 py-1"
            :class="requiredIncomplete.length === 0 ? 'text-success bg-success-light' : 'text-danger bg-danger-light'"
          >
            {{ item.checklist.filter(c => c.complete).length }} / {{ item.checklist.length }} Diunggah
          </span>
        </div>
        <div v-if="checklistOpen" class="space-y-2">
          <div
            v-for="c in item.checklist"
            :key="c.id"
            class="flex flex-col items-stretch gap-2 rounded-input border px-lg py-3"
            :class="checklistDecision(c) === 'ACCEPTED' ? 'border-success/40 bg-success-light/20' : (checklistDecision(c) === 'REJECTED' ? 'border-danger-light bg-danger-light/40' : 'border-gray-200')"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <CheckCircle2 v-if="checklistDecision(c) === 'ACCEPTED'" class="h-4.5 w-4.5 text-success shrink-0" />
                <XCircle v-else-if="checklistDecision(c) === 'REJECTED'" class="h-4.5 w-4.5 text-danger shrink-0" />
                <FileText v-else class="h-4.5 w-4.5 text-gray-300 shrink-0" />
                <p class="text-body text-gray-900">{{ c.label }}</p>
              </div>
              <div class="flex gap-2">
                <button type="button" :disabled="validationLocked" :aria-pressed="checklistDecision(c) === 'ACCEPTED'" class="rounded-button border px-3 py-1.5 text-caption font-semibold disabled:cursor-not-allowed disabled:opacity-50" :class="checklistDecision(c) === 'ACCEPTED' ? 'border-success bg-success-light text-success' : 'border-gray-200 text-gray-600'" @click.stop="setChecklistDecision(c, 'ACCEPTED')">Diterima</button>
                <button type="button" :disabled="validationLocked" :aria-pressed="checklistDecision(c) === 'REJECTED'" class="rounded-button border px-3 py-1.5 text-caption font-semibold disabled:cursor-not-allowed disabled:opacity-50" :class="checklistDecision(c) === 'REJECTED' ? 'border-danger bg-danger-light text-danger' : 'border-gray-200 text-gray-600'" @click.stop="setChecklistDecision(c, 'REJECTED')">Ditolak</button>
                <button v-if="c.complete" type="button" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="Pratinjau berkas" @click.prevent="openPreview(c)">
                  <Eye class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div v-if="checklistDecision(c) === 'REJECTED'" class="pl-7">
              <label :for="`rejection-note-${c.id}`" class="mb-1.5 block text-small font-semibold text-gray-900">
                Catatan penolakan <span class="text-danger">*</span>
              </label>
              <textarea
                :id="`rejection-note-${c.id}`"
                v-model="c.note"
                rows="2"
                required
                placeholder="Jelaskan dokumen yang perlu diperbaiki atau dilengkapi."
                class="w-full rounded-input border border-gray-200 bg-white px-3 py-2 text-body text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
              ></textarea>
              <p v-if="!c.note?.trim()" class="mt-1 text-caption text-danger">Catatan wajib diisi karena dokumen ditolak.</p>
            </div>
          </div>
        </div>
        <div v-if="checklistOpen && rejectedDocuments.length" class="mt-lg rounded-input border border-danger-light bg-danger-light/40 px-3 py-2">
          <p class="text-small font-semibold text-danger">Dokumen yang perlu dilengkapi Requestor</p>
          <ul class="mt-1 list-disc pl-5 text-small text-gray-700">
            <li v-for="document in rejectedDocuments" :key="document.id">{{ document.label }}<span v-if="document.note"> — {{ document.note }}</span></li>
          </ul>
        </div>
      </div>

      <div class="order-2 rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl">
        <div class="flex items-center justify-between mb-lg">
          <button type="button" class="flex items-center gap-2 text-left" @click="documentsOpen = !documentsOpen">
            <ChevronDown class="h-5 w-5 text-gray-500 transition-transform" :class="documentsOpen ? '' : '-rotate-90'" />
            <h2 class="text-cardtitle text-gray-900">Dokumen Utama &amp; Lampiran</h2>
          </button>
        </div>
        <div v-if="documentsOpen" class="space-y-2">
          <div class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3">
            <div class="flex items-center gap-3 min-w-0">
              <FileText class="h-4.5 w-4.5 text-danger shrink-0" />
              <div class="min-w-0">
                <p class="text-bodystrong text-gray-900 truncate">Draft_Kontrak_{{ item.id }}_v1.0.pdf</p>
                <p class="text-caption text-gray-500">Dokumen Utama · 100% Terunggah</p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button type="button" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="Pratinjau" @click="openPreview({ name: `Draft_Kontrak_${item.id}_v1.0.pdf` })"><Eye class="h-4 w-4" /></button>
              <button class="text-gray-500 hover:text-gray-900" aria-label="Unduh"><Download class="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      </div>

      <PdfPreviewPanel :document="previewDocument" @close="closePreview" />

      <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl">
        <div class="flex items-center gap-2 mb-lg"><Users2 class="h-4 w-4 text-brand-700" /><h2 class="text-cardtitle text-gray-900">Review Assignment</h2></div>
        <p class="text-small text-gray-500 mb-lg">Choose whether to review the request yourself or assign it to a collaborator.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" :disabled="validationLocked" class="rounded-input border p-4 text-left disabled:cursor-not-allowed disabled:opacity-50" :class="assignmentMode === 'self' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'" @click="assignmentMode = 'self'"><p class="text-bodystrong text-gray-900">I will review it</p><p class="mt-1 text-caption text-gray-500">Add this task to my active work.</p></button>
          <button type="button" :disabled="validationLocked" class="rounded-input border p-4 text-left disabled:cursor-not-allowed disabled:opacity-50" :class="assignmentMode === 'collaborator' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'" @click="assignmentMode = 'collaborator'"><p class="text-bodystrong text-gray-900">Assign to collaborator</p><p class="mt-1 text-caption text-gray-500">Choose a reviewer from a related division.</p></button>
        </div>
        <div v-if="assignmentMode === 'collaborator'" class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="relative w-full sm:max-w-md">
            <input
              v-model="collaboratorSearch"
              :disabled="validationLocked"
              type="search"
              placeholder="Pilih atau cari kolaborator..."
              class="h-10 w-full rounded-input border border-gray-200 bg-white px-3 text-small text-gray-700 focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-gray-50"
              @focus="showCollaboratorOptions = true"
              @input="selectedCollaboratorId = ''; showCollaboratorOptions = true"
              @keydown.esc="showCollaboratorOptions = false"
            />
            <div v-if="showCollaboratorOptions" class="absolute left-0 right-0 top-11 z-20 max-h-56 overflow-y-auto rounded-input border border-gray-200 bg-white p-1 shadow-card">
              <button
                v-for="collaborator in availableCollaborators"
                :key="collaborator.id"
                type="button"
                class="block w-full rounded-input px-3 py-2 text-left hover:bg-brand-50"
                @mousedown.prevent
                @click="chooseCollaborator(collaborator)"
              >
                <span class="block text-small font-semibold text-gray-900">{{ collaborator.name }}</span>
                <span class="block text-caption text-gray-500">{{ collaborator.division }}</span>
              </button>
              <p v-if="availableCollaborators.length === 0" class="px-3 py-2 text-small text-gray-500">Kolaborator tidak ditemukan.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" :disabled="validationLocked || !selectedCollaborator" @click="addCollaborator">Tambah</Button>
        </div>
        <div v-if="assignmentMode === 'collaborator' && assignedCollaborators.length" class="mt-3 space-y-2">
          <p class="text-small font-semibold text-gray-900">Kolaborator yang ditugaskan</p>
          <div v-for="collaborator in assignedCollaborators" :key="collaborator.id" class="flex items-center justify-between rounded-input border border-brand-100 bg-brand-50 px-3 py-2">
            <div><p class="text-small font-semibold text-gray-900">{{ collaborator.name }}</p><p class="text-caption text-gray-500">{{ collaborator.division }} · {{ collaborator.scopes.join(', ') }}</p></div>
            <button type="button" :disabled="validationLocked" class="text-small font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50" @click="removeCollaborator(collaborator.id)">Hapus</button>
          </div>
        </div>
      </div>

      <!-- Legal Action Bar (DESIGN.md §81) -->
      <div v-if="!validated && !rejected" class="mt-2xl flex flex-col gap-4 rounded-card border border-gray-200 bg-white px-4 sm:px-2xl py-lg shadow-card">
        <p class="text-caption" :class="checklistComplete ? 'text-success' : 'text-danger'">
          {{ checklistComplete ? 'Seluruh dokumen sudah diterima.' : (rejectedWithoutNote.length ? `${rejectedWithoutNote.length} catatan penolakan wajib diisi.` : `${undecidedRequired.length} keputusan dokumen belum ditentukan.`) }}
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="danger" @click="showRejectModal = true">Reject Request</Button>
          <Button variant="primary" :disabled="!checklistComplete || (assignmentMode === 'collaborator' && !assignedCollaborators.length)" title="Lengkapi checklist dan pilih penugasan terlebih dahulu" @click="showValidateModal = true">
            Validate Documents
          </Button>
        </div>
      </div>
        </DocumentMembers>
    </template>

    <template v-else>
      <div class="rounded-card border border-gray-200 bg-white shadow-card p-3xl text-center">
        <File class="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p class="text-cardtitle text-gray-900">Permohonan tidak ditemukan dalam antrian validasi</p>
        <p class="mt-1 text-small text-gray-500">Nomor request "{{ route.params.id }}" tidak ada atau sudah diproses.</p>
        <Button variant="secondary" class="mt-lg" @click="router.push('/legal/validation')">Kembali ke Antrian</Button>
      </div>
    </template>

    <!-- Reject Modal (DESIGN.md §27) -->
    <Modal v-if="showRejectModal" title="Reject Request" @close="showRejectModal = false">
      <p class="text-small text-gray-500 mb-lg">Permohonan akan dikembalikan ke Requestor beserta catatan perbaikan. Riwayat penolakan akan tetap tersimpan.</p>
      <label class="block text-small font-semibold text-gray-900 mb-1.5">Alasan Penolakan *</label>
      <textarea
        v-model="rejectReason"
        rows="4"
        placeholder="cth. Mohon lampirkan Surat Kuasa Direksi (PoA) yang masih berlaku sebelum permohonan dapat divalidasi."
        class="w-full rounded-input border border-gray-200 px-3 py-2 text-body focus:border-brand-500"
      ></textarea>
      <div v-if="rejectedDocuments.length" class="mt-lg rounded-input border border-danger-light bg-danger-light/40 p-3">
        <p class="text-small font-semibold text-danger">Rincian dokumen yang kurang/tidak sesuai</p>
        <ul class="mt-1 list-disc pl-5 text-small text-gray-700">
          <li v-for="document in rejectedDocuments" :key="document.id">{{ document.label }} — {{ document.note || 'Catatan belum diisi' }}</li>
        </ul>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showRejectModal = false">Cancel</Button>
        <Button variant="danger" :disabled="!rejectReason.trim() || rejectedWithoutNote.length > 0" @click="confirmReject">Reject &amp; Return</Button>
      </template>
    </Modal>

    <!-- Validate Confirmation Modal (DESIGN.md §76) -->
    <Modal v-if="showValidateModal" title="Konfirmasi Validate Documents" max-width="max-w-md" @close="showValidateModal = false">
      <p class="text-small text-gray-700">
        Berikut daftar dokumen yang dikirim oleh Requestor untuk permohonan <span class="font-semibold">{{ item.id }}</span>:
      </p>
      <ul class="mt-lg space-y-2 rounded-input border border-gray-200 bg-gray-50 p-3">
        <li v-for="document in submittedDocuments" :key="document.id" class="flex items-start gap-2 text-small text-gray-700">
          <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{{ document.label }}</span>
        </li>
      </ul>
      <div v-if="assignmentMode === 'collaborator'" class="mt-lg rounded-input border border-brand-100 bg-brand-50 p-3">
        <p class="text-small font-semibold text-gray-900">Kolaborator yang akan ditugaskan</p>
        <ul class="mt-2 space-y-1.5">
          <li v-for="collaborator in assignedCollaborators" :key="collaborator.id" class="text-small text-gray-700">{{ collaborator.name }} <span class="text-gray-500">— {{ collaborator.division }}</span></li>
        </ul>
      </div>
      <p class="mt-lg text-small text-gray-500">Setelah divalidasi, form akan terkunci dan tugas telaah hukum Fase 2 otomatis dibuka.</p>
      <p class="mt-2 text-small text-gray-500">Tindakan ini tidak dapat dibatalkan dari halaman ini.</p>
      <template #footer>
        <Button variant="secondary" @click="showValidateModal = false">Cancel</Button>
        <Button variant="primary" :disabled="!checklistComplete || (assignmentMode === 'collaborator' && !assignedCollaborators.length)" @click="confirmValidate">Validate Documents</Button>
      </template>
    </Modal>
  </AppLayout>
</template>

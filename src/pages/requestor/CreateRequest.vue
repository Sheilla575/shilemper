<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Upload, CheckCircle2, X, Plus, ClipboardCheck, FilePenLine, MessagesSquare } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import { USERS } from '../../data/users'
import { createRequiredDocumentChecklist } from '../../data/requiredDocuments'
import { createRequest } from '../../data/requests'
import { createValidationRequest } from '../../data/legal'

const router = useRouter()
const user = USERS.requestor

const form = ref({
  title: '',
  internalRef: '',
  department: 'Pengadaan',
  requestType: 'Amandemen Vendor',
  counterpartyKind: 'Vendor', // Client | Vendor | Konsorsium
  documentCategory: 'Digital Document',
  partnerName: '',
  picName: '',
  picTitle: '',
  picEmail: '',
  vendorCategory: '',
  vendorRegistration: '',
  consortiumLead: '',
})

const REQUEST_TYPES = {
  Pengadaan: [
    { label: 'Amandemen Vendor', counterpartyKind: 'Vendor', service: 'REVIEW', flow: ['Tim Legal memvalidasi kelengkapan dokumen.', 'Tim Legal menentukan apakah kolaborator diperlukan.', 'Tim Legal dan/atau kolaborator melakukan review dokumen amandemen.'] },
    { label: 'Kontrak Vendor / Draf Dokumen', counterpartyKind: 'Vendor', service: 'DRAFT', flow: ['Tim Legal memvalidasi kelengkapan dokumen pendukung.', 'Tim Legal menyusun draf dokumen atau rancangan kontrak.', 'Requestor menerima draf dari Tim Legal untuk ditindaklanjuti.'] },
  ],
  Komersial: [
    { label: 'Amandemen Client', counterpartyKind: 'Client', service: 'REVIEW', flow: ['Tim Legal memvalidasi kelengkapan dokumen.', 'Tim Legal menentukan apakah kolaborator diperlukan.', 'Tim Legal dan/atau kolaborator melakukan review dokumen amandemen.'] },
    { label: 'Konsiyering', counterpartyKind: 'Client', service: 'CONSINYERING', flow: ['Tim Legal memvalidasi kelengkapan dokumen pendukung.', 'Tim Legal menyiapkan dan menjadwalkan konsinyering dengan pihak terkait.', 'Hasil konsinyering disampaikan kepada Requestor sebagai tindak lanjut.'] },
    { label: 'Kontrak Vendor', counterpartyKind: 'Vendor', service: 'DRAFT', flow: ['Tim Legal memvalidasi kelengkapan dokumen pendukung.', 'Tim Legal menyusun draf dokumen atau rancangan kontrak.', 'Requestor menerima draf dari Tim Legal untuk ditindaklanjuti.'] },
  ],
}

const selectedRequest = computed(() =>
  REQUEST_TYPES[form.value.department].find((item) => item.label === form.value.requestType),
)
const isReviewRequest = computed(() => selectedRequest.value?.service === 'REVIEW')
const isDraftRequest = computed(() => selectedRequest.value?.service === 'DRAFT')
const isConsinyeringRequest = computed(() => selectedRequest.value?.service === 'CONSINYERING')
const serviceLabel = computed(() => {
  if (isReviewRequest.value) return 'Review Dokumen'
  if (isDraftRequest.value) return 'Permintaan Draf Dokumen'
  return 'Konsiyering dengan Tim Legal'
})
const partnerLabel = computed(() => form.value.counterpartyKind === 'Client' ? 'Client Name' : 'Vendor Name')
const serviceIcon = computed(() => isReviewRequest.value ? ClipboardCheck : (isDraftRequest.value ? FilePenLine : MessagesSquare))

const mainDocUploaded = ref(false)
const mainDocName = ref('')
const assignmentFileInput = ref(null)
const additionalFileInput = ref(null)

function createChecklist() {
  return createRequiredDocumentChecklist(form.value.counterpartyKind, {
    status: 'PENDING',
    note: '',
  })
}

const checklist = ref(createChecklist())
const newDocumentLabel = ref('')

const requiredDone = computed(() => checklist.value.filter((c) => c.required).every((c) => Boolean(c.fileName)))
const requiredDocumentsUploaded = computed(() => checklist.value.filter((c) => c.required).every((c) => Boolean(c.fileName)))
const allDocumentsUploaded = computed(() => checklist.value.length > 0 && checklist.value.every((c) => Boolean(c.fileName)))
const completion = computed(() => {
  const total = isReviewRequest.value ? 4 : 3 // title, partner, checklist, and review document when applicable
  let done = 0
  if (form.value.title) done += 1
  if (form.value.partnerName) done += 1
  if (isReviewRequest.value && mainDocUploaded.value) done += 1
  if (requiredDone.value) done += 1
  return Math.round((done / total) * 100)
})

const documentReady = computed(() => !isReviewRequest.value || form.value.documentCategory === 'Physical Document' || mainDocUploaded.value)
const canSubmit = computed(() => form.value.title && documentReady.value && requiredDone.value && form.value.partnerName)

function toggleChecklist(item) {
  if (item.fileName) return
  document.getElementById(`checklist-file-${item.id}`)?.click()
}

function removeChecklist(item) {
  if (item.required) return
  checklist.value = checklist.value.filter((entry) => entry.id !== item.id)
}

function openMainFilePicker() {
  assignmentFileInput.value?.click()
}

function applyMainFile(file) {
  if (!file) return
  if (file.size > 10 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.pdf')) return
  mainDocUploaded.value = true
  mainDocName.value = file.name
}

function handleMainFile(event) {
  applyMainFile(event.target.files?.[0])
  event.target.value = ''
}

function handleMainDrop(event) {
  applyMainFile(event.dataTransfer.files?.[0])
}

function applyChecklistFile(item, file) {
  if (!file) return
  item.status = 'PENDING'
  item.fileName = file.name
}

function handleChecklistFile(item, event) {
  applyChecklistFile(item, event.target.files?.[0])
  event.target.value = ''
}

function handleChecklistDrop(item, event) {
  applyChecklistFile(item, event.dataTransfer.files?.[0])
}

function openAdditionalFilePicker() {
  additionalFileInput.value?.click()
}

function handleAdditionalFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  checklist.value.push({
    id: Date.now(),
    label: newDocumentLabel.value.trim() || file.name,
    fileName: file.name,
    status: 'PENDING',
    note: '',
    required: false,
    custom: true,
  })
  newDocumentLabel.value = ''
  event.target.value = ''
}

watch(() => form.value.counterpartyKind, () => {
  // Changing Client/Vendor starts a new stage-2 flow and clears all dependent data.
  mainDocUploaded.value = false
  mainDocName.value = ''
  form.value.partnerName = ''
  form.value.picName = ''
  form.value.picTitle = ''
  form.value.picEmail = ''
  form.value.vendorCategory = ''
  form.value.vendorRegistration = ''
  form.value.consortiumLead = ''
  checklist.value = createChecklist()
  newDocumentLabel.value = ''
})

watch(() => form.value.requestType, () => {
  checklist.value = createChecklist()
})

function selectDepartment(department) {
  form.value.department = department
  const firstType = REQUEST_TYPES[department][0]
  form.value.requestType = firstType.label
  form.value.counterpartyKind = firstType.counterpartyKind
}

function selectRequestType(requestType) {
  const type = REQUEST_TYPES[form.value.department].find((item) => item.label === requestType)
  form.value.requestType = requestType
  form.value.counterpartyKind = type.counterpartyKind
}

function submitRequest() {
  if (!canSubmit.value) return
  // Backend generates the real Request ID (DESIGN.md §19) — this is a mock redirect.
  const request = createRequest({
    title: form.value.title,
    type: form.value.counterpartyKind,
    partner: form.value.partnerName,
    classification: form.value.department,
    requestKind: form.value.requestType,
    service: selectedRequest.value.service,
    documentCategory: form.value.documentCategory,
    mainDocument: isReviewRequest.value && mainDocUploaded.value ? { name: mainDocName.value } : null,
  })
  createValidationRequest(request, checklist.value)
  router.push('/requestor/requests')
}
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal', 'New Request']">
    <div class="flex items-center justify-between mb-2xl">
      <div>
        <span class="text-caption font-semibold text-brand-700 bg-brand-50 rounded-badge px-2.5 py-1">RQ-02 · REGISTRASI TERSTANDARISASI</span>
        <h1 class="mt-2 text-pagetitle text-gray-900">New Request</h1>
        <p class="mt-1 text-small text-gray-500">Complete the details and upload the required documents before submitting to Legal.</p>
      </div>
      <div class="shrink-0 rounded-full border-4 border-brand-100 h-16 w-16 flex items-center justify-center relative">
        <span class="text-bodystrong text-brand-700">{{ completion }}%</span>
      </div>
    </div>

    <form class="flex flex-col space-y-2xl" @submit.prevent="submitRequest">
      <!-- Section 1: Informasi Umum -->
      <section class="rounded-card border border-gray-200 bg-white shadow-card">
        <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200">
          <div>
            <p class="text-caption text-gray-500">1</p>
            <h2 class="text-cardtitle text-gray-900">Request Details</h2>
            <p class="text-small text-gray-500">Enter the document details, related party, and required files.</p>
          </div>
          <span class="text-caption font-semibold text-warning bg-warning-light rounded-badge px-2.5 py-1">Required</span>
        </div>
        <div class="p-2xl space-y-lg">
          <div>
            <label class="block text-small font-semibold text-gray-900 mb-1.5">Document Title *</label>
            <input v-model="form.title" type="text" maxlength="150" placeholder="cth. Draft Kontrak Jasa Pre-FEED — New Marine Facilities" class="w-full h-10 rounded-input border border-gray-200 px-3 text-body focus:border-brand-500" />
            <p class="mt-1 text-caption text-gray-500">Use a clear title. Maximum 150 characters.</p>
          </div>
          <div>
            <label class="block text-small font-semibold text-gray-900 mb-1.5">{{ partnerLabel }} *</label>
            <input v-model="form.partnerName" type="text" :placeholder="form.counterpartyKind === 'Client' ? 'cth. PT Nusantara Regas' : 'cth. PT Mitra Konstruksi'" class="w-full h-10 rounded-input border border-gray-200 px-3 text-body focus:border-brand-500" />
          </div>
          <div class="grid md:grid-cols-2 gap-lg">
            <div>
              <label class="block text-small font-semibold text-gray-900 mb-1.5">Unit *</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="h-10 rounded-input border text-small font-medium"
                  :class="form.department === 'Pengadaan' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700'"
                  @click="selectDepartment('Pengadaan')"
                >Pengadaan</button>
                <button
                  type="button"
                  class="h-10 rounded-input border text-small font-medium"
                  :class="form.department === 'Komersial' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700'"
                  @click="selectDepartment('Komersial')"
                >Komersial</button>
              </div>
              <p class="mt-1 text-caption text-gray-500">Pilih unit pengaju.</p>
            </div>
            <div>
              <label class="block text-small font-semibold text-gray-900 mb-1.5">Jenis Permintaan *</label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="requestType in REQUEST_TYPES[form.department]"
                  :key="requestType.label"
                  type="button"
                  class="h-10 rounded-input border text-small font-medium"
                  :class="form.requestType === requestType.label ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700'"
                  @click="selectRequestType(requestType.label)"
                >{{ requestType.label }}</button>
              </div>
              <p class="mt-1 text-caption text-gray-500">{{ serviceLabel }}.</p>
            </div>
          </div>

          <div class="rounded-input border border-brand-100 bg-brand-50/50 p-lg">
            <div class="flex items-start gap-3">
              <component :is="serviceIcon" class="h-5 w-5 shrink-0 text-brand-700 mt-0.5" />
              <div>
                <p class="text-bodystrong text-gray-900">Alur {{ serviceLabel }}</p>
                <ol class="mt-2 space-y-1 list-inside list-decimal text-small text-gray-700">
                  <li v-for="step in selectedRequest.flow" :key="step">{{ step }}</li>
                </ol>
                <p v-if="isConsinyeringRequest" class="mt-2 text-caption text-gray-500">Alur konsinyering ini digunakan sebagai alur sementara sampai SOP konsinyering ditetapkan.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- Section 3: Dokumen Utama (switched with the original Section 3) -->
      <section v-if="isReviewRequest" class="order-3 rounded-card border border-gray-200 bg-white shadow-card">
        <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200">
          <div>
            <p class="text-caption text-gray-500">3</p>
            <h2 class="text-cardtitle text-gray-900">Dokumen untuk Direview</h2>
            <p class="text-small text-gray-500">Unggah dokumen amandemen yang akan direview oleh Tim Legal.</p>
          </div>
        </div>
        <div class="p-2xl">
          <input ref="assignmentFileInput" type="file" accept=".pdf" class="hidden" @change="handleMainFile" />
          <div v-if="!mainDocUploaded" class="rounded-input border-2 border-dashed border-gray-200 p-3xl flex flex-col items-center text-center" @dragover.prevent @drop.prevent="handleMainDrop">
            <Upload class="h-6 w-6 text-gray-300 mb-2" />
            <p class="text-body text-gray-700">Drag a file here or choose one from your device</p>
            <p class="text-caption text-gray-500 mt-1">PDF only, maximum 10 MB</p>
            <Button type="button" variant="secondary" class="mt-lg" @click="openMainFilePicker">Choose File</Button>
          </div>
          <div v-else class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3">
            <div class="flex items-center gap-3 min-w-0">
              <FileText class="h-5 w-5 text-danger shrink-0" />
              <div class="min-w-0">
                <p class="text-bodystrong text-gray-900 truncate">{{ mainDocName }}</p>
                <p class="text-caption text-gray-500">Main document uploaded</p>
              </div>
            </div>
            <button type="button" class="text-gray-500 hover:text-danger" aria-label="Hapus file" @click="mainDocUploaded = false"><X class="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <!-- Legacy document block kept in source for reference; the visible block is above Data Mitra. -->
      <section v-if="false" class="rounded-card border border-gray-200 bg-white shadow-card">
        <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200">
          <div>
            <p class="text-caption text-gray-500">3</p>
            <h2 class="text-cardtitle text-gray-900">Dokumen Utama</h2>
            <p class="text-small text-gray-500">Naskah kontrak inti yang akan ditinjau dan dikomentari oleh Tim Legal.</p>
          </div>
        </div>
        <div class="p-2xl">
          <div v-if="!mainDocUploaded" class="rounded-input border-2 border-dashed border-gray-200 p-3xl flex flex-col items-center text-center">
            <Upload class="h-6 w-6 text-gray-300 mb-2" />
            <p class="text-body text-gray-700">Seret file ke sini atau pilih dari perangkat Anda</p>
            <p class="text-caption text-gray-500 mt-1">Format PDF, maksimal 10 MB</p>
            <Button type="button" variant="secondary" class="mt-lg" @click="mainDocUploaded = true">Pilih File</Button>
          </div>
          <div v-else class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3">
            <div class="flex items-center gap-3 min-w-0">
              <FileText class="h-5 w-5 text-danger shrink-0" />
              <div class="min-w-0">
                <p class="text-bodystrong text-gray-900 truncate">Draft_Kontrak_PreFEED_FSRU_Jabar_v1.2.pdf</p>
                <p class="text-caption text-gray-500">4.8 MB · 100% Terunggah (SHA-256 Valid) · Versi 1.2</p>
              </div>
            </div>
            <button type="button" class="text-gray-500 hover:text-danger" aria-label="Hapus file" @click="mainDocUploaded = false">
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <!-- Section 4: Checklist -->
      <section class="order-4 rounded-card border border-gray-200 bg-white shadow-card">
        <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200">
          <div>
            <p class="text-caption text-gray-500">{{ isReviewRequest ? 4 : 3 }}</p>
            <h2 class="text-cardtitle text-gray-900">Lampiran Wajib</h2>
            <p class="text-small text-gray-500">
              <template v-if="isDraftRequest">Lengkapi seluruh lampiran wajib agar Tim Legal dapat menyiapkan draf kontrak.</template>
              <template v-else>Lengkapi seluruh lampiran wajib sebelum mengirim permintaan review ke Tim Legal.</template>
            </p>
          </div>
          <span
            class="text-caption font-semibold rounded-badge px-2.5 py-1"
            :class="requiredDocumentsUploaded ? 'text-success bg-success-light' : 'text-gray-500 bg-gray-100'"
          >
            {{ checklist.filter(c => c.fileName).length }} / {{ checklist.length }} Uploaded
          </span>
        </div>
        <div class="p-2xl space-y-3">
          <div
            v-for="(item, i) in checklist"
            :key="item.id"
            class="flex flex-col gap-3 rounded-input border px-lg py-3 sm:flex-row sm:items-center sm:justify-between"
            :class="item.fileName ? 'border-success/40 bg-success-light/20' : 'border-gray-200'"
            @dragover.prevent
            @drop.prevent="handleChecklistDrop(item, $event)"
          >
            <input :id="`checklist-file-${item.id}`" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" class="hidden" @change="handleChecklistFile(item, $event)" />
            <div class="flex min-w-0 items-center gap-3">
              <CheckCircle2 v-if="item.fileName" class="h-5 w-5 shrink-0 text-success" />
              <FileText v-else class="h-5 w-5 shrink-0 text-gray-300" />
              <div class="min-w-0">
                <p class="text-body text-gray-900">{{ i + 1 }}. {{ item.label }}</p>
                <p class="text-caption" :class="item.fileName ? 'text-success' : 'text-gray-500'">
                  {{ item.fileName || (item.required ? 'Required' : 'Optional') }} · {{ item.fileName ? 'Menunggu validasi Legal' : 'Belum diunggah' }}
                </p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2 sm:pl-4">
              <Button type="button" variant="secondary" size="sm" @click="toggleChecklist(item)">
                {{ item.fileName ? 'Replace File' : 'Upload Document' }}
              </Button>
              <button v-if="!item.required" type="button" class="h-8 w-8 rounded-button text-gray-400 hover:bg-danger-light hover:text-danger" aria-label="Hapus dokumen dari checklist" @click="removeChecklist(item)">
                <X class="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 pt-2">
            <input v-model="newDocumentLabel" type="text" placeholder="Nama dokumen tambahan (opsional)" class="flex-1 h-9 rounded-input border border-gray-200 px-3 text-small focus:border-brand-500" />
            <input ref="additionalFileInput" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" class="hidden" @change="handleAdditionalFile" />
            <Button type="button" variant="secondary" size="sm" @click="openAdditionalFilePicker">
              <template #icon-left><Plus class="h-3.5 w-3.5" /></template>
              Add Supporting Document
            </Button>
          </div>
          <p class="text-caption text-gray-400">Supporting documents are optional and can be removed if not needed.</p>
        </div>
      </section>

      <div class="order-5 flex items-center justify-between rounded-card border border-gray-200 bg-white px-2xl py-lg shadow-card">
        <p class="text-caption text-gray-500">
          <span v-if="canSubmit">Semua lampiran wajib sudah lengkap. Request siap dikirim ke Tim Legal.</span>
          <span v-else>
            <template v-if="checklist.filter(c => c.required && !c.fileName).length">{{ checklist.filter(c => c.required && !c.fileName).length }} lampiran wajib masih kurang. Lengkapi seluruh lampiran sebelum mengirim request.</template>
            <template v-else>Lengkapi informasi request yang masih wajib diisi sebelum mengirim.</template>
          </span>
        </p>
        <div class="flex items-center gap-2">
          <Button type="button" variant="secondary" @click="router.push('/requestor/requests')">Cancel</Button>
          <Button type="button" variant="secondary">Save Draft</Button>
          <Button type="submit" variant="primary" :disabled="!canSubmit" title="Complete all required items first">
            Submit Request
          </Button>
        </div>
      </div>
    </form>
  </AppLayout>
</template>

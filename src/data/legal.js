import { reactive } from 'vue'
import { createRequiredDocumentChecklist } from './requiredDocuments'
import { createNextCycle, getActiveCycle } from './reviewCycles'
import { getRequestById } from './requests'

// Mock data standing in for the backend, scoped to the Team Legal role
// (DESIGN.md §25-44 Phase 1 Validation & Phase 2 Review). Values are
// illustrative only — real checklists, tasks, and timestamps come from Laravel.

// ---------------------------------------------------------------------------
// Phase 1 — Validation Queue (DESIGN.md §25-30)
// ---------------------------------------------------------------------------

export const VALIDATION_QUEUE = reactive([
  {
    id: 'REQ-2026-0035',
    status: 'VALIDATING',
    title: 'Vendor Supply Agreement — Valve & Metering Skid Automation Unit',
    type: 'Vendor',
    partner: 'PT Rekayasa Solusi Energi',
    classification: 'Pengadaan',
    requestor: { name: 'Budi Santoso', division: 'Commercial & Sales Division' },
    submittedAt: '2026-09-06T11:05:00',
    resubmission: false,
    checklist: createRequiredDocumentChecklist('Vendor', { complete: true }).map((document) => ({
      ...document,
      fileName: `${document.label.split(' ')[0]}.pdf`,
      decision: 'PENDING',
    })),
  },
  {
    id: 'REQ-2026-0044',
    status: 'VALIDATING',
    title: 'Perjanjian Kerjasama Distribusi LNG Retail — Kawasan Industri Batang',
    type: 'Client',
    partner: 'PT Sumber Energi Terpadu',
    classification: 'Komersial',
    requestor: { name: 'Ratna Kusuma', division: 'Business Development Division' },
    submittedAt: '2026-09-09T08:40:00',
    resubmission: false,
    checklist: createRequiredDocumentChecklist('Client', { complete: true }),
  },
  {
    id: 'REQ-2026-0048',
    status: 'VALIDATING',
    title: 'Addendum I — Perjanjian Sewa Tangki Timbun BBM Terminal Tanjung Priok',
    type: 'Vendor',
    partner: 'PT Pelabuhan Samudra Indah',
    classification: 'Pengadaan',
    requestor: { name: 'Budi Santoso', division: 'Commercial & Sales Division' },
    submittedAt: '2026-09-09T15:20:00',
    resubmission: true,
    priorRejectionNote: 'Surat Kuasa Direksi yang diunggah sudah kedaluwarsa. Mohon unggah versi yang masih berlaku.',
    checklist: createRequiredDocumentChecklist('Vendor', { complete: true }),
  },
])

export function getValidationById(id) {
  return VALIDATION_QUEUE.find((v) => v.id === id) || null
}

// Front-end mock for the handoff from Requestor to Legal validation.
export function createValidationRequest(request, checklist) {
  const required = createRequiredDocumentChecklist(request.type)
  if (!required.length || required.some((expected) => !checklist.some((document) => document.label === expected.label && String(document.fileName || '').trim())) || checklist.some((document) => document.required && !String(document.fileName || '').trim())) {
    throw new Error('Lengkapi seluruh dokumen wajib sebelum mengirim permohonan ke Legal.')
  }
  const validation = {
    id: request.id,
    status: 'VALIDATING',
    title: request.title,
    type: request.type,
    partner: request.partner,
    classification: request.classification,
    requestKind: request.requestKind,
    service: request.service,
    documentCategory: request.documentCategory,
    mainDocument: request.mainDocument,
    requestor: { name: 'Budi Santoso', division: 'Commercial & Sales Division' },
    submittedAt: request.submittedAt,
    resubmission: false,
    checklist: checklist.map((document) => ({
      ...document,
      complete: Boolean(document.fileName),
      decision: 'PENDING',
    })),
  }
  VALIDATION_QUEUE.unshift(validation)
  return validation
}

export function createReviewTaskFromValidation(validation, mode = 'self', collaborators = []) {
  const taskId = `${validation.id}-REVIEW`
  const existing = REVIEW_TASKS.find((task) => task.taskId === taskId)
  if (existing) return existing

  const now = new Date().toISOString()
  const task = {
    taskId,
    requestId: validation.id,
    title: validation.title,
    partner: validation.partner,
    classification: validation.classification,
    type: validation.type,
    requestKind: validation.requestKind,
    service: validation.service,
    documentCategory: validation.documentCategory,
    mainDocument: validation.mainDocument,
    attachments: validation.checklist.filter((document) => document.fileName).map((document) => ({ name: document.fileName })),
    requestor: validation.requestor,
    status: mode === 'collaborator' ? 'AWAITING_COLLABORATOR' : 'IN_PROGRESS',
    assignedAt: now,
    startedAt: mode === 'self' ? now : null,
    dueAt: null,
    needCollaborator: mode === 'collaborator',
    collaborators: mode === 'collaborator' ? collaborators.map((collaborator) => ({ ...collaborator, scope: collaborator.scopes.join(', '), assignedAt: now, submittedAt: null, status: 'OPEN' })) : [],
    reviewTable: [
      { no: 1, clause: 'Dokumen Utama', clauseContent: `Review dokumen utama: ${validation.title}.`, comment: '', status: 'OPEN', risk: 'MEDIUM' },
    ],
  }
  task.collaborator = task.collaborators[0] || null
  REVIEW_TASKS.unshift(task)
  return task
}

// ---------------------------------------------------------------------------
// Available collaborators for cross-functional review (DESIGN.md §38-39)
// ---------------------------------------------------------------------------

export const COLLABORATORS = [
  { id: 'usr-003', name: 'Dimas Suryo, S.E., Ak.', division: 'Tax & Finance Specialist', scopes: ['Klausul Komersial', 'Klausul Perpajakan'] },
  { id: 'usr-004', name: 'Sri Wulandari, S.T.', division: 'Technical Engineering Division', scopes: ['Klausul Teknis', 'Spesifikasi & Scope of Work'] },
  { id: 'usr-005', name: 'Rangga Pratama, CFE', division: 'Compliance & Risk Management', scopes: ['Klausul Kepatuhan', 'Manajemen Risiko'] },
]

// ---------------------------------------------------------------------------
// Phase 2 — Review Tasks (DESIGN.md §31-44)
// ---------------------------------------------------------------------------

export const REVIEW_TASKS = reactive([
  {
    taskId: 'RVW-2026-0042-01',
    requestId: 'REQ-2026-0042',
    cycleId: 'CYC-REQ-2026-0042-00',
    cycleNumber: 0,
    title: 'Draft Kontrak Jasa Pre-FEED — New Marine Facilities for New FSRU Jawa Barat',
    partner: 'PT Nusantara Regas',
    classification: 'Komersial',
    status: 'IN_PROGRESS',
    assignedAt: '2026-09-08T11:15:00',
    startedAt: '2026-09-08T14:00:00',
    dueAt: '2026-09-10T12:00:00',
    collaborator: { id: 'usr-003', name: 'Dimas Suryo, S.E., Ak.', division: 'Tax & Finance Specialist', scope: 'Klausul Komersial', assignedAt: '2026-09-08T14:10:00', submittedAt: null, status: 'IN_PROGRESS' },
    reviewTable: [
      {
        no: 1,
        reviewItemId: 'RVI-0042-101',
        clause: 'Pasal 8',
        clauseContent: 'Batasan Tanggung Jawab (Limitation of Liability) — pihak kedua bertanggung jawab penuh tanpa batas atas segala kerugian.',
        onReview: '',
        comment: 'Tambahkan liability cap maksimum 100% total nilai kontrak dan klausul pengecualian kerugian insidental/konsekuensial pihak ketiga.',
        status: 'REVISION',
        risk: 'HIGH',
        reviewerId: 'usr-002',
        reviewer: 'Ahmad Fauzi, S.H.',
        ownerRole: 'LEGAL',
        ownerName: 'Tim Legal (Ahmad Fauzi, S.H.)',
        decision: 'REJECTED',
        comments: [
          { id: 'c-042-101', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Mohon tinjau ulang klausul batasan tanggung jawab, idealnya disesuaikan dengan standar batas 100% nilai kontrak.', at: '2026-09-08T14:35:00', targetColumn: 'comment' },
          { id: 'c-042-102', author: 'Dimas Suryo, S.E., Ak.', role: 'Tax & Finance Specialist', text: 'Dari sisi komersial dan keuangan, persentase liability cap 100% dapat disetujui agar tidak menimbulkan kerugian finansial tak terbatas.', at: '2026-09-08T15:10:00', targetColumn: 'comment' },
          { id: 'c-042-103', author: 'Budi Santoso', role: 'Requestor', text: 'Catatan diterima, kami sudah negosiasikan dengan mitra PT Nusantara Regas.', at: '2026-09-09T09:20:00', targetColumn: 'onReview' },
        ],
      },
      {
        no: 2,
        reviewItemId: 'RVI-0042-102',
        clause: 'Pasal 9.4',
        clauseContent: 'Kepatuhan Perlindungan Data Pribadi — tidak diatur ketentuan turunan pemrosesan data pihak ketiga.',
        onReview: '',
        comment: 'Tambahkan addendum perlindungan data (DPA standard) pada lampiran kontrak sebelum penandatanganan.',
        status: 'OPEN',
        risk: 'MEDIUM',
        reviewerId: 'usr-002',
        reviewer: 'Ahmad Fauzi, S.H.',
        ownerRole: 'LEGAL',
        ownerName: 'Tim Legal (Ahmad Fauzi, S.H.)',
        decision: 'APPROVED',
        comments: [
          { id: 'c-042-201', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Pastikan klausul perlindungan data memuat kewajiban notifikasi kebocoran data maksimal 3x24 jam.', at: '2026-09-08T14:40:00', targetColumn: 'comment' },
          { id: 'c-042-202', author: 'Rangga Pratama, CFE', role: 'Compliance & Risk', text: 'Setuju, DPA standar harus disertakan sebagai lampiran tidak terpisahkan.', at: '2026-09-08T16:00:00', targetColumn: 'comment' },
        ],
      },
      {
        no: 3,
        reviewItemId: 'RVI-0042-103',
        clause: 'Pasal 14',
        clauseContent: 'Penyelesaian Sengketa (Arbitrase BANI) di Jakarta Selatan dengan hukum yang berlaku hukum Republik Indonesia.',
        onReview: '',
        comment: 'Disetujui dengan klausul tambahan kewajiban mediasi bipartit maksimal 30 (tiga puluh) hari kalender sebelum eskalasi ke BANI.',
        status: 'ACCEPTED',
        risk: 'LOW',
        reviewerId: 'usr-002',
        reviewer: 'Ahmad Fauzi, S.H.',
        ownerRole: 'LEGAL',
        ownerName: 'Tim Legal (Ahmad Fauzi, S.H.)',
        decision: 'APPROVED',
        comments: [
          { id: 'c-042-301', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Mekanisme mediasi 30 hari bipartit disepakati sebelum pendaftaran ke BANI.', at: '2026-09-08T14:45:00', targetColumn: 'comment' },
        ],
      },
      {
        no: 4,
        reviewItemId: 'RVI-0042-104',
        clause: 'Pasal 5',
        clauseContent: 'Struktur Harga & Mekanisme Eskalasi Biaya (Price Escalation) tahunan mengikuti indeks BPS.',
        onReview: '',
        comment: 'Formula eskalasi perlu dibatasi maksimum 7% per tahun agar sejalan dengan proyeksi anggaran komersial.',
        status: 'REVISION',
        risk: 'MEDIUM',
        reviewerId: 'usr-003',
        reviewer: 'Dimas Suryo, S.E., Ak.',
        ownerRole: 'COLLABORATOR',
        ownerName: 'Dimas Suryo, S.E., Ak. (Tax & Finance)',
        decision: 'REJECTED',
        comments: [
          { id: 'c-042-401', author: 'Dimas Suryo, S.E., Ak.', role: 'Tax & Finance Specialist', text: 'Batas maksimum eskalasi 7% penting untuk menjaga kepastian arus kas perusahaan.', at: '2026-09-08T15:15:00', targetColumn: 'comment' },
        ],
      },
      {
        no: 5,
        reviewItemId: 'RVI-0042-105',
        clause: 'Pasal 6',
        clauseContent: 'Termin Pembayaran (Payment Terms) 30 hari kalender sejak invoice diterbitkan.',
        onReview: '',
        comment: 'Disetujui, sudah sesuai standar kontrak komersial korporat.',
        status: 'ACCEPTED',
        risk: 'LOW',
        reviewerId: 'usr-003',
        reviewer: 'Dimas Suryo, S.E., Ak.',
        ownerRole: 'COLLABORATOR',
        ownerName: 'Dimas Suryo, S.E., Ak. (Tax & Finance)',
        decision: 'APPROVED',
        comments: [
          { id: 'c-042-501', author: 'Dimas Suryo, S.E., Ak.', role: 'Tax & Finance Specialist', text: 'Termin 30 hari standar dan aman untuk komersial.', at: '2026-09-08T15:30:00', targetColumn: 'comment' },
        ],
      },
      {
        no: 6,
        reviewItemId: 'RVI-0042-106',
        clause: 'Pasal 11',
        clauseContent: 'Jaminan & Asuransi Operational Risk Terminal Regasifikasi FSRU.',
        onReview: '',
        comment: 'Wajib menyertakan klausul Joint Named Insured atas nama PT Nusantara Regas.',
        status: 'REVISION',
        risk: 'HIGH',
        reviewerId: 'usr-005',
        reviewer: 'Rangga Pratama, CFE',
        ownerRole: 'COLLABORATOR',
        ownerName: 'Rangga Pratama, CFE (Compliance & Risk)',
        decision: 'REJECTED',
        comments: [
          { id: 'c-042-601', author: 'Rangga Pratama, CFE', role: 'Compliance & Risk', text: 'Klausul asuransi perlu revisi untuk menyertakan Joint Named Insured wajib.', at: '2026-09-08T16:20:00', targetColumn: 'comment' },
        ],
      },
      {
        no: 7,
        reviewItemId: 'RVI-0042-107',
        clause: 'Pasal 15',
        clauseContent: 'Spesifikasi Teknis & Standard Operating Procedure (SOP) Offtaking Gas.',
        onReview: '',
        comment: 'Disetujui, spesifikasi teknis pressure dan temperature rate sudah sesuai standar Engineering.',
        status: 'ACCEPTED',
        risk: 'LOW',
        reviewerId: 'usr-004',
        reviewer: 'Sri Wulandari, S.T.',
        ownerRole: 'COLLABORATOR',
        ownerName: 'Sri Wulandari, S.T. (Technical Engineering)',
        decision: 'APPROVED',
        comments: [
          { id: 'c-042-701', author: 'Sri Wulandari, S.T.', role: 'Technical Engineering', text: 'Klausul teknis SOP sudah memenuhi syarat keselamatan operasional.', at: '2026-09-08T16:45:00', targetColumn: 'comment' },
        ],
      },
    ],
  },
  {
    taskId: 'RVW-2026-0046-01',
    requestId: 'REQ-2026-0046',
    title: 'Perjanjian Kredit Modal Kerja Sindikasi — Ekspansi Terminal Regasifikasi',
    partner: 'Konsorsium Bank BUMN',
    classification: 'Komersial',
    status: 'OPEN',
    assignedAt: '2026-09-09T09:30:00',
    startedAt: null,
    dueAt: '2026-09-11T09:30:00',
    needCollaborator: false,
    collaborator: null,
    reviewTable: [
      { no: 1, clause: 'Pasal 5', clauseContent: 'Ketentuan Covenant Keuangan (Financial Covenant) & rasio kecukupan modal minimum.', comment: '', status: 'OPEN', risk: 'MEDIUM' },
      { no: 2, clause: 'Pasal 11', clauseContent: 'Jaminan Fidusia atas Aset Terminal & Peralatan Regasifikasi.', comment: '', status: 'OPEN', risk: 'HIGH' },
    ],
  },
  {
    taskId: 'RVW-2026-0049-01',
    requestId: 'REQ-2026-0049',
    title: 'Perjanjian Jual Beli Gas Bumi — Alokasi Industri Kawasan Cikarang',
    partner: 'PT Krakatau Industrial Estate',
    classification: 'Komersial',
    type: 'Client',
    requestKind: 'Amandemen Client',
    documentCategory: 'Digital Document',
    mainDocument: { name: 'Perjanjian_Jual_Beli_Gas_Bumi_Cikarang.pdf' },
    attachments: [{ name: 'Lampiran Pendukung.pdf' }],
    requestor: { name: 'Budi Santoso', division: 'Commercial & Sales Division' },
    status: 'AWAITING_COLLABORATOR',
    assignedAt: '2026-09-07T10:00:00',
    startedAt: '2026-09-07T13:20:00',
    dueAt: '2026-09-10T10:00:00',
    needCollaborator: true,
    collaborator: { id: 'usr-004', name: 'Sri Wulandari, S.T.', division: 'Technical Engineering Division', scope: 'Klausul Teknis', assignedAt: '2026-09-08T09:00:00', submittedAt: null, status: 'IN_PROGRESS' },
    reviewTable: [
      { no: 1, clause: 'Pasal 3', clauseContent: '', comment: 'Menunggu hasil telaah teknis dari Engineering Division.', status: 'OPEN', risk: 'MEDIUM', reviewerId: 'usr-004', reviewer: 'Sri Wulandari, S.T.', ownerRole: 'COLLABORATOR' },
    ],
  },
  {
    taskId: 'RVW-2026-0050-01',
    requestId: 'REQ-2026-0050',
    title: 'Non-Disclosure Agreement (NDA) — Studi Kelayakan Hidrogen Hijau',
    partner: 'Sumitomo Green Energy Corp.',
    classification: 'Komersial',
    status: 'IN_PROGRESS',
    assignedAt: '2026-09-09T13:00:00',
    startedAt: '2026-09-09T13:45:00',
    dueAt: '2026-09-10T13:00:00',
    needCollaborator: false,
    collaborator: null,
    reviewTable: [
      { no: 1, clause: 'Pasal 2', clauseContent: 'Ruang Lingkup Informasi Rahasia (Confidential Information) selama masa studi kelayakan.', comment: 'Disetujui, sudah sesuai template standar NDA korporat.', status: 'ACCEPTED', risk: 'LOW' },
      { no: 2, clause: 'Pasal 6', clauseContent: 'Jangka Waktu Kerahasiaan (Term of Confidentiality) 5 (lima) tahun sejak penandatanganan.', comment: '', status: 'OPEN', risk: 'LOW' },
    ],
  },
])

export function getReviewTaskById(taskId) {
  return REVIEW_TASKS.find((t) => t.taskId === taskId) || null
}

// Called only after a cycle has been closed as Revision Required.  It creates a
// task for the same Request; the cycle service carries only unresolved items.
export function createRevisionReviewTask(requestId, actor, revisionDocument, revisionFile = null) {
  const request = getRequestById(requestId)
  const previousTask = REVIEW_TASKS.find((task) => task.requestId === requestId) || (request && {
    requestId, title: request.title, partner: request.partner, classification: request.classification,
    needCollaborator: false, collaborator: null, collaborators: [],
  })
  const cycle = createNextCycle(requestId, actor, revisionDocument, revisionFile)
  if (!cycle || !previousTask) return null
  const task = {
    ...previousTask,
    taskId: `RVW-${requestId.replace('REQ-', '')}-C${cycle.cycleNumber}`,
    cycleId: cycle.cycleId,
    cycleNumber: cycle.cycleNumber,
    status: 'OPEN', assignedAt: cycle.startedAt, startedAt: null, dueAt: null,
    reviewTable: cycle.items,
  }
  REVIEW_TASKS.unshift(task)
  if (request) { request.status = 'IN_REVIEW'; request.updatedAt = cycle.startedAt }
  return task
}

export function getTaskActiveCycle(task) { return task?.cycleId ? getActiveCycle(task.requestId) : getActiveCycle(task?.requestId) }

export const REVIEW_STATUS_CONFIG = {
  OPEN: { label: 'Belum Dimulai', tone: 'gray' },
  IN_PROGRESS: { label: 'Sedang Ditelaah', tone: 'warning' },
  AWAITING_COLLABORATOR: { label: 'Menunggu Kolaborator', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
}

export const ROW_STATUS_CONFIG = {
  OPEN: { label: 'Open', tone: 'gray' },
  IN_REVIEW: { label: 'In Review', tone: 'warning' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  COMMENTED: { label: 'Commented', tone: 'info' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REVISION: { label: 'Revision', tone: 'danger' },
}

// ---------------------------------------------------------------------------
// Dashboard summary (DESIGN.md §16, role-scoped to Team Legal)
// ---------------------------------------------------------------------------

export const LEGAL_SUMMARY = {
  pendingValidation: VALIDATION_QUEUE.length,
  openReviewTasks: REVIEW_TASKS.filter((t) => t.status !== 'COMPLETED').length,
  awaitingCollaborator: REVIEW_TASKS.filter((t) => t.status === 'AWAITING_COLLABORATOR').length,
  completedThisMonth: 12,
  avgValidationTime: '4.2 Jam',
}

// ---------------------------------------------------------------------------
// Activity / Audit trail (DESIGN.md §60-62, scoped to items Team Legal touched)
// ---------------------------------------------------------------------------

export const LEGAL_ACTIVITY = [
  { id: 1, at: '2026-09-09T15:20:00', actor: 'Ahmad Fauzi, S.H.', action: 'Menerima pengajuan ulang', target: 'REQ-2026-0048', detail: 'Requestor mengunggah Surat Kuasa Direksi yang masih berlaku sesuai catatan penolakan sebelumnya.' },
  { id: 2, at: '2026-09-09T13:45:00', actor: 'Ahmad Fauzi, S.H.', action: 'Memulai telaah hukum', target: 'REQ-2026-0050', detail: 'Review NDA studi kelayakan hidrogen hijau dimulai.' },
  { id: 3, at: '2026-09-08T14:10:00', actor: 'Ahmad Fauzi, S.H.', action: 'Menugaskan kolaborator', target: 'REQ-2026-0042', detail: 'Dimas Suryo (Tax & Finance) ditugaskan untuk lingkup Klausul Komersial.' },
  { id: 4, at: '2026-09-08T11:15:00', actor: 'Ahmad Fauzi, S.H.', action: 'Memvalidasi dokumen', target: 'REQ-2026-0042', detail: 'Checklist syarat formil lengkap. Status berubah menjadi Validated dan form dikunci.' },
  { id: 5, at: '2026-09-07T14:20:00', actor: 'Ahmad Fauzi, S.H.', action: 'Menolak pengajuan', target: 'REQ-2026-0038', detail: 'Seluruh lampiran telah diunggah, tetapi Surat Kuasa Direksi sudah kedaluwarsa dan perlu diperbarui.' },
  { id: 6, at: '2026-09-03T11:42:00', actor: 'Ahmad Fauzi, S.H.', action: 'Menyelesaikan telaah hukum', target: 'REQ-2026-0029', detail: 'Review Addendum III Kontrak Transpor Gas Bumi selesai dan dikembalikan ke Requestor.' },
]

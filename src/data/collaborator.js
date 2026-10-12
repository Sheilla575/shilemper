// Mock data standing in for the backend, scoped to the Collaborator role
// (DESIGN.md §40-42, §82). A collaborator only ever sees the request/document
// metadata and review scope relevant to their assignment — never the full
// Legal review table or other reviewers' clauses.

export const COLLAB_TASK_STATUS = {
  ASSIGNED: { label: 'Belum Dimulai', tone: 'gray' },
  IN_PROGRESS: { label: 'Sedang Ditelaah', tone: 'warning' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
}

export const ROW_STATUS_CONFIG = {
  OPEN: { label: 'Open', tone: 'gray' },
  COMMENTED: { label: 'Commented', tone: 'info' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REVISION: { label: 'Revision', tone: 'danger' },
}

// Tasks assigned to the logged-in collaborator (mock user: Dimas Suryo, S.E., Ak. —
// Tax & Finance Specialist, USERS.collaborator in data/users.js).
export const COLLAB_TASKS = [
  {
    taskId: 'RVW-2026-0042-01',
    requestId: 'REQ-2026-0042',
    title: 'Draft Kontrak Jasa Pre-FEED — New Marine Facilities for New FSRU Jawa Barat',
    partner: 'PT Nusantara Regas',
    classification: 'Komersial',
    scope: 'Klausul Komersial',
    status: 'IN_PROGRESS',
    assignedBy: 'Ahmad Fauzi, S.H.',
    assignedAt: '2026-09-08T14:10:00',
    startedAt: '2026-09-08T15:00:00',
    dueAt: '2026-09-10T10:00:00',
    submittedAt: null,
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
    taskId: 'RVW-2026-0044-01',
    requestId: 'REQ-2026-0044',
    title: 'Perjanjian Kerjasama Distribusi LNG Retail — Kawasan Industri Batang',
    partner: 'PT Sumber Energi Terpadu',
    classification: 'Komersial',
    scope: 'Klausul Perpajakan',
    status: 'ASSIGNED',
    assignedBy: 'Ahmad Fauzi, S.H.',
    assignedAt: '2026-09-09T16:00:00',
    startedAt: null,
    dueAt: '2026-09-11T16:00:00',
    submittedAt: null,
    reviewTable: [
      { no: 1, clause: 'Pasal 10', clauseContent: 'Kewajiban Pemotongan & Penyetoran PPh Pasal 23 atas jasa distribusi.', comment: '', status: 'OPEN', risk: 'MEDIUM' },
      { no: 2, clause: 'Pasal 12', clauseContent: 'Tanggung Jawab PPN atas Penyerahan Barang Kena Pajak (LNG) ke titik distribusi retail.', comment: '', status: 'OPEN', risk: 'LOW' },
    ],
  },
  {
    taskId: 'RVW-2026-0029-01',
    requestId: 'REQ-2026-0029',
    title: 'Addendum III — Kontrak Transpor Gas Bumi Subang - Cirebon Pipeline',
    partner: 'PT Pertamina Gas',
    classification: 'Komersial',
    scope: 'Klausul Komersial & Perpajakan',
    status: 'COMPLETED',
    assignedBy: 'Ahmad Fauzi, S.H.',
    assignedAt: '2026-09-01T13:00:00',
    startedAt: '2026-09-01T14:00:00',
    dueAt: '2026-09-03T13:00:00',
    submittedAt: '2026-09-02T16:30:00',
    reviewTable: [
      { no: 1, clause: 'Pasal 4', clauseContent: 'Penyesuaian Tarif Transportasi Gas (Transportation Tariff Adjustment) mengikuti regulasi BPH Migas.', comment: 'Disetujui, konsisten dengan ketentuan tarif acuan BPH Migas terbaru.', status: 'ACCEPTED', risk: 'LOW' },
      { no: 2, clause: 'Pasal 9', clauseContent: 'Kewajiban Perpajakan atas Jasa Transportasi Lintas Wilayah (PPN & PPh Badan).', comment: 'Sudah sesuai ketentuan perpajakan yang berlaku, tidak ada catatan tambahan.', status: 'ACCEPTED', risk: 'LOW' },
    ],
  },
]

export function getCollabTaskById(taskId) {
  return COLLAB_TASKS.find((t) => t.taskId === taskId) || null
}

export const COLLAB_SUMMARY = {
  assigned: COLLAB_TASKS.filter((t) => t.status === 'ASSIGNED').length,
  inProgress: COLLAB_TASKS.filter((t) => t.status === 'IN_PROGRESS').length,
  completedThisMonth: COLLAB_TASKS.filter((t) => t.status === 'COMPLETED').length,
}

// Activity / history entries scoped to this collaborator's own submissions
// (DESIGN.md §60-62 — visible extent limited to "assigned" per Role Permission Matrix §65).
export const COLLAB_ACTIVITY = [
  { id: 1, at: '2026-09-09T16:00:00', action: 'Menerima penugasan review', target: 'REQ-2026-0044', detail: 'Ditugaskan oleh Ahmad Fauzi, S.H. untuk lingkup Klausul Perpajakan.' },
  { id: 2, at: '2026-09-08T15:00:00', action: 'Memulai review', target: 'REQ-2026-0042', detail: 'Mulai menelaah klausul komersial: struktur harga, termin pembayaran, dan denda keterlambatan.' },
  { id: 3, at: '2026-09-02T16:30:00', action: 'Mengirim hasil review', target: 'REQ-2026-0029', detail: 'Hasil telaah Klausul Komersial & Perpajakan dikirim ke Ahmad Fauzi, S.H. — seluruh baris Accepted.' },
  { id: 4, at: '2026-09-01T14:00:00', action: 'Memulai review', target: 'REQ-2026-0029', detail: 'Mulai menelaah klausul tarif transportasi dan kewajiban perpajakan.' },
]

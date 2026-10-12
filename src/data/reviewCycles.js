import { reactive } from 'vue'

// Cycle is the immutable container for a single round of review.  In production
// these records map directly to review_cycles, review_items and audit_logs.
export const REVIEW_CYCLES = reactive([
  {
    cycleId: 'CYC-REQ-2026-0052-00', requestId: 'REQ-2026-0052', cycleNumber: 0,
    status: 'REVISION_REQUIRED', startedAt: '2026-09-10T11:00:00', completedAt: '2026-09-11T14:30:00',
    createdBy: 'usr-002', completedBy: 'usr-002', previousCycleId: null,
    revisionDocument: 'Draft_Kontrak_PreFEED_FSRU_v1.0.pdf',
    items: [
      { reviewItemId: 'RVI-0052-001', clause: 'Pasal 8', clauseContent: 'Batasan Tanggung Jawab (Limitation of Liability).', reviewNote: 'Tambahkan liability cap maksimum 100% nilai kontrak dan pengecualian kerugian konsekuensial.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-11T13:20:00', updatedAt: '2026-09-11T14:30:00', resolvedAt: null, resolvedBy: null, risk: 'HIGH' },
      { reviewItemId: 'RVI-0052-002', clause: 'Pasal 9.4', clauseContent: 'Kepatuhan Perlindungan Data Pribadi.', reviewNote: 'DPA standard perlu ditambahkan pada lampiran kontrak.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-11T13:45:00', updatedAt: '2026-09-11T14:30:00', resolvedAt: null, resolvedBy: null, risk: 'MEDIUM' },
      { reviewItemId: 'RVI-0052-003', clause: 'Pasal 14', clauseContent: 'Penyelesaian Sengketa.', reviewNote: 'Mekanisme mediasi sudah sesuai.', status: 'RESOLVED', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-11T14:00:00', updatedAt: '2026-09-11T14:20:00', resolvedAt: '2026-09-11T14:20:00', resolvedBy: 'usr-002', risk: 'LOW' },
    ],
  },
  // Kondisi contoh setelah Requestor mengunggah revisi atas hasil Cycle 0.
  // Saat terhubung ke API, record ini dibuat oleh createNextCycle().
  {
    cycleId: 'CYC-REQ-2026-0052-01', requestId: 'REQ-2026-0052', cycleNumber: 1,
    status: 'ACTIVE', startedAt: '2026-09-14T09:00:00', completedAt: null,
    createdBy: 'usr-003', completedBy: null, previousCycleId: 'CYC-REQ-2026-0052-00',
    revisionDocument: 'Draft_Kontrak_PreFEED_FSRU_v1.1_Revisi_Requestor.pdf',
    items: [
      { reviewItemId: 'RVI-0052-101', carriedFromItemId: 'RVI-0052-001', clause: 'Pasal 8', clauseContent: 'Batasan Tanggung Jawab (Limitation of Liability).', reviewNote: 'Tambahkan liability cap maksimum 100% nilai kontrak dan pengecualian kerugian konsekuensial.', onReview: 'Liability cap telah ditambahkan pada Pasal 8.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-14T09:00:00', updatedAt: '2026-09-14T09:00:00', resolvedAt: null, resolvedBy: null, risk: 'HIGH' },
      { reviewItemId: 'RVI-0052-102', carriedFromItemId: 'RVI-0052-002', clause: 'Pasal 9.4', clauseContent: 'Kepatuhan Perlindungan Data Pribadi.', reviewNote: 'DPA standard perlu ditambahkan pada lampiran kontrak.', onReview: 'Lampiran DPA telah dilengkapi untuk ditelaah kembali.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-14T09:00:00', updatedAt: '2026-09-14T09:00:00', resolvedAt: null, resolvedBy: null, risk: 'MEDIUM' },
    ],
  },
  {
    cycleId: 'CYC-REQ-2026-0042-00', requestId: 'REQ-2026-0042', cycleNumber: 0,
    status: 'REVISION_REQUIRED', startedAt: '2026-09-08T14:00:00', completedAt: '2026-09-09T15:30:00',
    createdBy: 'usr-001', completedBy: 'usr-002', previousCycleId: null,
    revisionDocument: 'Draft_Kontrak_PreFEED_FSRU_v1.2.pdf',
    items: [
      { reviewItemId: 'RVI-0042-001', clause: 'Pasal 8', clauseContent: 'Batasan Tanggung Jawab (Limitation of Liability).', reviewNote: 'Tambahkan liability cap maksimum 100% total nilai kontrak dan pengecualian kerugian insidental.', status: 'OPEN', reviewerId: 'usr-001', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-08T14:32:00', updatedAt: '2026-09-08T14:32:00', resolvedAt: null, resolvedBy: null, risk: 'HIGH', comments: [{ id: 'c-cyc0-101', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Catatan awal pada Cycle 0: Batasan tanggung jawab belum memiliki batas maksimum yang jelas.', at: '2026-09-08T14:32:00' }, { id: 'c-cyc0-102', author: 'Budi Santoso', role: 'Requestor', text: 'Permintaan revisi dikirimkan ke pihak vendor.', at: '2026-09-09T10:15:00' }] },
      { reviewItemId: 'RVI-0042-002', clause: 'Pasal 9.4', clauseContent: 'Kepatuhan Perlindungan Data Pribadi.', reviewNote: 'Tambahkan addendum perlindungan data (DPA standard) sebelum penandatanganan.', status: 'OPEN', reviewerId: 'usr-001', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-08T14:35:00', updatedAt: '2026-09-08T14:35:00', resolvedAt: null, resolvedBy: null, risk: 'MEDIUM', comments: [{ id: 'c-cyc0-201', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Cycle 0: DPA wajib dilampirkan.', at: '2026-09-08T14:35:00' }] },
      { reviewItemId: 'RVI-0042-003', clause: 'Pasal 14', clauseContent: 'Penyelesaian Sengketa (Arbitrase BANI).', reviewNote: 'Klausul mediasi bipartit telah tercakup.', status: 'RESOLVED', reviewerId: 'usr-001', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-08T14:38:00', updatedAt: '2026-09-08T15:00:00', resolvedAt: '2026-09-08T15:00:00', resolvedBy: 'usr-001', risk: 'LOW', comments: [{ id: 'c-cyc0-301', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Klausul sengketa sudah sesuai pada Cycle 0.', at: '2026-09-08T15:00:00' }] },
    ],
  },
  {
    cycleId: 'CYC-REQ-2026-0042-01', requestId: 'REQ-2026-0042', cycleNumber: 1,
    status: 'REVISION_REQUIRED', startedAt: '2026-09-11T09:00:00', completedAt: '2026-09-12T16:00:00',
    createdBy: 'usr-003', completedBy: 'usr-002', previousCycleId: 'CYC-REQ-2026-0042-00',
    revisionDocument: 'Draft_Kontrak_PreFEED_FSRU_v1.3_Revisi_Requestor.pdf',
    items: [
      { reviewItemId: 'RVI-0042-101', carriedFromItemId: 'RVI-0042-001', clause: 'Pasal 8', clauseContent: 'Batasan Tanggung Jawab (Limitation of Liability).', reviewNote: 'Perjelas pengecualian kerugian konsekuensial dan pihak ketiga.', onReview: 'Klausul telah diperbarui mengikuti hasil negosiasi dengan mitra.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-11T09:00:00', updatedAt: '2026-09-12T16:00:00', resolvedAt: null, resolvedBy: null, risk: 'HIGH', comments: [{ id: 'c-cyc1-101', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Cycle 1: Mohon penegasan mengenai perkecualian kerugian konsekuensial.', at: '2026-09-11T09:30:00' }, { id: 'c-cyc1-102', author: 'Dimas Suryo, S.E., Ak.', role: 'Tax & Finance Specialist', text: 'Hasil tinjauan komersial sudah konsisten.', at: '2026-09-11T14:00:00' }] },
      { reviewItemId: 'RVI-0042-102', carriedFromItemId: 'RVI-0042-002', clause: 'Pasal 9.4', clauseContent: 'Kepatuhan Perlindungan Data Pribadi.', reviewNote: 'Pastikan DPA menyebutkan mekanisme audit dan notifikasi insiden.', onReview: 'DPA direvisi dan dilampirkan pada kontrak.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-11T09:00:00', updatedAt: '2026-09-12T16:00:00', resolvedAt: null, resolvedBy: null, risk: 'MEDIUM', comments: [{ id: 'c-cyc1-201', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Cycle 1: Audit notifikasi insiden disetujui.', at: '2026-09-11T10:00:00' }] },
    ],
  },
  {
    cycleId: 'CYC-REQ-2026-0042-02', requestId: 'REQ-2026-0042', cycleNumber: 2,
    status: 'ACTIVE', startedAt: '2026-09-15T09:00:00', completedAt: null,
    createdBy: 'usr-003', completedBy: null, previousCycleId: 'CYC-REQ-2026-0042-01',
    revisionDocument: 'Draft_Kontrak_PreFEED_FSRU_v1.4_Revisi_Requestor.pdf',
    items: [
      { reviewItemId: 'RVI-0042-201', carriedFromItemId: 'RVI-0042-101', clause: 'Pasal 8', clauseContent: 'Batasan Tanggung Jawab (Limitation of Liability).', reviewNote: 'Konfirmasi akhir atas pengecualian kerugian konsekuensial dan pihak ketiga.', onReview: 'Mohon telaah akhir atas redaksi revisi v1.4.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-15T09:00:00', updatedAt: '2026-09-15T09:00:00', resolvedAt: null, resolvedBy: null, risk: 'HIGH', comments: [{ id: 'c-cyc2-101', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Cycle 2 (Aktif): Redaksi v1.4 sedang diulas secara final.', at: '2026-09-15T09:15:00' }] },
      { reviewItemId: 'RVI-0042-202', carriedFromItemId: 'RVI-0042-102', clause: 'Pasal 9.4', clauseContent: 'Kepatuhan Perlindungan Data Pribadi.', reviewNote: 'Pastikan lampiran DPA final sudah konsisten dengan Pasal 9.4.', onReview: 'DPA final telah diselaraskan dalam revisi v1.4.', status: 'OPEN', reviewerId: 'usr-002', reviewer: 'Ahmad Fauzi, S.H.', createdAt: '2026-09-15T09:00:00', updatedAt: '2026-09-15T09:00:00', resolvedAt: null, resolvedBy: null, risk: 'MEDIUM', comments: [{ id: 'c-cyc2-201', author: 'Ahmad Fauzi, S.H.', role: 'Tim Legal', text: 'Cycle 2 (Aktif): Lampiran DPA final telah diperiksa.', at: '2026-09-15T09:20:00' }] },
    ],
  },
])

export const REVIEW_AUDIT_TRAIL = reactive([
  { id: 'AUD-CYC-001', at: '2026-09-08T14:00:00', actor: 'Ahmad Fauzi, S.H.', action: 'Cycle 0 dibuat', requestId: 'REQ-2026-0042', cycle: 0, reviewItem: null, oldValue: null, newValue: 'ACTIVE', description: 'Review legal awal dimulai untuk dokumen v1.2.' },
  { id: 'AUD-CYC-002', at: '2026-09-08T15:00:00', actor: 'Ahmad Fauzi, S.H.', action: 'Issue diselesaikan', requestId: 'REQ-2026-0042', cycle: 0, reviewItem: 'RVI-0042-003', oldValue: 'OPEN', newValue: 'RESOLVED', description: 'Pasal 14 diselesaikan pada Cycle 0.' },
])

const now = () => new Date().toISOString()
const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
export const unresolved = (item) => item.status !== 'RESOLVED'

export function getCyclesByRequest(requestId) {
  return REVIEW_CYCLES.filter((cycle) => cycle.requestId === requestId).sort((a, b) => a.cycleNumber - b.cycleNumber)
}
export function getActiveCycle(requestId) { return getCyclesByRequest(requestId).find((cycle) => cycle.status === 'ACTIVE') || null }
export function getCycleById(cycleId) { return REVIEW_CYCLES.find((cycle) => cycle.cycleId === cycleId) || null }
export function audit(entry) { REVIEW_AUDIT_TRAIL.unshift({ id: nextId('AUD'), at: now(), ...entry }) }

export function createNextCycle(requestId, actor, revisionDocument = 'Dokumen revisi terbaru', revisionFile = null) {
  const previous = getActiveCycle(requestId) || getCyclesByRequest(requestId).at(-1)
  if (!previous) return null
  if (getActiveCycle(requestId) && previous.status === 'ACTIVE') return null
  const cycleNumber = previous.cycleNumber + 1
  const createdAt = now()
  const carried = previous.items.filter(unresolved).map((item) => ({
    ...item, reviewItemId: nextId('RVI'), status: 'OPEN', createdAt, updatedAt: createdAt,
    resolvedAt: null, resolvedBy: null, carriedFromItemId: item.reviewItemId,
  }))
  const cycle = { cycleId: `CYC-${requestId}-${String(cycleNumber).padStart(2, '0')}`, requestId, cycleNumber, status: 'ACTIVE', startedAt: createdAt, completedAt: null, createdBy: actor.id, completedBy: null, previousCycleId: previous.cycleId, revisionDocument, documentUrl: revisionFile ? URL.createObjectURL(revisionFile) : null, items: carried }
  REVIEW_CYCLES.push(cycle)
  audit({ actor: actor.name, action: `Cycle ${cycleNumber} dibuat`, requestId, cycle: cycleNumber, reviewItem: null, oldValue: previous.status, newValue: 'ACTIVE', description: `${carried.length} issue yang belum selesai dibawa dari Cycle ${previous.cycleNumber}; issue resolved tetap menjadi history.` })
  carried.forEach((item) => audit({ actor: actor.name, action: 'Issue dibawa ke cycle berikutnya', requestId, cycle: cycleNumber, reviewItem: item.reviewItemId, oldValue: 'OPEN', newValue: 'OPEN', description: `${item.clause} berasal dari issue ${item.carriedFromItemId}.` }))
  return cycle
}

export function completeCycle(cycle, actor) {
  const pending = cycle.items.filter(unresolved)
  const completedAt = now()
  cycle.status = pending.length ? 'REVISION_REQUIRED' : 'COMPLETED'
  cycle.completedAt = completedAt
  cycle.completedBy = actor.id
  audit({ actor: actor.name, action: pending.length ? 'Revisi diminta' : 'Cycle diselesaikan', requestId: cycle.requestId, cycle: cycle.cycleNumber, reviewItem: null, oldValue: 'ACTIVE', newValue: cycle.status, description: pending.length ? `${pending.length} issue masih aktif dan menunggu revisi Requestor.` : 'Seluruh issue telah diselesaikan.' })
  return pending.length === 0
}

export function updateReviewItem(item, actor, status) {
  const oldValue = item.status
  item.status = status
  item.updatedAt = now()
  if (status === 'RESOLVED') { item.resolvedAt = item.updatedAt; item.resolvedBy = actor.id }
  else { item.resolvedAt = null; item.resolvedBy = null }
  if (oldValue !== status) audit({ actor: actor.name, action: 'Status issue diubah', requestId: getCycleByItem(item)?.requestId, cycle: getCycleByItem(item)?.cycleNumber, reviewItem: item.reviewItemId, oldValue, newValue: status, description: `${item.clause}: ${oldValue} menjadi ${status}.` })
}
function getCycleByItem(item) { return REVIEW_CYCLES.find((cycle) => cycle.items.includes(item)) }

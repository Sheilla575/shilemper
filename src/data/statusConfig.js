// Central status model — mirrors DESIGN.md §63 Status Model
// Every status maps to a semantic color pair (bg/text) and an Indonesian label,
// so state is always readable without relying on color alone.

export const STATUS = {
  DRAFT: { label: 'Draft', tone: 'gray' },
  SUBMITTED: { label: 'Diajukan', tone: 'info' },
  VALIDATING: { label: 'Menunggu Validasi', tone: 'warning' },
  RETURNED: { label: 'Dikembalikan', tone: 'danger' },
  RESUBMITTED: { label: 'Diajukan Ulang', tone: 'info' },
  VALIDATED: { label: 'Tervalidasi', tone: 'success' },
  IN_REVIEW: { label: 'In Review', tone: 'info' },
  REVIEW_COMPLETED: { label: 'Siap Tanda Tangan', tone: 'success' },
  RETURNED_FOR_REVISION: { label: 'Perlu Revisi', tone: 'warning' },
  FINALIZED: { label: 'Finalized', tone: 'success' },
  DISTRIBUTED: { label: 'Distributed', tone: 'info' },
  COMPLETED: { label: 'Closed / Finalized', tone: 'gray-strong' },
}

export const TASK_STATUS = {
  OPEN: { label: 'Open', tone: 'gray' },
  ASSIGNED: { label: 'Assigned', tone: 'info' },
  IN_PROGRESS: { label: 'Sedang Ditelaah', tone: 'warning' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
  RETURNED: { label: 'Dikembalikan', tone: 'danger' },
  CANCELLED: { label: 'Dibatalkan', tone: 'gray' },
}

// Tailwind class pairs per tone. Badge component consumes this.
export const TONE_CLASSES = {
  gray: 'bg-gray-100 text-gray-700',
  'gray-strong': 'bg-gray-200 text-gray-900',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
}

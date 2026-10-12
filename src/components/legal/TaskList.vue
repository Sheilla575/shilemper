<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ClipboardCheck, Eye, FileSearch, RotateCcw, UserRound } from 'lucide-vue-next'
import { REVIEW_TASKS, REVIEW_STATUS_CONFIG, VALIDATION_QUEUE } from '../../data/legal'
import { getActiveCycle } from '../../data/reviewCycles'
import { formatDateTime } from '../../utils/format'

const props = defineProps({
  title: { type: String, default: 'Task List' },
  description: { type: String, default: 'Manage and review documents that require your attention.' },
  scope: { type: String, default: 'all' },
})

const router = useRouter()
const searchQuery = ref('')
const selectedStatus = ref('All')
const selectedAction = ref('All')
const selectedCycle = ref('All')
const rowsPerPage = ref(10)
const currentPage = ref(1)
const sortColumn = ref('updatedAt')
// FIFO: item yang paling dulu masuk selalu tampil paling atas secara default.
const sortDirection = ref('asc')
const statusOptions = ['All', 'VALIDATING', ...Object.keys(REVIEW_STATUS_CONFIG)]
const actionOptions = ['All', 'Validate Document', 'Review Legal', 'Review Revision', 'Collaborator Review']
const cycleOptions = computed(() => ['All', ...[...new Set(REVIEW_TASKS.map((task) => task.cycleNumber || getActiveCycle(task.requestId)?.cycleNumber).filter(Boolean))].sort((a, b) => a - b)])

const allTasks = computed(() => [
  ...VALIDATION_QUEUE.map((request) => ({
    ...request,
    id: request.id,
    requestNumber: request.id,
    requestor: request.requestor?.name || request.partner,
    document: request.title,
    action: 'Validate Document',
    updatedAt: request.submittedAt,
    kind: 'validation',
  })),
  ...REVIEW_TASKS.map((task) => ({
    ...task,
    id: task.taskId,
    requestNumber: task.requestId,
    requestor: task.partner,
    document: task.title,
    action: task.needCollaborator ? 'Collaborator Review' : 'Review Legal',
    updatedAt: task.startedAt || task.assignedAt,
    kind: 'review',
    cycleNumber: task.cycleNumber || getActiveCycle(task.requestId)?.cycleNumber || null,
  })),
])
const tasks = computed(() => (props.scope === 'review'
  ? allTasks.value.filter((task) => task.kind === 'review')
  : props.scope === 'validation'
    ? allTasks.value.filter((task) => task.kind === 'validation')
    : allTasks.value).filter((task) => task.status !== 'COMPLETED'))
const filteredTasks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return tasks.value.filter((task) => {
    const searchable = [task.requestNumber, task.title, task.partner, task.document, task.action].join(' ').toLowerCase()
    return (!query || searchable.includes(query)) && (selectedStatus.value === 'All' || task.status === selectedStatus.value) && (selectedAction.value === 'All' || task.action === selectedAction.value) && (selectedCycle.value === 'All' || task.cycleNumber === selectedCycle.value)
  })
})
const sortedTasks = computed(() => [...filteredTasks.value].sort((a, b) => {
  const result = a[sortColumn.value] < b[sortColumn.value] ? -1 : a[sortColumn.value] > b[sortColumn.value] ? 1 : 0
  return sortDirection.value === 'asc' ? result : -result
}))
const totalTasks = computed(() => sortedTasks.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalTasks.value / rowsPerPage.value)))
const paginatedTasks = computed(() => sortedTasks.value.slice((currentPage.value - 1) * rowsPerPage.value, currentPage.value * rowsPerPage.value))
const startItem = computed(() => totalTasks.value ? (currentPage.value - 1) * rowsPerPage.value + 1 : 0)
const endItem = computed(() => Math.min(currentPage.value * rowsPerPage.value, totalTasks.value))
const activeFilterCount = computed(() => Number(selectedStatus.value !== 'All') + Number(selectedAction.value !== 'All'))

function resetFilters() { searchQuery.value = ''; selectedStatus.value = 'All'; selectedAction.value = 'All'; selectedCycle.value = 'All'; currentPage.value = 1 }
function sortBy(column) { if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'; else { sortColumn.value = column; sortDirection.value = 'asc' } }
function statusLabel(status) {
  return {
    VALIDATING: 'New',
    OPEN: 'New',
    IN_PROGRESS: 'In Progress',
    AWAITING_COLLABORATOR: 'Under Review',
    COMPLETED: 'Completed',
  }[status] || status
}
function statusClass(status) { return { VALIDATING: 'bg-warning-light text-warning ring-warning/10', OPEN: 'bg-gray-100 text-gray-700 ring-gray-500/10', IN_PROGRESS: 'bg-warning-light text-warning ring-warning/10', AWAITING_COLLABORATOR: 'bg-info-light text-info ring-info/10', COMPLETED: 'bg-success-light text-success ring-success/10' }[status] || 'bg-gray-100 text-gray-700 ring-gray-500/10' }
function actionClass(action) { return action === 'Collaborator Review' ? 'bg-purple-50 text-purple-700' : action === 'Validate Document' ? 'bg-sky-50 text-sky-700' : 'bg-brand-50 text-brand-700' }
function openTask(task) { router.push(task.kind === 'validation' ? `/legal/validation/${task.id}` : `/legal/reviews/${task.taskId}`) }
</script>

<template>
  <section class="w-full rounded-card border border-gray-200 bg-white shadow-card overflow-hidden">
    <div class="border-b border-gray-200 p-4 sm:p-2xl"><div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><div class="flex items-center gap-2"><ClipboardCheck class="h-5 w-5 text-brand-700" /><h2 class="text-cardtitle text-gray-900">{{ props.title }}</h2></div><p class="mt-1 text-small text-gray-500">{{ props.description }}</p></div><div class="flex flex-wrap items-center gap-2"><div class="relative w-full sm:w-72"><Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input v-model="searchQuery" @input="currentPage = 1" type="search" placeholder="Cari request, dokumen, atau mitra..." class="h-10 w-full rounded-input border border-gray-200 bg-white pl-9 pr-3 text-small text-gray-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div><div class="relative"><select v-model="selectedStatus" @change="currentPage = 1" class="h-10 appearance-none rounded-input border border-gray-200 bg-white pl-3 pr-9 text-small text-gray-700 outline-none focus:border-brand-500"><option v-for="status in statusOptions" :key="status" :value="status">{{ status === 'All' ? 'Semua Status' : statusLabel(status) }}</option></select><ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /></div><div v-if="props.scope === 'all'" class="relative"><select v-model="selectedAction" @change="currentPage = 1" class="h-10 appearance-none rounded-input border border-gray-200 bg-white pl-3 pr-9 text-small text-gray-700 outline-none focus:border-brand-500"><option v-for="action in actionOptions" :key="action" :value="action">{{ action === 'All' ? 'Semua Aksi' : action }}</option></select><ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /></div><button type="button" @click="resetFilters" class="inline-flex h-10 items-center gap-2 rounded-input border border-gray-200 px-3 text-small font-medium text-gray-700 hover:bg-gray-50"><RotateCcw class="h-4 w-4" /> Reset <span v-if="activeFilterCount" class="rounded-full bg-gray-100 px-1.5 py-0.5 text-caption">{{ activeFilterCount }}</span></button></div></div></div>
    <div class="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-2xl"><p class="text-small text-gray-500"><span v-if="totalTasks">Menampilkan <span class="font-semibold text-gray-700">{{ startItem }}–{{ endItem }}</span> dari <span class="font-semibold text-gray-700">{{ totalTasks }}</span> task</span><span v-else>Tidak ada task ditemukan</span></p><label class="flex items-center gap-2 text-small text-gray-500">Baris per halaman <select v-model.number="rowsPerPage" @change="currentPage = 1" class="h-9 rounded-input border border-gray-200 bg-white px-3 text-small font-medium text-gray-700"><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option></select></label></div>
    <div class="overflow-x-auto"><table class="w-full min-w-[1000px]"><thead class="bg-gray-50"><tr class="border-b border-gray-200 text-left text-caption uppercase tracking-wider text-gray-500"><th class="w-14 px-4 py-3 sm:px-2xl">No.</th><th class="px-4 py-3">Request</th><th class="px-4 py-3">Requestor / Mitra</th><th class="px-4 py-3">Document</th><th v-for="column in [{ key: 'action', label: 'Action' }, { key: 'status', label: 'Status' }, { key: 'updatedAt', label: 'Updated' }]" :key="column.key" class="px-4 py-3"><button type="button" @click="sortBy(column.key)" class="inline-flex items-center gap-1 font-semibold hover:text-gray-900">{{ column.label }}<ChevronUp v-if="sortColumn === column.key && sortDirection === 'asc'" class="h-3.5 w-3.5" /><ChevronDown v-else-if="sortColumn === column.key" class="h-3.5 w-3.5" /><ChevronsUpDown v-else class="h-3.5 w-3.5" /></button></th><th class="w-24 px-4 py-3 text-right">Aksi</th></tr></thead><tbody class="divide-y divide-gray-100"><tr v-for="(task, index) in paginatedTasks" :key="task.id" class="transition hover:bg-gray-50"><td class="px-4 py-4 text-small text-gray-400 sm:px-2xl">{{ (currentPage - 1) * rowsPerPage + index + 1 }}</td><td class="max-w-sm px-4 py-4"><div class="flex items-start gap-3"><div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-gray-100"><FileSearch class="h-4 w-4 text-gray-600" /></div><div class="min-w-0"><p class="truncate text-bodystrong text-gray-900">{{ task.title }}</p><p class="mt-0.5 text-caption text-gray-500">{{ task.requestNumber }}</p></div></div></td><td class="px-4 py-4"><div class="flex items-center gap-2 text-small text-gray-700"><div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100"><UserRound class="h-3.5 w-3.5 text-gray-500" /></div>{{ task.requestor }}</div></td><td class="max-w-[240px] px-4 py-4"><p class="truncate text-small text-gray-600" :title="task.document">{{ task.document }}</p></td><td class="px-4 py-4"><span class="inline-flex rounded-input px-2.5 py-1 text-caption font-semibold" :class="actionClass(task.action)">{{ task.action }}</span></td><td class="px-4 py-4"><span class="inline-flex rounded-badge px-2.5 py-1 text-caption font-semibold ring-1 ring-inset" :class="statusClass(task.status)">{{ statusLabel(task.status) }}</span></td><td class="whitespace-nowrap px-4 py-4 text-small text-gray-500">{{ formatDateTime(task.updatedAt) }}</td><td class="px-4 py-4 text-right"><button type="button" @click="openTask(task)" class="inline-flex h-8 items-center gap-1.5 rounded-input border border-gray-200 px-2.5 text-caption font-semibold text-gray-700 hover:bg-gray-50"><Eye class="h-3.5 w-3.5" /> Buka</button></td></tr><tr v-if="!paginatedTasks.length"><td colspan="8" class="px-6 py-16 text-center"><ClipboardCheck class="mx-auto h-8 w-8 text-gray-300" /><p class="mt-3 text-bodystrong text-gray-800">Tidak ada task ditemukan</p><button type="button" @click="resetFilters" class="mt-3 text-small font-semibold text-brand-700 hover:underline">Reset filter</button></td></tr></tbody></table></div>
    <div class="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-2xl"><p class="text-caption text-gray-500">Halaman {{ currentPage }} dari {{ totalPages }}</p><div class="flex items-center gap-1"><button type="button" @click="currentPage--" :disabled="currentPage === 1" class="flex h-8 w-8 items-center justify-center rounded-input border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft class="h-4 w-4" /></button><button v-for="page in totalPages" :key="page" type="button" @click="currentPage = page" class="flex h-8 min-w-8 items-center justify-center rounded-input border px-2 text-caption font-semibold" :class="page === currentPage ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">{{ page }}</button><button type="button" @click="currentPage++" :disabled="currentPage === totalPages" class="flex h-8 w-8 items-center justify-center rounded-input border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight class="h-4 w-4" /></button></div></div>
  </section>
</template>

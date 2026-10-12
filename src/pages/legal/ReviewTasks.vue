<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, Users2 } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import { USERS } from '../../data/users'
import { REVIEW_TASKS, REVIEW_STATUS_CONFIG } from '../../data/legal'
import { formatDateTime } from '../../utils/format'

const router = useRouter()
const user = USERS.legal
const query = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'OPEN', label: 'Belum Dimulai' },
  { value: 'IN_PROGRESS', label: 'Sedang Ditelaah' },
  { value: 'AWAITING_COLLABORATOR', label: 'Menunggu Kolaborator' },
  { value: 'COMPLETED', label: 'Selesai' },
]

const filtered = computed(() => {
  return REVIEW_TASKS.filter((t) => {
    const matchesQuery = query.value
      ? (t.requestId + t.title + t.partner).toLowerCase().includes(query.value.toLowerCase())
      : true
    const matchesStatus = statusFilter.value === 'all' ? true : t.status === statusFilter.value
    return matchesQuery && matchesStatus
  })
})
</script>

<template>
  <AppLayout role-key="legal" :user="user" :breadcrumb="['Portal Tim Legal', 'Tugas Review']">
    <div class="flex items-center justify-between mb-2xl gap-lg flex-wrap">
      <div>
        <h1 class="text-pagetitle text-gray-900">Tugas Telaah Hukum Terbuka</h1>
        <p class="mt-1 text-small text-gray-500">
          Seluruh tugas review Fase 2 yang tercatat pada sistem — termasuk yang belum dimulai, sedang berjalan, dan menunggu hasil kolaborator.
        </p>
      </div>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card">
      <div class="flex flex-wrap items-center gap-3 px-2xl py-lg border-b border-gray-200">
        <div class="relative flex-1 min-w-[240px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            v-model="query"
            type="text"
            placeholder="Cari Task ID, nomor request, atau nama mitra..."
            class="w-full h-9 rounded-input border border-gray-200 bg-gray-50 pl-9 pr-3 text-small focus:bg-white focus:border-brand-500"
          />
        </div>
        <select v-model="statusFilter" class="h-9 rounded-input border border-gray-200 bg-white px-3 text-small text-gray-700">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <table class="w-full text-body">
        <thead>
          <tr class="text-left text-small text-gray-500 border-b border-gray-200">
            <th class="px-2xl py-3 font-medium">Task ID</th>
            <th class="px-2 py-3 font-medium">Request & Dokumen</th>
            <th class="px-2 py-3 font-medium">Status</th>
            <th class="px-2 py-3 font-medium">Kolaborator</th>
            <th class="px-2xl py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filtered" :key="t.taskId" class="table-row-hover border-b border-gray-100 last:border-0">
            <td class="px-2xl py-3.5 align-top">
              <p class="text-bodystrong text-brand-700">{{ t.taskId }}</p>
              <p class="text-caption text-gray-500">{{ t.requestId }}</p>
            </td>
            <td class="px-2 py-3.5 align-top max-w-sm">
              <p class="text-bodystrong text-gray-900">{{ t.title }}</p>
              <p class="text-caption text-gray-500">{{ t.classification }} · {{ t.partner }}</p>
            </td>
            <td class="px-2 py-3.5 align-top"><Badge :label="REVIEW_STATUS_CONFIG[t.status].label" :tone="REVIEW_STATUS_CONFIG[t.status].tone" /></td>
            <td class="px-2 py-3.5 align-top text-small text-gray-700">
              <span v-if="t.collaborator" class="inline-flex items-center gap-1.5">
                <Users2 class="h-3.5 w-3.5 text-gray-500" />{{ t.collaborator.name }}
              </span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-2xl py-3.5 align-top text-right">
              <Button variant="secondary" size="sm" @click="router.push(`/legal/reviews/${t.taskId}`)">
                Buka Tugas
                <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
              </Button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="px-2xl py-12 text-center text-small text-gray-500">
              Tidak ada tugas yang cocok dengan pencarian ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>

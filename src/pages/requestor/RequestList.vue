<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, ListFilter } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import { USERS } from '../../data/users'
import { REQUESTS, REQUEST_SUMMARY } from '../../data/requests'
import { formatDate } from '../../utils/format'

const router = useRouter()
const user = USERS.requestor
const query = ref('')
const statusFilter = ref('all')

const filtered = computed(() => {
  return REQUESTS.filter((r) => {
    const matchesQuery = query.value
      ? (r.id + r.title + r.partner).toLowerCase().includes(query.value.toLowerCase())
      : true
    const matchesStatus = statusFilter.value === 'all' ? true : r.status === statusFilter.value
    return matchesQuery && matchesStatus
  })
})

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'VALIDATING', label: 'Menunggu Validasi' },
  { value: 'RETURNED', label: 'Dikembalikan' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'REVIEW_COMPLETED', label: 'Review Completed' },
  { value: 'COMPLETED', label: 'Closed / Finalized' },
]
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal', 'Permohonan & Riwayat']">
    <div class="flex items-center justify-between mb-2xl gap-lg">
      <div>
        <h1 class="text-pagetitle text-gray-900">Permohonan Saya & Riwayat Pengajuan</h1>
        <p class="mt-1 text-small text-gray-500">
          Kelola seluruh permohonan review kontrak, pantau status telaah legal, tindak lanjuti berkas yang dikembalikan, serta unduh riwayat dokumen resmi secara terpusat.
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Button variant="primary" @click="router.push('/requestor/requests/create')">
          <template #icon-left><Plus class="h-4 w-4" /></template>Buat Request Baru
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
      <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
        <p class="text-small text-gray-500">Total Berkas</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ REQUEST_SUMMARY.total }}</p>
      </div>
      <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
        <p class="text-small text-gray-500">Perlu Tindakan</p>
        <p class="mt-1 text-2xl font-bold text-danger">{{ REQUEST_SUMMARY.returned }}</p>
        <p class="text-caption text-danger">Perlu lengkapi lampiran</p>
      </div>
      <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
        <p class="text-small text-gray-500">Sedang Berjalan</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ REQUEST_SUMMARY.inReview + REQUEST_SUMMARY.waitingValidation }}</p>
        <p class="text-caption text-gray-500">In Review + Validasi</p>
      </div>
      <div class="rounded-card border border-gray-200 bg-white p-lg shadow-card">
        <p class="text-small text-gray-500">Telaah Selesai</p>
        <p class="mt-1 text-2xl font-bold text-success">{{ REQUEST_SUMMARY.closed + REQUEST_SUMMARY.reviewCompleted }}</p>
        <p class="text-caption text-gray-500">100% Finalized & Ditandatangani</p>
      </div>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card">
      <div class="flex flex-wrap items-center gap-3 px-2xl py-lg border-b border-gray-200">
        <div class="relative flex-1 min-w-[240px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            v-model="query"
            type="text"
            placeholder="Cari nomor permohonan REQ-2026-..., nama dokumen, atau nama mitra..."
            class="w-full h-9 rounded-input border border-gray-200 bg-gray-50 pl-9 pr-3 text-small focus:bg-white focus:border-brand-500"
          />
        </div>
        <select
          v-model="statusFilter"
          class="h-9 rounded-input border border-gray-200 bg-white px-3 text-small text-gray-700"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <Button variant="secondary" size="sm"><template #icon-left><ListFilter class="h-3.5 w-3.5" /></template>Filter Lanjutan</Button>
      </div>

      <table class="w-full text-body">
        <thead>
          <tr class="text-left text-small text-gray-500 border-b border-gray-200">
            <th class="px-2xl py-3 font-medium">Request ID</th>
            <th class="px-2 py-3 font-medium">Judul & Jenis Dokumen</th>
            <th class="px-2 py-3 font-medium">Peruntukan & Mitra</th>
            <th class="px-2 py-3 font-medium">Status Review</th>
            <th class="px-2 py-3 font-medium">Pengajuan</th>
            <th class="px-2xl py-3 font-medium text-right">Tindakan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" class="table-row-hover border-b border-gray-100 last:border-0">
            <td class="px-2xl py-3.5 align-top text-bodystrong text-brand-700">{{ r.id }}</td>
            <td class="px-2 py-3.5 align-top max-w-sm">
              <p class="text-bodystrong text-gray-900">{{ r.title }}</p>
              <p class="text-caption text-gray-500">{{ r.classification }} · {{ r.type }}</p>
            </td>
            <td class="px-2 py-3.5 align-top text-small text-gray-700">{{ r.partner }}</td>
            <td class="px-2 py-3.5 align-top"><Badge :status="r.status" /></td>
            <td class="px-2 py-3.5 align-top text-small text-gray-700">{{ formatDate(r.submittedAt) }}</td>
            <td class="px-2xl py-3.5 align-top text-right">
              <Button
                :variant="r.status === 'RETURNED' ? 'danger' : 'secondary'"
                size="sm"
                @click="router.push(`/requestor/requests/${r.id}`)"
              >
                {{ r.status === 'RETURNED' ? 'Lengkapi Berkas' : 'Lihat Detail' }}
              </Button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="px-2xl py-12 text-center text-small text-gray-500">
              Tidak ada permohonan yang cocok dengan pencarian ini.
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-center justify-between px-2xl py-lg text-small text-gray-500">
        <span>Menampilkan 1–{{ filtered.length }} dari {{ REQUEST_SUMMARY.total }} permohonan</span>
      </div>
    </div>
  </AppLayout>
</template>

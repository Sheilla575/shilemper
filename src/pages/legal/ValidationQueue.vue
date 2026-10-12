
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ListFilter, ArrowRight } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import { USERS } from '../../data/users'
import { VALIDATION_QUEUE } from '../../data/legal'
import { formatDate } from '../../utils/format'

const router = useRouter()
const user = USERS.legal
const query = ref('')
const pendingValidations = computed(() => VALIDATION_QUEUE.filter((v) => !['VALIDATED', 'RETURNED'].includes(v.status)))

const filtered = computed(() => {
  if (!query.value) return pendingValidations.value
  const q = query.value.toLowerCase()
  return pendingValidations.value.filter((v) => (v.id + v.title + v.partner).toLowerCase().includes(q))
})

function incompleteCount(v) {
  return v.checklist.filter((c) => c.required && !c.complete).length
}
</script>

<template>
  <AppLayout role-key="legal" :user="user" :breadcrumb="['Portal Tim Legal', 'Antrian Validasi']">
    <div class="flex items-center justify-between mb-2xl gap-lg flex-wrap">
      <div>
        <h1 class="text-pagetitle text-gray-900">Antrian Validasi Kelengkapan Berkas</h1>
        <p class="mt-1 text-small text-gray-500">
          Semua lampiran wajib telah diunggah sebelum pengajuan. Periksa isi dan keabsahannya; dokumen yang tidak sesuai dikembalikan dengan catatan perbaikan.
        </p>
      </div>
      <span class="text-caption font-semibold text-warning bg-warning-light rounded-badge px-2.5 py-1 shrink-0">
        {{ pendingValidations.length }} Menunggu Validasi
      </span>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card">
      <div class="flex flex-wrap items-center gap-3 px-2xl py-lg border-b border-gray-200">
        <div class="relative flex-1 min-w-[240px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            v-model="query"
            type="text"
            placeholder="Cari nomor request, judul dokumen, atau nama mitra..."
            class="w-full h-9 rounded-input border border-gray-200 bg-gray-50 pl-9 pr-3 text-small focus:bg-white focus:border-brand-500"
          />
        </div>
        <Button variant="secondary" size="sm"><template #icon-left><ListFilter class="h-3.5 w-3.5" /></template>Filter Lanjutan</Button>
      </div>

      <table class="w-full text-body">
        <thead>
          <tr class="text-left text-small text-gray-500 border-b border-gray-200">
            <th class="px-2xl py-3 font-medium">Request ID</th>
            <th class="px-2 py-3 font-medium">Judul & Jenis Dokumen</th>
            <th class="px-2 py-3 font-medium">Requestor</th>
            <th class="px-2 py-3 font-medium">Checklist</th>
            <th class="px-2xl py-3 font-medium text-right">Tindakan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filtered" :key="v.id" class="table-row-hover border-b border-gray-100 last:border-0">
            <td class="px-2xl py-3.5 align-top">
              <p class="text-bodystrong text-brand-700">{{ v.id }}</p>
              <span v-if="v.resubmission" class="text-caption font-semibold text-info bg-info-light rounded-badge px-2 py-0.5">Diajukan Ulang</span>
            </td>
            <td class="px-2 py-3.5 align-top max-w-sm">
              <p class="text-bodystrong text-gray-900">{{ v.title }}</p>
              <p class="text-caption text-gray-500">{{ v.classification }} · {{ v.type }} · {{ v.partner }}</p>
            </td>
            <td class="px-2 py-3.5 align-top text-small text-gray-700">
              <p>{{ v.requestor.name }}</p>
              <p class="text-caption text-gray-500">{{ v.requestor.division }}</p>
            </td>
            <td class="px-2 py-3.5 align-top">
              <Badge
                :label="incompleteCount(v) === 0 ? 'Lengkap' : `${incompleteCount(v)} Item Kurang`"
                :tone="incompleteCount(v) === 0 ? 'success' : 'danger'"
                :dot="false"
              />
              <p class="mt-1 text-caption text-gray-500">Diajukan {{ formatDate(v.submittedAt) }}</p>
            </td>
            <td class="px-2xl py-3.5 align-top text-right">
              <Button variant="secondary" size="sm" @click="router.push(`/legal/validation/${v.id}`)">
                Periksa Dokumen
                <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
              </Button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-2xl py-12 text-center text-small text-gray-500">
              Tidak ada permohonan yang cocok dengan pencarian ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>

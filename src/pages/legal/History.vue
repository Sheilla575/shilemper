<script setup>
import { ref, computed } from 'vue'
import { Download, Search, CheckCircle2, XCircle, ClipboardCheck, Scale, Users2 } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import { USERS } from '../../data/users'
import { LEGAL_ACTIVITY } from '../../data/legal'
import { REVIEW_AUDIT_TRAIL } from '../../data/reviewCycles'
import { formatDateTime } from '../../utils/format'

const user = USERS.legal
const query = ref('')
const auditEntries = computed(() => [
  ...REVIEW_AUDIT_TRAIL.map((entry) => ({ id: entry.id, at: entry.at, actor: entry.actor, action: entry.action, target: entry.requestId, detail: `${entry.description} Cycle ${entry.cycle ?? '—'}${entry.reviewItem ? ` · ${entry.reviewItem}` : ''}.` })),
  ...LEGAL_ACTIVITY,
].sort((a, b) => new Date(b.at) - new Date(a.at)))

const filtered = computed(() => {
  if (!query.value) return auditEntries.value
  const q = query.value.toLowerCase()
  return auditEntries.value.filter((a) => (a.action + a.target + a.detail).toLowerCase().includes(q))
})

function iconFor(action) {
  if (action.includes('Menolak')) return XCircle
  if (action.includes('Memvalidasi')) return CheckCircle2
  if (action.includes('kolaborator')) return Users2
  if (action.includes('telaah') || action.includes('Menyelesaikan')) return Scale
  return ClipboardCheck
}

function toneFor(action) {
  if (action.includes('Menolak')) return 'text-danger bg-danger-light'
  if (action.includes('Memvalidasi') || action.includes('Menyelesaikan')) return 'text-success bg-success-light'
  if (action.includes('kolaborator')) return 'text-info bg-info-light'
  return 'text-brand-700 bg-brand-50'
}
</script>

<template>
  <AppLayout role-key="legal" :user="user" :breadcrumb="['Portal Tim Legal', 'Riwayat & Audit']">
    <div class="flex items-center justify-between mb-2xl gap-lg flex-wrap">
      <div>
        <h1 class="text-pagetitle text-gray-900">Riwayat &amp; Audit Trail</h1>
        <p class="mt-1 text-small text-gray-500">Jejak lengkap tindakan validasi, telaah hukum, dan penugasan kolaborator yang tercatat atas nama Anda. Bersifat append-only.</p>
      </div>
      <Button variant="secondary"><template #icon-left><Download class="h-4 w-4" /></template>Ekspor Audit Log</Button>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card">
      <div class="px-2xl py-lg border-b border-gray-200">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            v-model="query"
            type="text"
            placeholder="Cari aktivitas atau nomor request..."
            class="w-full h-9 rounded-input border border-gray-200 bg-gray-50 pl-9 pr-3 text-small focus:bg-white focus:border-brand-500"
          />
        </div>
      </div>

      <div class="p-2xl">
        <ol class="space-y-0">
          <li v-for="(a, i) in filtered" :key="a.id" class="flex gap-lg">
            <div class="flex flex-col items-center">
              <span class="h-8 w-8 rounded-full flex items-center justify-center shrink-0" :class="toneFor(a.action)">
                <component :is="iconFor(a.action)" class="h-4 w-4" />
              </span>
              <span v-if="i < filtered.length - 1" class="w-px flex-1 min-h-[24px] bg-gray-200" />
            </div>
            <div class="pb-lg min-w-0">
              <p class="text-bodystrong text-gray-900">
                {{ a.action }} — <span class="text-brand-700">{{ a.target }}</span>
              </p>
              <p class="mt-0.5 text-small text-gray-500">{{ a.detail }}</p>
              <p class="mt-1 text-caption text-gray-400">{{ a.actor }} · {{ formatDateTime(a.at) }}</p>
            </div>
          </li>
        </ol>
        <p v-if="filtered.length === 0" class="text-small text-gray-500 text-center py-8">Tidak ada aktivitas yang cocok dengan pencarian ini.</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Download } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import { USERS } from '../../data/users'
import { REQUESTS } from '../../data/requests'
import { formatDate } from '../../utils/format'

const router = useRouter()
const user = USERS.requestor
const closed = computed(() => REQUESTS.filter((r) => r.status === 'COMPLETED'))
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal', 'Riwayat']">
    <div class="flex items-center justify-between mb-2xl">
      <div>
        <h1 class="text-pagetitle text-gray-900">Riwayat Dokumen Selesai</h1>
        <p class="mt-1 text-small text-gray-500">Arsip permohonan yang telah Finalized, Distributed, dan Closed — lengkap dengan jejak audit.</p>
      </div>
      <Button variant="secondary"><template #icon-left><Download class="h-4 w-4" /></template>Unduh Semua Arsip</Button>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card divide-y divide-gray-100">
      <div v-for="r in closed" :key="r.id" class="flex items-center justify-between px-2xl py-lg">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <p class="text-bodystrong text-brand-700">{{ r.id }}</p>
            <Badge :status="r.status" />
          </div>
          <p class="mt-1 text-body text-gray-900">{{ r.title }}</p>
          <p class="mt-0.5 text-caption text-gray-500">{{ r.partner }} · Selesai {{ formatDate(r.updatedAt) }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" @click="router.push(`/requestor/requests/${r.id}`)">Detail Arsip</Button>
          <Button variant="ghost" size="sm"><template #icon-left><Download class="h-3.5 w-3.5" /></template>Unduh</Button>
        </div>
      </div>
      <div v-if="closed.length === 0" class="px-2xl py-12 text-center text-small text-gray-500">
        Belum ada dokumen yang selesai diarsipkan.
      </div>
    </div>
  </AppLayout>
</template>

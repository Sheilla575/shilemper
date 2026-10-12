<script setup>
import { useRouter } from 'vue-router'
import { Plus, ArrowRight, Download, RefreshCw, ClipboardCheck } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import StatCard from '../../components/ui/StatCard.vue'
import { USERS } from '../../data/users'
import { REQUESTS, REQUEST_SUMMARY } from '../../data/requests'
import { COLLAB_TASKS, COLLAB_SUMMARY, COLLAB_TASK_STATUS } from '../../data/collaborator'
import { formatDate } from '../../utils/format'

const router = useRouter()
const user = USERS.requestor
const recent = REQUESTS.slice(0, 5)
const openReviewTasks = COLLAB_TASKS.filter((task) => task.status !== 'COMPLETED').slice(0, 4)

</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal']">
    <div class="hero-gradient rounded-card text-white p-4 sm:p-2xl mb-6 sm:mb-2xl relative overflow-hidden">
      <span class="inline-block text-caption font-semibold bg-white/15 rounded-badge px-2.5 py-1 mb-3">
        PORTAL NON-LEGAL
      </span>
      <h1 class="text-pagetitle">Selamat Datang, {{ user.name }}</h1>
      <p class="mt-2 text-body text-white/80 max-w-2xl">
        Ajukan kebutuhan dokumen ke Tim Legal, pantau pengajuan, dan selesaikan tugas review lintas divisi yang ditugaskan kepada Anda.
      </p>
      <Button variant="secondary" class="mt-lg bg-white text-brand-700 hover:bg-white/90 border-none" @click="router.push('/requestor/requests/create')">
        <template #icon-left><Plus class="h-4 w-4" /></template>
        Buat Request Baru
      </Button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
      <StatCard label="Pengajuan Aktif" :value="REQUEST_SUMMARY.draft + REQUEST_SUMMARY.waitingValidation + REQUEST_SUMMARY.inReview" hint="Draft, validasi, dan telaah Legal" />
      <StatCard label="Perlu Tindakan" :value="REQUEST_SUMMARY.returned" tone="danger" hint="Pengajuan yang perlu dilengkapi" />
      <StatCard label="Tugas Review Baru" :value="COLLAB_SUMMARY.assigned" tone="warning" hint="Penugasan dari Tim Legal" />
      <StatCard label="Review Saya Berjalan" :value="COLLAB_SUMMARY.inProgress" hint="Tugas review yang sedang dikerjakan" />
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card mb-2xl overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-2xl py-lg border-b border-gray-200">
        <div class="flex items-center gap-3 min-w-0">
          <h2 class="text-cardtitle text-gray-900">Pengajuan Terbaru Saya</h2>
          <span class="text-caption text-gray-500">Total {{ REQUEST_SUMMARY.total }} Pengajuan</span>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="secondary" size="sm"><template #icon-left><Download class="h-3.5 w-3.5" /></template>Export XLS</Button>
          <Button variant="ghost" size="sm"><template #icon-left><RefreshCw class="h-3.5 w-3.5" /></template>Sync</Button>
        </div>
      </div>

      <div class="overflow-x-auto">
      <table class="w-full min-w-[760px] text-body">
        <thead>
          <tr class="text-left text-small text-gray-500 border-b border-gray-200">
            <th class="px-2xl py-3 font-medium">Request ID</th>
            <th class="px-2 py-3 font-medium">Judul & Dokumen Kontrak</th>
            <th class="px-2 py-3 font-medium">Status Review</th>
            <th class="px-2 py-3 font-medium">Pengajuan</th>
            <th class="px-2xl py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in recent" :key="r.id" class="table-row-hover border-b border-gray-100 last:border-0">
            <td class="px-2xl py-3.5 align-top">
              <p class="text-bodystrong text-brand-700">{{ r.id }}</p>
              <p class="text-caption text-gray-500">{{ r.partner }}</p>
            </td>
            <td class="px-2 py-3.5 align-top max-w-md">
              <p class="text-bodystrong text-gray-900">{{ r.title }}</p>
              <p class="text-caption text-gray-500">{{ r.classification }} · {{ r.type }}</p>
            </td>
            <td class="px-2 py-3.5 align-top"><Badge :status="r.status" /></td>
            <td class="px-2 py-3.5 align-top">
              <p class="text-small text-gray-700">{{ formatDate(r.submittedAt) }}</p>
            </td>
            <td class="px-2xl py-3.5 align-top text-right">
              <Button variant="secondary" size="sm" @click="router.push(`/requestor/requests/${r.id}`)">
                Lihat Detail
                <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card overflow-hidden">
      <div class="flex items-center justify-between gap-3 px-4 sm:px-2xl py-lg border-b border-gray-200">
        <div class="flex items-center gap-3 min-w-0">
          <ClipboardCheck class="h-5 w-5 shrink-0 text-brand-700" />
          <div>
            <h2 class="text-cardtitle text-gray-900">Tugas Review Saya</h2>
            <p class="text-caption text-gray-500">Penugasan review lintas divisi dari Tim Legal.</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" @click="router.push('/collaborator/tasks')">Lihat Semua</Button>
      </div>
      <div class="divide-y divide-gray-100">
        <div v-for="task in openReviewTasks" :key="task.taskId" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-2xl py-lg">
          <div class="min-w-0">
            <p class="text-bodystrong text-brand-700">{{ task.requestId }}</p>
            <p class="mt-0.5 text-body text-gray-900 truncate">{{ task.title }}</p>
            <p class="text-caption text-gray-500">{{ task.partner }} · {{ task.scope }} · {{ COLLAB_TASK_STATUS[task.status].label }}</p>
          </div>
          <Button variant="secondary" size="sm" class="shrink-0 self-start sm:self-auto" @click="router.push(`/collaborator/tasks/${task.taskId}`)">
            Buka Tugas
            <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
          </Button>
        </div>
        <div v-if="openReviewTasks.length === 0" class="px-2xl py-10 text-center text-small text-gray-500">Tidak ada tugas review yang terbuka saat ini.</div>
      </div>
    </div>

  </AppLayout>
</template>

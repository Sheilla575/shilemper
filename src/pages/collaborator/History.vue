<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, CheckCircle2, PlayCircle, Send } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import { USERS } from '../../data/users'
import { COLLAB_TASKS, COLLAB_ACTIVITY } from '../../data/collaborator'
import { formatDate, formatDateTime } from '../../utils/format'

const router = useRouter()
const user = USERS.collaborator
const query = ref('')

const completedTasks = computed(() => COLLAB_TASKS.filter((t) => t.status === 'COMPLETED'))

const filteredActivity = computed(() => {
  if (!query.value) return COLLAB_ACTIVITY
  const q = query.value.toLowerCase()
  return COLLAB_ACTIVITY.filter((a) => (a.action + a.target + a.detail).toLowerCase().includes(q))
})

function iconFor(action) {
  if (action.includes('Mengirim')) return Send
  if (action.includes('Memulai')) return PlayCircle
  return CheckCircle2
}
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal', 'Riwayat Review Saya']">
    <div class="flex items-center justify-between mb-2xl gap-lg flex-wrap">
      <div>
        <h1 class="text-pagetitle text-gray-900">Riwayat Review Saya</h1>
        <p class="mt-1 text-small text-gray-500">Arsip tugas review yang sudah Anda selesaikan beserta jejak aktivitas atas nama Anda sendiri.</p>
      </div>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card mb-2xl">
      <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200">
        <h2 class="text-cardtitle text-gray-900">Review Selesai</h2>
        <span class="text-caption text-gray-500">{{ completedTasks.length }} Task</span>
      </div>
      <div class="divide-y divide-gray-100">
        <div v-for="t in completedTasks" :key="t.taskId" class="flex items-center justify-between px-2xl py-lg gap-lg">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-bodystrong text-brand-700">{{ t.requestId }}</p>
              <Badge label="Selesai" tone="success" />
            </div>
            <p class="mt-0.5 text-body text-gray-900">{{ t.title }}</p>
            <p class="text-caption text-gray-500">{{ t.partner }} · Scope: {{ t.scope }} · Dikirim {{ formatDate(t.submittedAt) }}</p>
          </div>
          <Button variant="secondary" size="sm" @click="router.push(`/collaborator/tasks/${t.taskId}`)">
            Lihat Hasil
            <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
          </Button>
        </div>
        <div v-if="completedTasks.length === 0" class="px-2xl py-12 text-center text-small text-gray-500">Belum ada review yang Anda selesaikan.</div>
      </div>
    </div>

    <div class="rounded-card border border-gray-200 bg-white shadow-card">
      <div class="px-2xl py-lg border-b border-gray-200">
        <h2 class="text-cardtitle text-gray-900 mb-lg">Aktivitas Saya</h2>
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
          <li v-for="(a, i) in filteredActivity" :key="a.id" class="flex gap-lg">
            <div class="flex flex-col items-center">
              <span class="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-brand-700 bg-brand-50">
                <component :is="iconFor(a.action)" class="h-4 w-4" />
              </span>
              <span v-if="i < filteredActivity.length - 1" class="w-px flex-1 min-h-[24px] bg-gray-200" />
            </div>
            <div class="pb-lg min-w-0">
              <p class="text-bodystrong text-gray-900">
                {{ a.action }} — <span class="text-brand-700">{{ a.target }}</span>
              </p>
              <p class="mt-0.5 text-small text-gray-500">{{ a.detail }}</p>
              <p class="mt-1 text-caption text-gray-400">{{ formatDateTime(a.at) }}</p>
            </div>
          </li>
        </ol>
        <p v-if="filteredActivity.length === 0" class="text-small text-gray-500 text-center py-8">Tidak ada aktivitas yang cocok dengan pencarian ini.</p>
      </div>
    </div>
  </AppLayout>
</template>

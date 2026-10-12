<script setup>
import { useRouter } from 'vue-router'
import { ArrowRight, ClipboardList } from 'lucide-vue-next'
import AppLayout from '../../components/layout/AppLayout.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import StatCard from '../../components/ui/StatCard.vue'
import { USERS } from '../../data/users'
import { COLLAB_TASKS, COLLAB_SUMMARY, COLLAB_TASK_STATUS, COLLAB_ACTIVITY } from '../../data/collaborator'
import { formatDateTime } from '../../utils/format'

const router = useRouter()
const user = USERS.collaborator

const openTasks = COLLAB_TASKS.filter((t) => t.status !== 'COMPLETED')
const recentActivity = COLLAB_ACTIVITY.slice(0, 4)
</script>

<template>
  <AppLayout role-key="nonlegal" :user="user" :breadcrumb="['Portal Non-Legal', 'Review Tasks']">
    <div class="hero-gradient rounded-card text-white p-2xl mb-2xl relative overflow-hidden">
      <span class="inline-block text-caption font-semibold bg-white/15 rounded-badge px-2.5 py-1 mb-3">
        KOLABORATOR · REVIEW LINTAS DIVISI
      </span>
      <h1 class="text-pagetitle">Welcome, {{ user.name }} <span class="font-normal text-white/70">({{ user.division }})</span></h1>
      <p class="mt-2 text-body text-white/80 max-w-2xl">
        Anda hanya akan melihat dokumen dan lingkup klausul yang ditugaskan oleh Tim Legal untuk masing-masing permohonan.
      </p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-lg mb-2xl">
      <StatCard label="Not Started" :value="COLLAB_SUMMARY.assigned" hint="Ready to open" />
      <StatCard label="In Review" :value="COLLAB_SUMMARY.inProgress" tone="warning" hint="In progress" />
      <StatCard label="Completed This Month" :value="COLLAB_SUMMARY.completedThisMonth" tone="success" hint="Result submitted" />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-2xl">
      <div class="xl:col-span-2 space-y-2xl">
        <div class="rounded-card border border-gray-200 bg-white shadow-card">
          <div class="flex items-center justify-between px-2xl py-lg border-b border-gray-200">
            <div class="flex items-center gap-2">
              <ClipboardList class="h-4 w-4 text-brand-700" />
              <h2 class="text-cardtitle text-gray-900">Tugas Review Saya</h2>
            </div>
            <router-link to="/collaborator/tasks" class="text-small text-brand-700 font-medium">Lihat Semua</router-link>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="t in openTasks" :key="t.taskId" class="flex items-center justify-between px-2xl py-lg gap-lg">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-bodystrong text-brand-700">{{ t.requestId }}</p>
                  <Badge :label="COLLAB_TASK_STATUS[t.status].label" :tone="COLLAB_TASK_STATUS[t.status].tone" />
                </div>
                <p class="mt-0.5 text-body text-gray-900 truncate max-w-md">{{ t.title }}</p>
                <p class="text-caption text-gray-500">{{ t.partner }} · Scope: {{ t.scope }}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <Button variant="secondary" size="sm" @click="router.push(`/collaborator/tasks/${t.taskId}`)">
                  Buka
                  <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
                </Button>
              </div>
            </div>
            <div v-if="openTasks.length === 0" class="px-2xl py-12 text-center text-small text-gray-500">Tidak ada tugas review yang terbuka saat ini.</div>
          </div>
        </div>
      </div>

      <div class="rounded-card border border-gray-200 bg-white shadow-card p-2xl">
        <h3 class="text-cardtitle text-gray-900 mb-lg">Aktivitas Terbaru Saya</h3>
        <ol class="space-y-lg">
          <li v-for="a in recentActivity" :key="a.id" class="flex gap-3">
            <span class="h-2 w-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
            <div class="min-w-0">
              <p class="text-small text-gray-900">
                <span class="font-semibold">{{ a.action }}</span> — {{ a.target }}
              </p>
              <p class="text-caption text-gray-500">{{ formatDateTime(a.at) }}</p>
            </div>
          </li>
        </ol>
        <router-link to="/collaborator/history" class="mt-lg inline-block text-small text-brand-700 font-medium">Lihat Riwayat Review Saya →</router-link>
      </div>
    </div>
  </AppLayout>
</template>

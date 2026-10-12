<script setup>
import { computed } from 'vue'
import { ChevronDown, FileText, Users } from 'lucide-vue-next'

const props = defineProps({
  members: { type: Array, default: () => [] },
  documentInfo: { type: Object, default: () => ({}) },
  activeTab: { type: String, default: 'info' },
  collapsibleInfo: { type: Boolean, default: false },
  infoOpen: { type: Boolean, default: true },
  requestInfo: { type: Boolean, default: false },
})

const emit = defineEmits(['update:activeTab', 'update:infoOpen'])
const activeTab = computed({
  get: () => props.activeTab,
  set: (value) => emit('update:activeTab', value),
})
const infoOpen = computed({
  get: () => props.infoOpen,
  set: (value) => emit('update:infoOpen', value),
})
const initials = (member) => String(member.name || member.email || '?').trim().charAt(0).toUpperCase()
const groupedMembers = computed(() => props.members.reduce((groups, member) => {
  const role = member.role || 'Member'
  ;(groups[role] ||= []).push(member)
  return groups
}, {}))
</script>

<template>
  <section class="rounded-card border border-gray-200 bg-white shadow-card">
    <div class="flex border-b border-gray-200 px-4 pt-3">
      <button type="button" class="inline-flex items-center gap-2 border-b-2 px-4 py-3 text-small font-semibold transition-colors" :class="activeTab === 'info' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'" @click="activeTab = 'info'">
        <FileText class="h-4 w-4" /> Document Info
      </button>
      <button type="button" class="inline-flex items-center gap-2 border-b-2 px-4 py-3 text-small font-semibold transition-colors" :class="activeTab === 'assignment' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'" @click="activeTab = 'assignment'">
        <Users class="h-4 w-4" /> Assignment
      </button>
    </div>

    <div v-if="activeTab === 'info'" class="p-lg">
      <div class="flex items-start justify-between gap-3">
        <div><p class="text-caption font-semibold uppercase tracking-wide text-brand-700">Document Info</p><h2 class="mt-1 text-cardtitle text-gray-900">{{ documentInfo.title || 'Dokumen Ticket' }}</h2></div>
        <button v-if="collapsibleInfo" type="button" class="inline-flex shrink-0 items-center gap-1.5 rounded-button border border-gray-200 px-3 py-1.5 text-caption font-semibold text-gray-600 transition hover:border-brand-300 hover:text-brand-700" @click="infoOpen = !infoOpen"><ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': infoOpen }" />{{ infoOpen ? 'Tutup' : 'Buka' }}</button>
      </div>
      <div v-show="!collapsibleInfo || infoOpen">
      <dl v-if="requestInfo" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Dokumen ID</dt><dd class="mt-1 text-small font-semibold text-gray-900">{{ documentInfo.requestId || documentInfo.id || '-' }}</dd></div>
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Nama Dokumen</dt><dd class="mt-1 truncate text-small font-semibold text-gray-900">{{ documentInfo.title || '-' }}</dd></div>
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Client / Vendor Name</dt><dd class="mt-1 truncate text-small font-semibold text-gray-900">{{ documentInfo.partner || '-' }}</dd></div>
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Jenis Permintaan</dt><dd class="mt-1 text-small font-semibold text-gray-900">{{ documentInfo.requestKind || '-' }}</dd></div>
      </dl>
      <dl v-else class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Ticket ID</dt><dd class="mt-1 text-small font-semibold text-gray-900">{{ documentInfo.id || '-' }}</dd></div>
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Status</dt><dd class="mt-1 text-small font-semibold text-gray-900">{{ documentInfo.status || '-' }}</dd></div>
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Mitra / Pemohon</dt><dd class="mt-1 truncate text-small font-semibold text-gray-900">{{ documentInfo.partner || '-' }}</dd></div>
        <div class="rounded-file border border-gray-200 bg-gray-50 p-3"><dt class="text-caption text-gray-500">Jenis Dokumen</dt><dd class="mt-1 text-small font-semibold text-gray-900">{{ documentInfo.type || '-' }}</dd></div>
      </dl>
      <div class="mt-5 border-t border-gray-200 pt-5">
        <slot />
      </div>
      </div>
    </div>

    <div v-else class="p-lg">
      <p class="text-caption font-semibold uppercase tracking-wide text-brand-700">Assignment</p>
      <h2 class="mt-1 text-cardtitle text-gray-900">Document Members</h2>
      <div class="mt-4 space-y-2">
        <div v-for="(roleMembers, role) in groupedMembers" :key="role" class="rounded-file border border-gray-200 bg-gray-50 p-3">
          <p class="mb-2 text-caption font-semibold uppercase tracking-wide text-gray-500">{{ role }}</p>
          <div v-for="member in roleMembers" :key="`${role}-${member.email}`" class="mb-2 flex items-center gap-2.5 rounded-input bg-white p-2.5 last:mb-0">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-small font-bold text-brand-700">{{ initials(member) }}</span>
            <div class="min-w-0">
              <p class="truncate text-small font-semibold text-gray-900">{{ member.name }}</p>
              <p class="truncate text-caption text-gray-500">{{ member.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

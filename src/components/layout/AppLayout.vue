<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

defineProps({
  roleKey: { type: String, required: true },
  user: { type: Object, required: true },
  breadcrumb: { type: Array, default: () => [] },
})

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
</script>

<template>
  <div class="app-shell relative h-screen w-full flex overflow-hidden">
    <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-gray-900/40 lg:hidden" aria-hidden="true" @click="sidebarOpen = false" />
    <Sidebar :role-key="roleKey" :open="sidebarOpen" :collapsed="sidebarCollapsed" @close="sidebarOpen = false" @toggle-collapse="sidebarCollapsed = !sidebarCollapsed" />
    <div class="flex-1 flex flex-col min-w-0">
      <Topbar :user="user" :breadcrumb="breadcrumb" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-[1480px] mx-auto p-3 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

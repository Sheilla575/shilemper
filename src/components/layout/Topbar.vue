<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Search, ChevronRight, LogOut, ChevronDown, Menu } from 'lucide-vue-next'

defineProps({
  user: { type: Object, required: true },
  breadcrumb: { type: Array, default: () => [] }, // [{ label, to }]
  searchPlaceholder: { type: String, default: 'Search request ID or document title...' },
})

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const profileOpen = ref(false)

function handleLogout() {
  // In a real app, you would clear auth tokens here
  router.push('/login')
}
</script>

<template>
  <header class="relative z-50 h-topbar shrink-0 border-b border-gray-200/80 bg-white/95 backdrop-blur flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-lg">
    <div class="flex items-center gap-lg min-w-0">
      <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-button text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Open navigation" @click="emit('toggle-sidebar')">
        <Menu class="h-5 w-5" />
      </button>
      <nav v-if="breadcrumb.length" class="hidden md:flex items-center gap-1 text-small text-gray-500 shrink-0">
        <template v-for="(crumb, i) in breadcrumb" :key="i">
          <span :class="i === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : ''">{{ crumb }}</span>
          <ChevronRight v-if="i < breadcrumb.length - 1" class="h-3.5 w-3.5" />
        </template>
      </nav>
      <div class="relative hidden lg:block w-[min(34vw,420px)]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
        <input
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full h-9 rounded-input border-0 bg-gray-100/80 pl-9 pr-3 text-small text-gray-700 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>
    </div>

    <div class="flex items-center gap-1 sm:gap-lg shrink-0">
      <button class="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-50" aria-label="Notifications">
        <Bell class="h-4.5 w-4.5 text-gray-500" />
        <span class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
      </button>
      <div class="relative">
        <button type="button" class="flex items-center gap-3 rounded-input px-2 py-1.5 hover:bg-gray-50" aria-label="Open profile menu" @click="profileOpen = !profileOpen">
          <div class="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-small font-semibold">
            {{ user.initials }}
          </div>
          <div class="hidden sm:block text-left leading-tight pr-1">
            <p class="text-small font-semibold text-gray-900">{{ user.name }}</p>
            <p class="text-caption text-gray-500">{{ user.division }}</p>
          </div>
          <ChevronDown class="h-4 w-4 text-gray-400" />
        </button>

        <div v-if="profileOpen" class="absolute right-0 top-full z-[100] mt-2 w-[min(14rem,calc(100vw-1.5rem))] rounded-card border border-gray-200 bg-white p-2 shadow-modal">
          <div class="px-3 py-2 border-b border-gray-100">
            <p class="text-small font-semibold text-gray-900">{{ user.name }}</p>
            <p class="text-caption text-gray-500">{{ user.division }}</p>
          </div>
          <button type="button" class="mt-1 flex w-full items-center gap-2 rounded-button px-3 py-2 text-small font-medium text-danger hover:bg-danger-light" @click="handleLogout">
            <LogOut class="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

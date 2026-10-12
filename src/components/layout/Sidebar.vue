<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  History,
  ClipboardCheck,
  Users,
  Scale,
  Menu,
  UserCheck,
} from "lucide-vue-next";

const props = defineProps({
  roleKey: { type: String, required: true }, // nonlegal | legal
  open: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
});

defineEmits(["close", "toggle-collapse"]);

const route = useRoute();

const NAV = {
  nonlegal: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/requestor/dashboard" },
    { label: "PENGAJUAN DOKUMEN", section: true },
    {
      label: "Buat Pengajuan",
      icon: FilePlus2,
      to: "/requestor/requests/create",
    },
    { label: "Pengajuan Saya", icon: FileText, to: "/requestor/requests" },

    { label: "Riwayat Pengajuan", icon: History, to: "/requestor/history" },
    { label: "ACTIVITY F02", section: true },
    {
      label: "Assigned Review Tasks",
      icon: ClipboardCheck,
      to: "/collaborator/tasks",
    },
    {
      label: "Pemeriksaan Hasil Review",
      icon: UserCheck,
      to: "/collaborator/internal-review/RVW-2026-0042-01",
    },
    {
      label: "Review Client",
      icon: ClipboardCheck,
      to: "/requestor/client-reviews-list",
    },
    { label: "Riwayat Review", icon: History, to: "/collaborator/history" },
  ],
  legal: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/legal/dashboard" },
    {
      label: "Validation Queue",
      icon: ClipboardCheck,
      to: "/legal/validation",
    },
    { label: "Open Tasks", icon: FileText, to: "/legal/tasks" },
    { label: "My Reviews", icon: Scale, to: "/legal/reviews" },
    { label: "History & Audit", icon: History, to: "/legal/history" },
  ],
};

const items = computed(() => NAV[props.roleKey] || []);
// Pick only the most specific matching route so /requests/create does not
// highlight both "Buat Request" and the parent "My Requests" menu.
const activeRoute = computed(
  () =>
    items.value
      .filter((item) => !item.section)
      .filter(
        (item) =>
          route.path === item.to || route.path.startsWith(`${item.to}/`),
      )
      .sort((a, b) => b.to.length - a.to.length)[0]?.to,
);
const isActive = (to) => activeRoute.value === to;
const roleLabel = { nonlegal: "NON-LEGAL", legal: "TEAM LEGAL" };
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 w-sidebar shrink-0 border-r border-gray-200 bg-white h-full flex flex-col shadow-[2px_0_12px_rgba(15,23,42,0.12)] transition-all duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-[2px_0_12px_rgba(15,23,42,0.03)]"
    :class="[
      props.open ? 'translate-x-0' : '-translate-x-full',
      props.collapsed ? 'lg:w-20' : 'lg:w-sidebar',
    ]"
  >
    <div
      class="h-topbar flex items-center gap-2 px-lg border-b border-gray-200"
      :class="props.collapsed ? 'lg:justify-center lg:px-2' : ''"
    >
      <button
        type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-button text-gray-600 hover:bg-gray-100"
        :aria-label="props.collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'"
        :title="props.collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'"
        @click="$emit('toggle-collapse')"
      >
        <Menu class="h-5 w-5" />
      </button>
      <div
        v-if="!props.collapsed"
        class="h-8 w-8 rounded-md bg-brand-700 flex items-center justify-center text-white text-small font-bold shadow-sm"
      >
        <span class="text-[15px]">S</span>
      </div>
      <div v-if="!props.collapsed" class="leading-none">
        <p class="text-bodystrong text-gray-900">SITRACK</p>
        <p class="text-caption text-gray-500">Legal Review System</p>
      </div>
    </div>

    <div
      class="mx-3 mt-4 rounded-input bg-gray-50 px-3 py-2 flex items-center justify-between"
      :class="props.collapsed ? 'lg:mx-2 lg:justify-center lg:px-1' : ''"
    >
      <span
        v-if="!props.collapsed"
        class="text-caption font-semibold tracking-wide text-gray-500"
        >ROLE</span
      >
      <span
        class="text-[10px] font-bold tracking-wide text-brand-700 bg-brand-100 rounded-badge px-2 py-1"
        >{{ roleLabel[roleKey] }}</span
      >
    </div>

    <p
      v-if="!props.collapsed"
      class="px-4 pt-5 pb-2 text-[10px] font-bold tracking-[0.12em] text-gray-400"
    >
      MAIN MENU
    </p>
    <nav class="flex-1 px-sm space-y-1 overflow-y-auto">
      <template v-for="item in items" :key="item.to || item.label">
        <p
          v-if="item.section && !props.collapsed"
          class="px-3 pt-4 pb-1 text-[10px] font-bold tracking-[0.12em] text-gray-400"
        >
          {{ item.label }}
        </p>
        <router-link
          v-else
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-body transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-brand-600 text-white font-semibold shadow-sm'
              : 'text-gray-700 hover:bg-gray-50'
          "
          :title="props.collapsed ? item.label : undefined"
        >
          <component
            :is="item.icon"
            class="h-4 w-4 shrink-0"
            :stroke-width="2"
          />
          <span v-if="!props.collapsed">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <div v-if="!props.collapsed" class="px-lg py-md border-t border-gray-200">
      <p class="text-caption text-gray-500">SITRACK v1.0 · Enterprise</p>
    </div>
  </aside>
</template>

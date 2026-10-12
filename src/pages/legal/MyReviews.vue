<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowRight, Users2, Download } from "lucide-vue-next";
import AppLayout from "../../components/layout/AppLayout.vue";
import Button from "../../components/ui/Button.vue";
import Badge from "../../components/ui/Badge.vue";
import { USERS } from "../../data/users";
import { REVIEW_TASKS, REVIEW_STATUS_CONFIG } from "../../data/legal";
import { REQUESTS } from "../../data/requests";
import { formatDate, formatDateTime } from "../../utils/format";

const router = useRouter();
const user = USERS.legal;
const tab = ref("ongoing"); // 'ongoing' | 'completed'

const ongoing = computed(() =>
  REVIEW_TASKS.filter((t) => t.status !== "COMPLETED"),
);
const completed = computed(() =>
  REQUESTS.filter(
    (r) => r.status === "REVIEW_COMPLETED" || r.status === "COMPLETED",
  ),
);
</script>

<template>
  <AppLayout
    role-key="legal"
    :user="user"
    :breadcrumb="['Portal Tim Legal', 'Review Saya']"
  >
    <div class="flex items-center justify-between mb-2xl gap-lg flex-wrap">
      <div>
        <h1 class="text-pagetitle text-gray-900">Review Saya</h1>
        <p class="mt-1 text-small text-gray-500">
          Ringkasan tugas telaah hukum yang sedang berjalan maupun yang sudah
          Anda selesaikan.
        </p>
      </div>
      <Button variant="secondary"
        ><template #icon-left><Download class="h-4 w-4" /></template>Ekspor
        Riwayat</Button
      >
    </div>

    <div class="flex items-center gap-2 mb-lg">
      <button
        class="h-9 px-4 rounded-input text-small font-semibold border"
        :class="
          tab === 'ongoing'
            ? 'border-brand-500 bg-brand-50 text-brand-700'
            : 'border-gray-200 text-gray-700'
        "
        @click="tab = 'ongoing'"
      >
        Sedang Berjalan ({{ ongoing.length }})
      </button>
      <button
        class="h-9 px-4 rounded-input text-small font-semibold border"
        :class="
          tab === 'completed'
            ? 'border-brand-500 bg-brand-50 text-brand-700'
            : 'border-gray-200 text-gray-700'
        "
        @click="tab = 'completed'"
      >
        Selesai ({{ completed.length }})
      </button>
    </div>

    <div
      v-if="tab === 'ongoing'"
      class="rounded-card border border-gray-200 bg-white shadow-card divide-y divide-gray-100"
    >
      <div
        v-for="t in ongoing"
        :key="t.taskId"
        class="flex items-center justify-between px-2xl py-lg gap-lg"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-bodystrong text-brand-700">{{ t.requestId }}</p>
            <Badge
              :label="REVIEW_STATUS_CONFIG[t.status].label"
              :tone="REVIEW_STATUS_CONFIG[t.status].tone"
            />
          </div>
          <p class="mt-0.5 text-body text-gray-900">{{ t.title }}</p>
          <p
            class="text-caption text-gray-500 flex items-center gap-1.5 mt-0.5"
          >
            {{ t.partner }}
            <template v-if="t.collaborator"
              >· <Users2 class="h-3 w-3 inline" />
              {{ t.collaborator.name }}</template
            >
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            @click="router.push(`/legal/reviews/${t.taskId}`)"
          >
            Lanjutkan
            <template #icon-right><ArrowRight class="h-3.5 w-3.5" /></template>
          </Button>
        </div>
      </div>
      <div
        v-if="ongoing.length === 0"
        class="px-2xl py-12 text-center text-small text-gray-500"
      >
        Tidak ada review yang sedang berjalan.
      </div>
    </div>

    <div
      v-else
      class="rounded-card border border-gray-200 bg-white shadow-card divide-y divide-gray-100"
    >
      <div
        v-for="r in completed"
        :key="r.id"
        class="flex items-center justify-between px-2xl py-lg gap-lg"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-bodystrong text-brand-700">{{ r.id }}</p>
            <Badge :status="r.status" />
          </div>
          <p class="mt-0.5 text-body text-gray-900">{{ r.title }}</p>
          <p class="text-caption text-gray-500">
            {{ r.partner }} · Selesai {{ formatDate(r.updatedAt) }}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          @click="router.push('/legal/history')"
          >Lihat Riwayat</Button
        >
      </div>
      <div
        v-if="completed.length === 0"
        class="px-2xl py-12 text-center text-small text-gray-500"
      >
        Belum ada review yang selesai.
      </div>
    </div>
  </AppLayout>
</template>

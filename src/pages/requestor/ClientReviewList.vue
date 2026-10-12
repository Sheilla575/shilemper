<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  FileText,
  Search,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-vue-next";
import AppLayout from "../../components/layout/AppLayout.vue";
import Button from "../../components/ui/Button.vue";
import Badge from "../../components/ui/Badge.vue";
import { USERS } from "../../data/users";
import { REQUESTS } from "../../data/requests";
import { formatDateTime } from "../../utils/format";

const router = useRouter();
const user = USERS.requestor;

const searchQuery = ref("");

const clientTasks = computed(() => {
  const base = [
    {
      taskId: "RVW-2026-0042-01",
      requestId: "REQ-2026-0042",
      title:
        "Draft Kontrak Jasa Pre-FEED — New Marine Facilities for New FSRU Jawa Barat",
      partner: "PT Nusantara Regas",
      classification: "Komersial",
      updatedAt: "2026-09-10T14:30:00",
      status: "AWAITING_CLIENT_INPUT",
      reviewer: "Ahmad Fauzi, S.H. (Legal) & Dimas Suryo, S.E. (Tax & Finance)",
      itemsCount: 7,
    },
    {
      taskId: "RVW-2026-0038-01",
      requestId: "REQ-2026-0038",
      title: "Perjanjian Sewa Lahan Fasilitas Terminal Maritim Cilacap",
      partner: "PT Pelabuhan Samudra Indah",
      classification: "Pengadaan",
      updatedAt: "2026-09-07T14:20:00",
      status: "AWAITING_CLIENT_INPUT",
      reviewer: "Ahmad Fauzi, S.H. (Legal)",
      itemsCount: 4,
    },
  ];

  if (!searchQuery.value) return base;
  const q = searchQuery.value.toLowerCase();
  return base.filter(
    (t) =>
      t.taskId.toLowerCase().includes(q) ||
      t.requestId.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.partner.toLowerCase().includes(q),
  );
});

function openTaskDetail(taskId) {
  router.push(`/requestor/client-reviews/${taskId}`);
}
</script>

<template>
  <AppLayout
    role-key="nonlegal"
    :user="user"
    :breadcrumb="['Portal Non-Legal', 'Review Client', 'Daftar Tugas']"
  >
    <div class="mb-2xl flex flex-wrap items-start justify-between gap-lg">
      <div>
        <h1 class="text-pagetitle text-gray-900">Daftar Review Client (F02)</h1>
        <p class="mt-1 text-body text-gray-500">
          Tugas telaah kontrak yang membutuhkan masukan & tanggapan pada kolom
          On Review dari pengaju (Requestor).
        </p>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div
      class="mb-2xl flex flex-wrap items-center justify-between gap-md rounded-card border border-gray-200 bg-white p-lg shadow-card"
    >
      <div class="relative flex-1 min-w-[280px]">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari Task ID, Request ID, Judul, atau Partner…"
          class="h-10 w-full rounded-input border border-gray-200 pl-9 pr-4 text-small text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div class="text-caption text-gray-500">
        Menampilkan
        <span class="font-semibold text-gray-900">{{
          clientTasks.length
        }}</span>
        tugas review client
      </div>
    </div>

    <!-- Task List Table -->
    <div
      class="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card"
    >
      <table class="w-full text-left text-body">
        <thead
          class="bg-gray-50 border-b border-gray-200 text-caption font-semibold uppercase tracking-wide text-gray-500"
        >
          <tr>
            <th class="px-lg py-3.5">Task & Request ID</th>
            <th class="px-lg py-3.5">Judul Dokumen & Partner</th>
            <th class="px-lg py-3.5">Tim Reviewer</th>
            <th class="px-lg py-3.5">Poin Review</th>
            <th class="px-lg py-3.5">Status</th>
            <th class="px-lg py-3.5 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="task in clientTasks"
            :key="task.taskId"
            class="hover:bg-brand-50/50 cursor-pointer transition"
            @click="openTaskDetail(task.taskId)"
          >
            <td class="px-lg py-4">
              <span class="block text-small font-bold text-gray-900">{{
                task.taskId
              }}</span>
              <span class="text-caption text-gray-500">{{
                task.requestId
              }}</span>
            </td>
            <td class="px-lg py-4 max-w-md">
              <p class="text-small font-semibold text-gray-900 line-clamp-2">
                {{ task.title }}
              </p>
              <p class="mt-0.5 text-caption text-gray-500">
                {{ task.partner }} · {{ task.classification }}
              </p>
            </td>
            <td class="px-lg py-4">
              <p class="text-small text-gray-700 font-medium">
                {{ task.reviewer }}
              </p>
              <p class="text-caption text-gray-400">
                Update: {{ formatDateTime(task.updatedAt) }}
              </p>
            </td>
            <td class="px-lg py-4">
              <span
                class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-caption font-bold text-brand-700 border border-brand-200"
              >
                <FileText class="h-3.5 w-3.5" /> {{ task.itemsCount }} Poin
                Review
              </span>
            </td>
            <td class="px-lg py-4">
              <Badge label="Dibutuhkan Tanggapan Client" tone="warning" />
            </td>
            <td class="px-lg py-4 text-center">
              <Button
                variant="primary"
                size="sm"
                @click="openTaskDetail(task.taskId)"
              >
                <template #icon-right
                  ><ArrowRight class="h-3.5 w-3.5" /></template
                >Detail
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>

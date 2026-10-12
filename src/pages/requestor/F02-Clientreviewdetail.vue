<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Eye,
  Download,
  FileText,
  File,
  Lock,
  ChevronDown,
  MessageSquare,
  Send,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  FileCheck,
} from "lucide-vue-next";
import AppLayout from "../../components/layout/AppLayout.vue";
import Button from "../../components/ui/Button.vue";
import Badge from "../../components/ui/Badge.vue";
import Modal from "../../components/ui/Modal.vue";
import PdfPreviewPanel from "../../components/document/PdfPreviewPanel.vue";
import DocumentMembers from "../../components/document/DocumentMembers.vue";
import DocumentProgress from "../../components/request/DocumentProgress.vue";
import ReviewCycleHistory from "../../components/review/ReviewCycleHistory.vue";
import RowCommentSidebar from "../../components/review/RowCommentSidebar.vue";
import { USERS } from "../../data/users";
import { getCollabTaskById } from "../../data/collaborator";
import { getReviewTaskById } from "../../data/legal";
import { getActiveCycle, getCyclesByRequest } from "../../data/reviewCycles";
import { REQUEST_DETAIL, getDocumentProgress } from "../../data/requests";
import { formatDateTime } from "../../utils/format";
import { getDocumentMembers } from "../../data/documentMembers";

const route = useRoute();
const router = useRouter();
const user = USERS.requestor;
const documentMembers = getDocumentMembers();
const ticketTab = ref("info");
const documentInfoOpen = ref(true);

const taskId = computed(() => route.params.taskId || "RVW-2026-0042-01");
const task = computed(
  () => getCollabTaskById(taskId.value) || getReviewTaskById(taskId.value),
);
const activeCycle = computed(() =>
  task.value ? getActiveCycle(task.value.requestId) : null,
);
const requestWorkflow = computed(() => REQUEST_DETAIL.workflow);
const documentProgress = computed(() =>
  getDocumentProgress(requestWorkflow.value),
);

const rows = ref(
  task.value
    ? task.value.reviewTable.map((r) => ({ ...r, onReview: r.onReview || "" }))
    : [],
);

const previewDocument = ref(null);
const documentsOpen = ref(true);

// Interactive Stage Controls
const isUnlockedForInput = ref(false);
const showSubmitModal = ref(false);
const showInternalProcessModal = ref(false);
const submittedProcess = ref(false);
const internalProcessDone = ref(false);
const validationError = ref("");
const autoDownloadToast = ref(false);

// Active Cycle Upload States
const revisionFile = ref(null);
const mandatoryPdfFile = ref(null);

const kadivList = ref([
  {
    id: "k-1",
    name: "Ahmad Fauzi, S.H.",
    role: "Kepala Divisi Legal Corporate",
    avatar: "AF",
  },
  {
    id: "k-2",
    name: "Budi Santoso",
    role: "Kepala Divisi Commercial & Sales",
    avatar: "BS",
  },
  {
    id: "k-3",
    name: "Dimas Suryo, S.E., Ak.",
    role: "Kepala Divisi Tax & Finance",
    avatar: "DS",
  },
  {
    id: "k-4",
    name: "Sri Wulandari, S.T.",
    role: "Kepala Divisi Technical Engineering",
    avatar: "SW",
  },
]);

const workspaceCycle = computed(
  () =>
    activeCycle.value ||
    getCyclesByRequest(task.value?.requestId).at(-1) || {
      cycleId: task.value?.taskId,
      cycleNumber: 0,
      status: "ACTIVE",
      revisionDocument:
        task.value?.mainDocument?.name || "Draft_Kontrak_REQ-2026-0042.pdf",
      items: rows.value,
      startedAt: task.value?.startedAt || task.value?.assignedAt,
    },
);

const isCommentSidebarOpen = ref(false);
const activeCommentRow = ref(null);
const activeCommentCycleLabel = ref("");

function openRowComments(row, cycleLabel = "") {
  activeCommentRow.value = row;
  activeCommentCycleLabel.value =
    cycleLabel ||
    (workspaceCycle.value
      ? `Cycle ${workspaceCycle.value.cycleNumber} (Aktif)`
      : "Cycle Aktif");
  isCommentSidebarOpen.value = true;
}

function handleOpenHistoryComments({ item, cycleLabel }) {
  openRowComments(item, cycleLabel);
}

function openPreview(name) {
  previewDocument.value = { name };
}

function previewRevisionDocument() {
  if (!workspaceCycle.value) return;
  previewDocument.value = {
    name: workspaceCycle.value.revisionDocument,
    source:
      workspaceCycle.value.documentUrl ||
      "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  };
}

function downloadRevisionDocument() {
  if (!workspaceCycle.value) return;
  const link = window.document.createElement("a");
  link.href =
    workspaceCycle.value.documentUrl ||
    "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
  link.download =
    workspaceCycle.value.revisionDocument ||
    `Cycle-${workspaceCycle.value.cycleNumber}.pdf`;
  link.target = "_blank";
  link.click();
}

function exportReviewToDoc() {
  const escape = (value) =>
    String(value || "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[char],
    );
  const text = (value) =>
    escape(
      String(value || "")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " "),
    );
  const body = rows.value
    .map(
      (row) =>
        "<tr><td>" +
        row.no +
        "</td><td>" +
        text(row.clause) +
        "</td><td>" +
        text(row.comment) +
        "</td><td>" +
        text(row.onReview) +
        "</td></tr>",
    )
    .join("");
  const html =
    '<html><head><meta charset="utf-8"></head><body><h1>Hasil Review Dokumen ' +
    taskId.value +
    '</h1><table border="1"><tr><th>No.</th><th>KLAUSUL KONTRAK</th><th>CATATAN / REVIEW</th><th>ON REVIEW</th></tr>' +
    body +
    "</table></body></html>";
  const url = URL.createObjectURL(
    new Blob([html], { type: "application/msword" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "Review-" + taskId.value + ".doc";
  link.click();
  URL.revokeObjectURL(url);
}

function closePreview() {
  previewDocument.value = null;
}

function handleRevisionFileChange(event) {
  const file = event.target.files?.[0];
  if (file) {
    revisionFile.value = file;
  }
}

function handleMandatoryPdfChange(event) {
  const file = event.target.files?.[0];
  if (file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      validationError.value =
        "Dokumen lampiran review wajib berupa file format PDF!";
      return;
    }
    validationError.value = "";
    mandatoryPdfFile.value = file;
  }
}

function removeRevisionFile() {
  revisionFile.value = null;
}

function removeMandatoryPdfFile() {
  mandatoryPdfFile.value = null;
}

function updateOnReviewCell(row, event) {
  row.onReview =
    event.currentTarget.innerText || event.currentTarget.value || "";
  row.updatedAt = new Date().toISOString();
}

function handleProcessClientResponse() {
  validationError.value = "";

  // Stage 1 Trigger: If not unlocked yet, auto-download export file & unlock section/inputs
  if (!isUnlockedForInput.value) {
    exportReviewToDoc();
    isUnlockedForInput.value = true;
    autoDownloadToast.value = true;
    setTimeout(() => {
      autoDownloadToast.value = false;
    }, 5000);
    return;
  }

  // Stage 2 Trigger: Validate mandatory PDF attachment
  if (!mandatoryPdfFile.value) {
    validationError.value =
      "Lampiran Review format PDF wajib diunggah sebelum menyimpan atau mengembalikan hasil review!";
    return;
  }
  showSubmitModal.value = true;
}

function confirmSubmitClientReview() {
  if (task.value) {
    task.value.reviewTable = rows.value.map((r) => ({ ...r }));
  }
  submittedProcess.value = true;
  showSubmitModal.value = false;
}

function confirmInternalProcess() {
  internalProcessDone.value = true;
  showInternalProcessModal.value = false;
}
</script>

<template>
  <AppLayout
    role-key="nonlegal"
    :user="user"
    :breadcrumb="['Portal Requestor', 'Review Client (F02)', taskId]"
  >
    <template v-if="task">
      <!-- Header with Dual Action Buttons -->
      <div class="flex items-start justify-between mb-2xl gap-lg flex-wrap">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-small font-semibold text-gray-500">{{
              taskId
            }}</span>
            <Badge label="Client Review Detail (F02)" tone="brand" />
            <Badge
              :label="
                submittedProcess
                  ? 'Tanggapan Terkirim'
                  : isUnlockedForInput
                    ? 'Dalam Pengisian Tanggapan'
                    : 'Mode Baca (Terkunci)'
              "
              :tone="
                submittedProcess
                  ? 'success'
                  : isUnlockedForInput
                    ? 'warning'
                    : 'gray'
              "
            />
          </div>
          <h1 class="mt-2 text-pagetitle text-gray-900 max-w-3xl">
            Review Client (F02) — {{ task.title }}
          </h1>
          <p class="mt-1 text-body text-gray-500">
            {{ task.requestId }} · {{ task.partner }} ·
            {{ task.classification }}
          </p>
        </div>

        <!-- Dual Side-by-Side Action Buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            @click="router.push('/requestor/client-reviews-list')"
          >
            <template #icon-left><ArrowLeft class="h-4 w-4" /></template>Kembali
          </Button>

          <!-- Button 2: Submit Internal Review -->
          <Button
            variant="secondary"
            class="border-purple-300 text-purple-700 hover:bg-purple-50"
            @click="showInternalProcessModal = true"
          >
            <template #icon-left
              ><UserCheck class="h-4 w-4 text-purple-600" /></template
            >Submit Internal Review
          </Button>

          <!-- Button 1: Process & Kirim Tanggapan Client -->
          <Button
            variant="primary"
            :disabled="submittedProcess"
            @click="handleProcessClientResponse"
          >
            <template #icon-left><Send class="h-4 w-4" /></template>
            {{
              isUnlockedForInput
                ? "Kirim Hasil Tanggapan Client"
                : "Process & Kirim Tanggapan Client"
            }}
          </Button>
        </div>
      </div>

      <!-- Auto Download Toast Banner -->
      <div
        v-if="autoDownloadToast"
        class="rounded-card border border-brand-300 bg-brand-50 p-lg mb-2xl flex items-center gap-3 shadow-md animate-fade-in"
      >
        <FileCheck class="h-5 w-5 text-brand-700 shrink-0" />
        <div>
          <p class="text-bodystrong text-brand-950 font-semibold">
            File Review Otomatis Terunduh!
          </p>
          <p class="text-small text-brand-800 mt-0.5">
            Dokumen hasil review (`Review-{{ taskId }}.doc`) telah diunduh. Form
            upload dokumen dan kolom On Review kini aktif untuk diisi.
          </p>
        </div>
      </div>

      <!-- Info Guidance Banner -->
      <div
        class="rounded-card border border-brand-200 bg-brand-50/60 p-lg mb-2xl"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-circle bg-brand-100 text-brand-700"
          >
            <FileText class="h-5 w-5" />
          </div>
          <div>
            <p class="text-bodystrong text-gray-900 font-semibold">
              Skenario Pengisian Review Client (F02)
            </p>
            <p class="text-small text-gray-700 mt-0.5">
              <span v-if="!isUnlockedForInput">
                Klik tombol
                <span class="font-bold text-brand-700"
                  >"Process & Kirim Tanggapan Client"</span
                >
                untuk mendownload file export hasil review, membuka kolom On
                Review, serta memunculkan form unggah dokumen revisi & lampiran
                PDF wajib.
              </span>
              <span v-else>
                Kolom
                <span class="font-bold text-brand-700">On Review</span> dan form
                unggah dokumen telah aktif. Isikan masukan Anda dan pastikan
                mengunggah
                <span class="font-bold text-danger"
                  >Lampiran Review Format PDF</span
                >
                sebelum melakukan pengiriman.
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Validation Alert -->
      <div
        v-if="validationError"
        class="rounded-card border border-danger bg-danger-light/40 p-lg mb-2xl flex items-center gap-3"
      >
        <AlertCircle class="h-5 w-5 text-danger shrink-0" />
        <p class="text-bodystrong text-danger">{{ validationError }}</p>
      </div>

      <div
        v-if="submittedProcess"
        class="rounded-card border border-success bg-success-light/40 p-lg mb-2xl flex items-center gap-3"
      >
        <CheckCircle2 class="h-5 w-5 text-success shrink-0" />
        <div>
          <p class="text-bodystrong text-success">
            Tanggapan Client Review Terkirim
          </p>
          <p class="text-small text-gray-700 mt-0.5">
            Tanggapan pada kolom On Review beserta dokumen lampiran PDF telah
            dikirimkan ke Tim Legal untuk penelaahan selanjutnya.
          </p>
        </div>
      </div>

      <div
        v-if="internalProcessDone"
        class="rounded-card border border-purple-300 bg-purple-50 p-lg mb-2xl flex items-center gap-3"
      >
        <UserCheck class="h-5 w-5 text-purple-700 shrink-0" />
        <div>
          <p class="text-bodystrong text-purple-950 font-semibold">
            Proses Internal Review Terkirim ke Kepala Divisi
          </p>
          <p class="text-small text-purple-800 mt-0.5">
            Notifikasi review internal telah diteruskan kepada Kepala Divisi
            Legal, Komersial, Keuangan & Teknikal.
          </p>
        </div>
      </div>

      <!-- Review Workspace Table & Active Cycle Upload Controls -->
      <ReviewCycleHistory
        :request-id="task.requestId"
        :workspace-cycle-id="workspaceCycle.cycleId"
        :fallback-cycle="workspaceCycle"
        @open-comments="handleOpenHistoryComments"
      >
        <template #active>
          <div class="space-y-2xl">
            <!-- Export Document Cards Section (Inside Active Cycle Card) -->
            <div
              class="rounded-card border border-brand-200 bg-brand-50/30 p-2xl shadow-sm"
            >
              <div
                class="flex items-center justify-between mb-lg flex-wrap gap-2"
              >
                <div>
                  <h3 class="text-cardtitle text-gray-900">
                    Dokumen Export Review Final (Cycle
                    {{ workspaceCycle.cycleNumber }} Aktif)
                  </h3>
                  <p class="text-small text-gray-500 mt-0.5">
                    Dokumen acuan hasil telaah terbaru yang diexport dari tabel
                    review cycle aktif.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  @click="exportReviewToDoc"
                >
                  <template #icon-left
                    ><Download class="h-3.5 w-3.5" /></template
                  >Unduh Word (.doc)
                </Button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div
                  class="flex items-center justify-between rounded-file border border-gray-200 p-lg bg-white shadow-sm"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <FileText class="h-5 w-5 text-brand-700 shrink-0" />
                    <div class="min-w-0">
                      <p class="text-bodystrong text-gray-900 truncate">
                        Review-{{ taskId }}.doc
                      </p>
                      <p class="text-caption text-gray-500">
                        Hasil Export Ringkasan Review Table (MS Word)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-brand-700 hover:underline text-caption font-semibold"
                    @click="exportReviewToDoc"
                  >
                    Unduh
                  </button>
                </div>
                <div
                  class="flex items-center justify-between rounded-file border border-gray-200 p-lg bg-white shadow-sm"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <FileText class="h-5 w-5 text-danger shrink-0" />
                    <div class="min-w-0">
                      <p class="text-bodystrong text-gray-900 truncate">
                        Draft_Kontrak_Final_Cycle.pdf
                      </p>
                      <p class="text-caption text-gray-500">
                        Dokumen Kontrak dengan Catatan Legal & Kolaborator
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-brand-700 hover:underline text-caption font-semibold"
                    @click="previewRevisionDocument"
                  >
                    Pratinjau
                  </button>
                </div>
              </div>
            </div>

            <!-- Active Cycle Upload Section (HIDDEN IN STAGE 1, UNHIDDEN IN STAGE 2) -->
            <div
              v-if="isUnlockedForInput"
              class="rounded-card border border-brand-300 bg-white p-2xl shadow-card transition-all duration-300"
            >
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-cardtitle text-gray-900">
                  Unggah Dokumen Client Review (Cycle Aktif)
                </h3>
                <span
                  class="rounded-badge bg-brand-50 px-2.5 py-1 text-caption font-semibold text-brand-700"
                  >Form Aktif</span
                >
              </div>
              <p class="text-small text-gray-500 mb-xl">
                Lampirkan dokumen revisi kontrak dan file hasil review format
                PDF sebelum menyimpan/mengirim tanggapan.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <!-- Upload Input 1: Dokumen Revisi Kontrak (Optional/Draft) -->
                <div
                  class="rounded-input border border-dashed border-gray-300 bg-gray-50/60 p-xl transition hover:border-brand-400"
                >
                  <div class="flex flex-col items-center text-center">
                    <Upload class="h-7 w-7 text-gray-400 mb-2" />
                    <p class="text-small font-semibold text-gray-900">
                      1. Dokumen Revisi Kontrak
                    </p>
                    <p class="text-caption text-gray-500 mb-3">
                      Format DOCX, DOC, atau PDF (Opsional)
                    </p>

                    <label
                      class="cursor-pointer inline-flex items-center gap-1.5 rounded-button border border-gray-300 bg-white px-3 py-1.5 text-caption font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-700 shadow-sm transition"
                    >
                      <span>Pilih File Revisi</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        class="hidden"
                        @change="handleRevisionFileChange"
                      />
                    </label>

                    <div
                      v-if="revisionFile"
                      class="mt-3 flex items-center justify-between w-full rounded-md bg-white border border-gray-200 px-3 py-2 text-caption"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <FileText class="h-4 w-4 text-brand-600 shrink-0" />
                        <span class="truncate font-medium text-gray-900">{{
                          revisionFile.name
                        }}</span>
                      </div>
                      <button
                        type="button"
                        class="text-danger hover:underline ml-2"
                        @click="removeRevisionFile"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Upload Input 2: Lampiran Review Format PDF (WAJIB) -->
                <div
                  class="rounded-input border border-dashed border-brand-300 bg-brand-50/30 p-xl transition hover:border-brand-500"
                >
                  <div class="flex flex-col items-center text-center">
                    <Upload class="h-7 w-7 text-brand-600 mb-2" />
                    <p class="text-small font-semibold text-gray-900">
                      2. Lampiran Review Format PDF
                      <span class="text-danger font-bold">*Wajib</span>
                    </p>
                    <p class="text-caption text-gray-500 mb-3">
                      Format file khusus PDF (Mandatory untuk submit)
                    </p>

                    <label
                      class="cursor-pointer inline-flex items-center gap-1.5 rounded-button bg-brand-600 px-3 py-1.5 text-caption font-semibold text-white hover:bg-brand-700 shadow-sm transition"
                    >
                      <span>Unggah PDF Review</span>
                      <input
                        type="file"
                        accept=".pdf"
                        class="hidden"
                        @change="handleMandatoryPdfChange"
                      />
                    </label>

                    <div
                      v-if="mandatoryPdfFile"
                      class="mt-3 flex items-center justify-between w-full rounded-md bg-white border border-brand-200 px-3 py-2 text-caption"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <FileText class="h-4 w-4 text-brand-700 shrink-0" />
                        <span class="truncate font-medium text-gray-900">{{
                          mandatoryPdfFile.name
                        }}</span>
                      </div>
                      <button
                        type="button"
                        class="text-danger hover:underline ml-2"
                        @click="removeMandatoryPdfFile"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Table Header Guidance -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div class="flex items-center gap-2">
                <Lock
                  v-if="!isUnlockedForInput"
                  class="h-4 w-4 text-amber-600"
                />
                <span class="text-small font-medium text-gray-700">
                  <span
                    v-if="!isUnlockedForInput"
                    class="text-amber-800 font-semibold"
                    >Kolom On Review saat ini terkunci. Klik tombol "Process &
                    Kirim Tanggapan Client" untuk membuka pengisian.</span
                  >
                  <span v-else class="text-brand-700 font-semibold"
                    >Kolom On Review aktif. Silakan ketikkan masukan/tanggapan
                    Anda untuk tiap poin.</span
                  >
                </span>
              </div>
              <span class="text-caption text-gray-500"
                >{{
                  rows.filter((r) => (r.onReview || "").trim().length > 0)
                    .length
                }}
                / {{ rows.length }} Tanggapan diisi</span
              >
            </div>

            <!-- Review Table -->
            <div
              class="overflow-x-auto rounded-input border border-gray-200 bg-white shadow-sm"
            >
              <table class="min-w-[760px] w-full text-body">
                <thead class="bg-gray-50">
                  <tr
                    class="border-b border-gray-200 text-left text-caption font-semibold uppercase tracking-wide text-gray-500"
                  >
                    <th class="w-12 p-3">No.</th>
                    <th class="w-[28%] p-3">Klausul Kontrak (Read-Only)</th>
                    <th class="w-[38%] p-3">Catatan / Review (Read-Only)</th>
                    <th class="w-[24%] p-3 text-brand-700">
                      On Review (Input Tanggapan Client)
                    </th>
                    <th class="w-[10%] p-3 text-center">Diskusi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in rows"
                    :key="row.reviewItemId || row.no"
                    class="border-t border-gray-200 align-top hover:bg-gray-50/50 transition"
                  >
                    <!-- Column No -->
                    <td class="p-3 text-gray-500 font-medium">
                      <span>{{ row.no }}</span>
                    </td>

                    <!-- Column 1: Klausul Kontrak (DISABLED / READ-ONLY) -->
                    <td class="p-3">
                      <div
                        class="spreadsheet-cell min-h-[90px] bg-gray-50/80 p-3 rounded-input text-gray-700 text-small border border-gray-200 cursor-not-allowed select-none"
                        v-html="row.clause"
                      ></div>
                      <div class="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          class="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200"
                        >
                          Milik:
                          {{
                            row.ownerName ||
                            (row.ownerRole === "COLLABORATOR"
                              ? "Kolaborator"
                              : "Tim Legal")
                          }}
                        </span>
                      </div>
                    </td>

                    <!-- Column 2: Catatan / Review (DISABLED / READ-ONLY) -->
                    <td class="p-3">
                      <div
                        class="spreadsheet-cell min-h-[90px] bg-gray-50/80 p-3 rounded-input text-gray-700 text-small border border-gray-200 cursor-not-allowed select-none"
                        v-html="
                          row.comment ||
                          '<span class=&quot;text-gray-400 italic&quot;>Tidak ada catatan</span>'
                        "
                      ></div>
                      <div
                        class="mt-2 flex items-center justify-between text-caption text-gray-500"
                      >
                        <span
                          >Penelaah: {{ row.reviewer || "Tim Reviewer" }}</span
                        >
                      </div>
                    </td>

                    <!-- Column 3: On Review (EDITABLE ONLY AFTER UNLOCKED BY PROCESS BUTTON) -->
                    <td class="p-3">
                      <textarea
                        v-model="row.onReview"
                        :disabled="!isUnlockedForInput || submittedProcess"
                        rows="4"
                        :placeholder="
                          isUnlockedForInput
                            ? 'Tuliskan masukan, tanggapan, atau persetujuan Requestor untuk poin klausul ini…'
                            : 'Kolom ini terkunci. Klik tombol Process & Kirim Tanggapan Client di atas untuk membuka pengisian.'
                        "
                        class="w-full rounded-input border p-3 text-small transition shadow-sm"
                        :class="
                          isUnlockedForInput && !submittedProcess
                            ? 'border-brand-300 bg-white text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100'
                            : 'border-gray-200 bg-gray-50/80 text-gray-500 cursor-not-allowed'
                        "
                        @input="updateOnReviewCell(row, $event)"
                      ></textarea>
                    </td>

                    <!-- Column 4: Aksi (Discussion drawer only, NO approve/reject, NO delete) -->
                    <td class="p-3 text-center">
                      <button
                        type="button"
                        class="relative inline-flex items-center gap-1.5 rounded-button border border-gray-200 bg-white px-2.5 py-1.5 text-caption font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 transition shadow-sm"
                        title="Buka Diskusi Komentar Poin Ini"
                        @click="openRowComments(row)"
                      >
                        <MessageSquare class="h-4 w-4 text-brand-600" />
                        Diskusi
                        <span
                          v-if="(row.comments || []).length"
                          class="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm"
                        >
                          {{ row.comments.length }}
                        </span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Bottom Action Bar with Dual Side-by-Side Buttons -->
            <div
              class="mt-xl flex flex-wrap items-center justify-between gap-4 rounded-input border border-brand-200 bg-brand-50/50 p-4"
            >
              <div>
                <p class="text-bodystrong text-gray-900 font-semibold">
                  Proses Tanggapan Client (On Review)
                </p>
                <p class="text-caption text-gray-600 mt-0.5">
                  <span v-if="!isUnlockedForInput"
                    >Klik "Process & Kirim Tanggapan Client" untuk mengunduh
                    file review dan membuka pengisian.</span
                  >
                  <span v-else
                    >Pastikan dokumen lampiran format PDF telah terunggah
                    sebelum mengirimkan hasil review kembali ke Tim Legal.</span
                  >
                </p>
              </div>

              <!-- Side-by-Side Action Buttons -->
              <div class="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  class="border-purple-300 text-purple-700 hover:bg-purple-50"
                  @click="showInternalProcessModal = true"
                >
                  <template #icon-left
                    ><UserCheck class="h-4 w-4 text-purple-600" /></template
                  >Submit Internal Review
                </Button>

                <Button
                  variant="primary"
                  :disabled="submittedProcess"
                  @click="handleProcessClientResponse"
                >
                  <template #icon-left><Send class="h-4 w-4" /></template>
                  {{
                    isUnlockedForInput
                      ? "Kirim Hasil Tanggapan Client"
                      : "Process & Kirim Tanggapan Client"
                  }}
                </Button>
              </div>
            </div>
          </div>
        </template>
      </ReviewCycleHistory>
    </template>

    <template v-else>
      <div
        class="rounded-card border border-gray-200 bg-white shadow-card p-3xl text-center"
      >
        <File class="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p class="text-cardtitle text-gray-900">
          Task Client Review tidak ditemukan
        </p>
        <p class="mt-1 text-small text-gray-500">
          Task ID "{{ taskId }}" tidak valid.
        </p>
        <Button
          variant="secondary"
          class="mt-lg"
          @click="router.push('/requestor/client-reviews')"
          >Kembali ke Daftar Review</Button
        >
      </div>
    </template>

    <!-- Confirmation Modal Client Review Submit -->
    <Modal
      v-if="showSubmitModal"
      title="Konfirmasi Kirim Tanggapan Client Review"
      max-width="max-w-md"
      @close="showSubmitModal = false"
    >
      <div class="space-y-3 text-small text-gray-700">
        <p>
          Anda akan mengirimkan tanggapan pada kolom
          <span class="font-semibold text-brand-700">On Review</span> beserta
          lampiran dokumen
          <span class="font-semibold text-gray-900">{{
            mandatoryPdfFile?.name
          }}</span>
          untuk task <span class="font-semibold">{{ taskId }}</span
          >.
        </p>
        <div
          class="rounded-input border border-gray-200 bg-gray-50 p-3 text-caption text-gray-600 space-y-1"
        >
          <p class="font-semibold text-gray-900">Ringkasan Dokumen:</p>
          <p>
            • Dokumen Revisi:
            {{ revisionFile ? revisionFile.name : "Tidak disertakan" }}
          </p>
          <p class="text-brand-700 font-medium">
            • Lampiran Review PDF (Wajib): {{ mandatoryPdfFile?.name }}
          </p>
        </div>
        <p class="text-caption text-gray-500">
          Hasil tanggapan ini akan dikirim secara otomatis kepada Tim Legal dan
          Kolaborator yang terlibat.
        </p>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showSubmitModal = false"
          >Batal</Button
        >
        <Button variant="primary" @click="confirmSubmitClientReview"
          >Kirim Tanggapan</Button
        >
      </template>
    </Modal>

    <!-- Internal Review Process Modal -->
    <Modal
      v-if="showInternalProcessModal"
      title="Konfirmasi Submit Internal Review"
      max-width="max-w-md"
      @close="showInternalProcessModal = false"
    >
      <div class="space-y-3 text-small text-gray-700">
        <p>
          Proses
          <span class="font-semibold text-purple-800"
            >Submit Internal Review</span
          >
          akan meneruskan informasi dan ringkasan persetujuan review untuk task
          <span class="font-semibold">{{ taskId }}</span> kepada para Kepala
          Divisi terkait.
        </p>
        <div
          class="rounded-input border border-purple-100 bg-purple-50/60 p-3 text-caption text-gray-700 space-y-2"
        >
          <p class="font-semibold text-purple-950">
            Notifikasi akan dikirimkan kepada:
          </p>
          <div
            v-for="kadiv in kadivList"
            :key="kadiv.id"
            class="flex items-center gap-2"
          >
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800"
              >{{ kadiv.avatar }}</span
            >
            <div>
              <p class="font-medium text-gray-900 leading-none">
                {{ kadiv.name }}
              </p>
              <p class="text-[11px] text-purple-700">{{ kadiv.role }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showInternalProcessModal = false"
          >Batal</Button
        >
        <Button
          variant="primary"
          class="bg-purple-700 hover:bg-purple-800"
          @click="confirmInternalProcess"
          >Process Internal Review</Button
        >
      </template>
    </Modal>

    <PdfPreviewPanel :document="previewDocument" @close="closePreview" />
    <RowCommentSidebar
      :is-open="isCommentSidebarOpen"
      :row="activeCommentRow"
      :cycle-label="activeCommentCycleLabel"
      :actor="user"
      @close="isCommentSidebarOpen = false"
    />
  </AppLayout>
</template>

<style scoped>
.spreadsheet-cell {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>

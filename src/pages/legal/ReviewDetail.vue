<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Eye,
  Download,
  FileText,
  File,
  Users2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Lock,
  ChevronDown,
  MessageSquare,
  Pencil,
  Send,
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
import {
  getReviewTaskById,
  COLLABORATORS,
  ROW_STATUS_CONFIG,
  REVIEW_STATUS_CONFIG,
} from "../../data/legal";
import {
  getActiveCycle,
  completeCycle,
  updateReviewItem,
} from "../../data/reviewCycles";
import {
  REQUEST_DETAIL,
  updateRequestWorkflow,
  getDocumentProgress,
  getRequestById,
} from "../../data/requests";
import { getDocumentMembers } from "../../data/documentMembers";

const route = useRoute();
const router = useRouter();
const user = USERS.legal;
const documentMembers = getDocumentMembers();
const ticketTab = ref("info");
const documentInfoOpen = ref(true);

const task = computed(() => getReviewTaskById(route.params.taskId));
const requestWorkflow = computed(() => REQUEST_DETAIL.workflow);
const documentProgress = computed(() =>
  getDocumentProgress(requestWorkflow.value),
);

// Local editable copy of the review table (mock — would PATCH per row/save draft in production).
const activeCycle = computed(() =>
  task.value ? getActiveCycle(task.value.requestId) : null,
);
const rows = ref(
  task.value
    ? (activeCycle.value?.items || task.value.reviewTable)
        .filter((row) => row.status !== "RESOLVED")
        .map((row, index) => ({
          ...row,
          no: index + 1,
          comment: row.reviewNote ?? row.comment ?? "",
          onReview: row.onReview ?? "",
          reviewer: row.reviewer ?? user.name,
          updatedAt:
            row.updatedAt ??
            row.createdAt ??
            task.value.startedAt ??
            task.value.assignedAt,
        }))
    : [],
);
const needCollaborator = ref(task.value?.needCollaborator ?? false);

const showCollabModal = ref(false);
const showSubmitModal = ref(false);
const showInternalProcessModal = ref(false);
const internalProcessDone = ref(false);
const kadivList = ref([
  { id: 'k-1', name: 'Ahmad Fauzi, S.H.', role: 'Kepala Divisi Legal Corporate', avatar: 'AF' },
  { id: 'k-2', name: 'Budi Santoso', role: 'Kepala Divisi Commercial & Sales', avatar: 'BS' },
  { id: 'k-3', name: 'Dimas Suryo, S.E., Ak.', role: 'Kepala Divisi Tax & Finance', avatar: 'DS' },
  { id: 'k-4', name: 'Sri Wulandari, S.T.', role: 'Kepala Divisi Technical Engineering', avatar: 'SW' },
]);

const approvedCount = computed(() => rows.value.filter(r => r.decision === 'APPROVED').length);
const rejectedCount = computed(() => rows.value.filter(r => r.decision === 'REJECTED').length);

function setRowDecision(row, decision) {
  row.decision = row.decision === decision ? 'PENDING' : decision;
  if (row.decision === 'REJECTED') {
    row.status = 'REVISION';
  } else if (row.decision === 'APPROVED') {
    row.status = 'ACCEPTED';
  }
}

function toggleEditRow(row) {
  row.isEditing = !row.isEditing;
}

function saveAndResubmitRow(row) {
  row.isEditing = false;
  row.updatedAt = new Date().toISOString();
  if (row.decision === 'REJECTED') {
    row.status = 'OPEN';
  }
}

function confirmInternalProcess() {
  saveAndRequestRevision();
  internalProcessDone.value = true;
  showInternalProcessModal.value = false;
}
const selectedCollaborator = ref(null);
const selectedScopes = ref([]);
const collabSearch = ref("");
const savedDraft = ref(false);
const autosaveStatus = ref("idle");
const submitted = ref(false);
const previewDocument = ref(null);
const viewedStage = ref(null);
const activeEditor = ref(null);
const submissionOpen = ref(true);
const documentsOpen = ref(true);

const isCommentSidebarOpen = ref(false);
const activeCommentRow = ref(null);
const activeCommentCycleLabel = ref("");
const activeCommentReadOnly = ref(false);

function openRowComments(row, cycleLabel = "", readOnly = false) {
  activeCommentRow.value = row;
  activeCommentCycleLabel.value =
    cycleLabel ||
    (activeCycle.value
      ? `Cycle ${activeCycle.value.cycleNumber} (Aktif)`
      : "Cycle Aktif");
  activeCommentReadOnly.value = readOnly || reviewLocked.value;
  isCommentSidebarOpen.value = true;
}

function handleOpenHistoryComments({ item, cycleLabel, readOnly }) {
  openRowComments(item, cycleLabel, readOnly);
}

const hasCollaboratorFlow = computed(() =>
  Boolean(
    task.value?.needCollaborator ||
    task.value?.collaborator ||
    task.value?.collaborators?.length,
  ),
);

const activeStage = computed(() => {
  if (submitted.value || task.value?.status === "COMPLETED")
    return hasCollaboratorFlow.value ? 5 : 4;
  if (task.value?.status === "AWAITING_COLLABORATOR") return 4;
  if (task.value?.status === "IN_PROGRESS") return 3;
  return 2;
});
const currentViewedStage = computed(
  () => viewedStage.value || activeStage.value,
);
const isViewOnly = computed(() => currentViewedStage.value < activeStage.value);
const collaboratorReviewPending = computed(
  () =>
    task.value?.status === "AWAITING_COLLABORATOR" &&
    task.value?.collaborator?.status !== "COMPLETED",
);
const reviewLocked = computed(
  () => isViewOnly.value || ![3, 4].includes(activeStage.value),
);
const canEditRow = (row) =>
  !reviewLocked.value &&
  (row.reviewerId === user.id ||
    row.ownerRole === "LEGAL" ||
    row.decision === "REJECTED" ||
    row.status === "REVISION" ||
    (!row.reviewerId && !row.ownerRole && row.reviewer === user.name));
const workflowTitle = computed(() =>
  hasCollaboratorFlow.value
    ? "Review bersama Kolaborator"
    : "Review oleh Tim Legal",
);
const processSteps = computed(() =>
  hasCollaboratorFlow.value
    ? [
        { label: "Validated", done: activeStage.value >= 2 },
        { label: "Assigned", done: activeStage.value >= 3 },
        { label: "Review Legal", done: activeStage.value >= 4 },
        { label: "Collaborator", done: activeStage.value >= 5 },
        {
          label: "Review Completed",
          done: submitted.value || task.value?.status === "COMPLETED",
        },
      ]
    : [
        { label: "Validated", done: activeStage.value >= 2 },
        { label: "Assigned", done: activeStage.value >= 3 },
        { label: "Review Legal", done: activeStage.value >= 4 },
        {
          label: "Review Completed",
          done: submitted.value || task.value?.status === "COMPLETED",
        },
      ],
);

const filteredCollaborators = computed(() => {
  if (!collabSearch.value) return COLLABORATORS;
  const q = collabSearch.value.toLowerCase();
  return COLLABORATORS.filter((c) =>
    (c.name + c.division).toLowerCase().includes(q),
  );
});

function toggleScope(scope) {
  const i = selectedScopes.value.indexOf(scope);
  if (i === -1) selectedScopes.value.push(scope);
  else selectedScopes.value.splice(i, 1);
}

const canAssign = computed(
  () => selectedCollaborator.value && selectedScopes.value.length > 0,
);

function confirmAssign() {
  if (!canAssign.value) return;
  // Backend: create collaborator task, status -> Assigned, collaborator_assigned_at
  // recorded, collaborator notified (DESIGN.md §39).
  task.value.collaborator = {
    id: selectedCollaborator.value.id,
    name: selectedCollaborator.value.name,
    division: selectedCollaborator.value.division,
    scope: selectedScopes.value.join(", "),
    assignedAt: new Date().toISOString(),
    submittedAt: null,
    status: "IN_PROGRESS",
  };
  task.value.status = "AWAITING_COLLABORATOR";
  const assignedAt = task.value.collaborator.assignedAt;
  updateRequestWorkflow(5, {
    at: assignedAt,
    active: true,
    done: false,
    estimated: false,
    desc: `${task.value.collaborator.name} ditugaskan untuk menelaah ${task.value.collaborator.scope}. Tim Legal melanjutkan pemeriksaan klausul terkait.`,
  });
  showCollabModal.value = false;
  selectedCollaborator.value = null;
  selectedScopes.value = [];
}

const FIRST_LINE_INDENT = "36pt";

function saveDraft() {
  if (reviewLocked.value) return;
  task.value.reviewTable = rows.value.map((row) => ({
    ...row,
    reviewNote: row.comment,
  }));
  savedDraft.value = true;
  setTimeout(() => {
    savedDraft.value = false;
  }, 2500);
}

function saveAndRequestRevision() {
  const cycle = activeCycle.value;
  if (!cycle || cycle.status !== "ACTIVE") return;
  rows.value.forEach((row) => {
    const existing = cycle.items.find(
      (item) => item.reviewItemId === row.reviewItemId,
    );
    if (existing) {
      existing.clause = row.clause;
      existing.clauseContent = row.clauseContent;
      existing.reviewNote = row.comment;
      existing.comments = row.comments || [];
      updateReviewItem(existing, user, row.status);
    } else cycle.items.push({ ...row, reviewNote: row.comment });
  });
  completeCycle(cycle, user);
  task.value.status = "COMPLETED";
  const request = getRequestById(task.value.requestId);
  if (request) {
    request.status = "RETURNED_FOR_REVISION";
    request.updatedAt = cycle.completedAt;
  }
  savedDraft.value = true;
  setTimeout(() => {
    savedDraft.value = false;
  }, 2500);
}

function addReviewRow() {
  if (reviewLocked.value) return;
  rows.value.push({
    no: rows.value.length + 1,
    clause: "",
    clauseContent: "",
    comment: "",
    status: "OPEN",
    reviewItemId: `RVI-local-${Date.now()}`,
    reviewerId: user.id,
    reviewer: user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
    ownerRole: "LEGAL",
    risk: "LOW",
    onReview: "",
  });
}

function removeReviewRow(index) {
  const row = rows.value[index];
  if (rows.value.length <= 1 || !canEditRow(row)) return;
  if (
    !window.confirm(`Hapus baris ${index + 1} beserta catatan dan komentarnya?`)
  )
    return;
  rows.value.splice(index, 1);
  rows.value.forEach((row, rowIndex) => {
    row.no = rowIndex + 1;
  });
}

function exportReviewToDoc() {
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );
  const richText = (value) => value || "";
  const tableRows = rows.value
    .map(
      (row) =>
        `<tr><td>${row.no}</td><td>${richText(row.clause)}</td><td>${richText(row.comment)}</td><td>${richText(row.onReview) || "Belum diisi Requestor"}</td><td>${escapeHtml(ROW_STATUS_CONFIG[row.status]?.label || row.status)}</td></tr>`,
    )
    .join("");
  const html = `<html><head><meta charset="utf-8"><title>Review ${escapeHtml(task.value.requestId)}</title></head><body><h1>Review Dokumen ${escapeHtml(task.value.requestId)}</h1><p>${escapeHtml(task.value.title)}</p><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>No</th><th>KLAUSUL KONTRAK</th><th>CATATAN / REVIEW</th><th>ON REVIEW</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `Review-${task.value.requestId}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}

const hasReviewContent = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
const incompleteReviewRows = computed(() =>
  rows.value.filter(
    (row) => !hasReviewContent(row.clause) || !hasReviewContent(row.comment),
  ),
);
const canSubmit = computed(
  () =>
    !reviewLocked.value &&
    !collaboratorReviewPending.value &&
    rows.value.length > 0 &&
    incompleteReviewRows.value.length === 0,
);

function confirmSubmit() {
  // Backend: save review result, preserve collaborator history, review_completed_at
  // recorded, status -> Review Completed, returned to Requestor (DESIGN.md §43).
  const cycle = activeCycle.value;
  if (cycle) {
    rows.value.forEach((row) => {
      const existing = cycle.items.find(
        (item) => item.reviewItemId === row.reviewItemId,
      );
      if (existing) {
        existing.clause = row.clause;
        existing.clauseContent = row.clauseContent;
        existing.reviewNote = row.comment;
        existing.comments = row.comments || [];
        updateReviewItem(existing, user, "RESOLVED");
      } else
        cycle.items.push({
          ...row,
          reviewNote: row.comment,
          status: "RESOLVED",
          resolvedAt: new Date().toISOString(),
          resolvedBy: user.id,
        });
    });
    const allResolved = completeCycle(cycle, user);
    task.value.status = "COMPLETED";
    const request = getRequestById(task.value.requestId);
    if (request) {
      request.status = allResolved
        ? "REVIEW_COMPLETED"
        : "RETURNED_FOR_REVISION";
      request.updatedAt = cycle.completedAt;
      if (REQUEST_DETAIL.id === request.id)
        REQUEST_DETAIL.status = request.status;
    }
  }
  submitted.value = true;
  const completedAt = new Date().toISOString();
  updateRequestWorkflow(5, {
    done: true,
    active: false,
    at: completedAt,
    estimated: false,
    annotations: rows.value.filter((row) => hasReviewContent(row.comment))
      .length,
  });
  updateRequestWorkflow(6, {
    done: true,
    active: false,
    at: completedAt,
    estimated: false,
    desc: "Tim Legal menyelesaikan review dan mengirim hasil telaah final kepada Requestor.",
  });
  updateRequestWorkflow(7, {
    done: false,
    active: true,
    at: completedAt,
    estimated: false,
    desc: "Dokumen menunggu finalisasi dan proses tanda tangan.",
  });
  showSubmitModal.value = false;
}

function openPreview(name) {
  previewDocument.value = { name };
}

function previewRevisionDocument() {
  if (!activeCycle.value) return;
  previewDocument.value = {
    name: activeCycle.value.revisionDocument,
    source:
      activeCycle.value.documentUrl ||
      "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  };
}

function downloadRevisionDocument() {
  if (!activeCycle.value) return;
  const link = window.document.createElement("a");
  link.href =
    activeCycle.value.documentUrl ||
    "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
  link.download =
    activeCycle.value.revisionDocument ||
    `Cycle-${activeCycle.value.cycleNumber}.pdf`;
  link.target = "_blank";
  link.click();
}

function closePreview() {
  previewDocument.value = null;
}

function viewStage(stage) {
  if (stage <= activeStage.value)
    viewedStage.value = stage === activeStage.value ? null : stage;
}

function startReview() {
  task.value.status = "IN_PROGRESS";
  task.value.startedAt = new Date().toISOString();
  updateRequestWorkflow(5, {
    at: task.value.startedAt,
    active: true,
    done: false,
    estimated: false,
    desc: `${user.name} mulai menelaah dokumen${task.value.collaborator ? ` bersama ${task.value.collaborator.name}` : ""}.`,
  });
  viewedStage.value = null;
}

function updateCell(row, field, event) {
  if (!canEditRow(row)) return;
  row[field] = event.currentTarget.innerHTML;
  row.updatedAt = new Date().toISOString();
}

function rememberEditor(event, row) {
  if (!canEditRow(row)) return;
  activeEditor.value = event.currentTarget;
}

function getParagraphElement(node, editor) {
  let current =
    node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  while (current && current !== editor) {
    if (/^(P|DIV|LI|BLOCKQUOTE|PRE|H1|H2|H3|H4|H5|H6)$/.test(current.tagName))
      return current;
    current = current.parentElement;
  }
  return editor;
}

function isAtParagraphStart(range, paragraph) {
  const beforeCaret = range.cloneRange();
  beforeCaret.selectNodeContents(paragraph);
  beforeCaret.setEnd(range.startContainer, range.startOffset);
  return beforeCaret.toString().trim() === "";
}

function handleEditorKeydown(event) {
  if (event.key !== "Tab" || reviewLocked.value) return;

  event.preventDefault();
  const editor = event.currentTarget;
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  const paragraph = getParagraphElement(range.startContainer, editor);
  if (isAtParagraphStart(range, paragraph)) {
    paragraph.style.textIndent = FIRST_LINE_INDENT;
  } else {
    document.execCommand("insertText", false, "\t");
  }

  activeEditor.value = editor;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyTextFormat(command, value = null) {
  if (!activeEditor.value?.isConnected || reviewLocked.value) return;
  activeEditor.value.focus();
  document.execCommand(command, false, value);
  activeEditor.value.dispatchEvent(new Event("input", { bubbles: true }));
}
</script>

<template>
  <AppLayout
    role-key="legal"
    :user="user"
    :breadcrumb="['Portal Tim Legal', 'Tugas Review', route.params.taskId]"
  >
    <template v-if="task">
      <div class="flex items-start justify-between mb-2xl gap-lg flex-wrap">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-small font-semibold text-gray-500">{{
              task.taskId
            }}</span>
            <Badge
              :label="
                submitted
                  ? 'Review Completed'
                  : REVIEW_STATUS_CONFIG[task.status].label
              "
              :tone="
                submitted ? 'success' : REVIEW_STATUS_CONFIG[task.status].tone
              "
            />
          </div>
          <h1 class="mt-2 text-pagetitle text-gray-900 max-w-3xl">
            {{ task.title }}
          </h1>
          <p class="mt-1 text-body text-gray-500">
            {{ task.requestId }} · {{ task.partner }} ·
            {{ task.classification }}
          </p>
        </div>
        <Button variant="secondary" @click="router.push('/legal/tasks')"
          >Kembali ke Tugas</Button
        >
      </div>

      <section
        class="mb-2xl rounded-card border border-gray-200 bg-white p-2xl shadow-card"
      >
        <div class="mb-lg flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-cardtitle text-gray-900">Progress</h2>
            <p class="mt-1 text-small text-gray-500">
              Progress yang sama ditampilkan untuk Requestor, Legal, dan
              Collaborator.
            </p>
          </div>
          <span
            class="rounded-badge bg-brand-50 px-3 py-1 text-caption font-semibold text-brand-700"
            >{{ workflowTitle }}</span
          >
        </div>
        <DocumentProgress :steps="documentProgress" />
      </section>

      <DocumentMembers
        class="mb-2xl"
        v-model:active-tab="ticketTab"
        v-model:info-open="documentInfoOpen"
        :collapsible-info="true"
        :request-info="true"
        :members="documentMembers"
        :document-info="{
          id: task.taskId,
          requestId: task.requestId,
          title: task.title,
          partner: task.partner,
          requestKind: task.requestKind,
          mainDocument: task.mainDocument,
          attachments: task.attachments,
        }"
      >
        <div
          v-if="false"
          class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl"
        >
          <div class="mb-lg flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 class="text-cardtitle text-gray-900">Progress</h2>
              <p class="mt-1 text-small text-gray-500">
                Progress yang sama ditampilkan untuk Requestor, Legal, dan
                Collaborator.
              </p>
            </div>
            <span
              class="rounded-badge bg-brand-50 px-3 py-1 text-caption font-semibold text-brand-700"
              >{{ workflowTitle }}</span
            >
          </div>
          <DocumentProgress :steps="documentProgress" />
          <p class="mt-1 text-caption text-gray-500">
            Timestamp berasal dari state workflow bersama dan diperbarui saat
            aktivitas review berlangsung.
          </p>
        </div>

        <div
          v-if="isViewOnly"
          class="rounded-card border border-info-light bg-info-light/40 p-lg mb-2xl text-small text-info"
        >
          Mode lihat saja: Anda sedang melihat tahap sebelumnya. Kembali ke
          tahap aktif untuk melanjutkan pekerjaan.
        </div>

        <div
          v-if="submitted"
          class="rounded-card border border-success bg-success-light/40 p-lg mb-2xl flex items-center gap-3"
        >
          <CheckCircle2 class="h-5 w-5 text-success shrink-0" />
          <div>
            <p class="text-bodystrong text-success">
              Final Review berhasil disimpan &amp; dikirim
            </p>
            <p class="text-small text-gray-700 mt-0.5">
              Dokumen dan review table telah dikembalikan ke Requestor untuk
              revisi/finalisasi.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-2xl">
          <div
            v-if="false"
            class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl order-1"
            :class="[
              task.collaborator ? 'lg:col-span-3' : 'lg:col-span-2',
              { 'submission-collapsed': !submissionOpen },
            ]"
          >
            <div class="flex items-center justify-between mb-lg">
              <button
                type="button"
                class="flex items-center gap-2 text-left"
                @click="submissionOpen = !submissionOpen"
              >
                <ChevronDown
                  class="h-5 w-5 text-gray-500 transition-transform"
                  :class="submissionOpen ? '' : '-rotate-90'"
                />
                <span
                  ><span class="block text-cardtitle text-gray-900"
                    >Form Pengajuan Requestor</span
                  ><span class="mt-1 block text-small text-gray-500"
                    >Data yang dikirim Requestor dan menjadi dasar penugasan
                    review.</span
                  ></span
                >
              </button>
              <span
                class="text-caption font-semibold text-gray-500 bg-gray-100 rounded-badge px-2.5 py-1"
                >Hanya baca</span
              >
            </div>
            <div
              v-if="submissionOpen"
              class="grid grid-cols-1 gap-lg sm:grid-cols-2"
            >
              <div>
                <label
                  class="block text-small font-semibold text-gray-900 mb-1.5"
                  >Jenis Permintaan</label
                ><input
                  :value="task.requestKind || 'Belum tersedia'"
                  disabled
                  class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700"
                />
              </div>
              <div>
                <label
                  class="block text-small font-semibold text-gray-900 mb-1.5"
                  >Ketersediaan Dokumen</label
                ><input
                  :value="task.documentCategory || 'Digital Document'"
                  disabled
                  class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700"
                />
              </div>
              <div v-if="task.mainDocument" class="sm:col-span-2">
                <label
                  class="block text-small font-semibold text-gray-900 mb-1.5"
                  >Dokumen untuk Direview</label
                ><input
                  :value="task.mainDocument.name"
                  disabled
                  class="h-10 w-full rounded-input border border-gray-200 bg-gray-50 px-3 text-small text-gray-700"
                />
              </div>
            </div>
            <template v-if="submissionOpen">
              <div
                v-if="task.requestor"
                class="mt-lg rounded-input bg-gray-50 px-3 py-2"
              >
                <p class="text-caption text-gray-500">REQUESTOR</p>
                <p class="mt-1 text-small text-gray-900">
                  {{ task.requestor.name }} · {{ task.requestor.division }}
                </p>
              </div>
            </template>
          </div>

          <div
            class="rounded-card border border-gray-200 bg-white shadow-card p-2xl mb-2xl document-card lg:col-span-3 order-3"
            :class="{ 'document-collapsed': !documentsOpen }"
          >
            <button
              type="button"
              class="mb-lg flex w-full items-center gap-2 text-left"
              @click="documentsOpen = !documentsOpen"
            >
              <ChevronDown
                class="h-5 w-5 text-gray-500 transition-transform"
                :class="documentsOpen ? '' : '-rotate-90'"
              />
              <h2 class="text-cardtitle text-gray-900">Dokumen</h2>
            </button>
            <div v-if="documentsOpen" class="space-y-2">
              <div
                class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <FileText class="h-4.5 w-4.5 text-danger shrink-0" />
                  <div class="min-w-0">
                    <p class="text-bodystrong text-gray-900 truncate">
                      {{
                        task.mainDocument?.name ||
                        `Draft_Kontrak_${task.requestId}.pdf`
                      }}
                    </p>
                    <p class="text-caption text-gray-500">Dokumen Utama</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="text-gray-500 hover:text-gray-900"
                    aria-label="Pratinjau"
                    @click="
                      openPreview(
                        task.mainDocument?.name ||
                          `Draft_Kontrak_${task.requestId}.pdf`,
                      )
                    "
                  >
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    class="text-gray-500 hover:text-gray-900"
                    aria-label="Unduh"
                  >
                    <Download class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                v-if="activeCycle"
                class="flex items-center justify-between rounded-file border border-brand-200 bg-brand-50/40 px-lg py-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <FileText class="h-4.5 w-4.5 text-brand-700 shrink-0" />
                  <div class="min-w-0">
                    <p class="text-bodystrong text-gray-900 truncate">
                      {{ activeCycle.revisionDocument }}
                    </p>
                    <p class="text-caption text-brand-700">
                      Dokumen Revisi Requestor · Cycle
                      {{ activeCycle.cycleNumber }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="text-gray-500 hover:text-brand-700"
                    aria-label="Pratinjau dokumen revisi"
                    title="Preview dokumen revisi"
                    @click="previewRevisionDocument"
                  >
                    <Eye class="h-4 w-4" /></button
                  ><button
                    type="button"
                    class="text-gray-500 hover:text-brand-700"
                    aria-label="Unduh dokumen revisi"
                    title="Unduh dokumen revisi"
                    @click="downloadRevisionDocument"
                  >
                    <Download class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                v-for="file in task.attachments || []"
                :key="file.name"
                class="flex items-center justify-between rounded-file border border-gray-200 px-lg py-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <FileText class="h-4.5 w-4.5 text-gray-500 shrink-0" />
                  <div class="min-w-0">
                    <p class="text-bodystrong text-gray-900 truncate">
                      {{ file.name }}
                    </p>
                    <p class="text-caption text-gray-500">Lampiran Dokumen</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="text-gray-500 hover:text-gray-900 shrink-0"
                  aria-label="Pratinjau"
                  @click="openPreview(file.name)"
                >
                  <Eye class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Right sidebar: collaborator assignment when one has not been selected -->
          <div
            v-if="!task.collaborator"
            class="space-y-2xl lg:col-span-1 order-2"
          >
            <!-- Collaborator Decision (DESIGN.md §37-42) -->
            <div
              v-if="!task.collaborator"
              class="rounded-card border border-gray-200 bg-white shadow-card p-2xl"
            >
              <div class="flex items-center gap-2 mb-lg">
                <Users2 class="h-4 w-4 text-gray-500" />
                <h3 class="text-cardtitle text-gray-900">Kolaborator</h3>
              </div>

              <div v-if="!task.collaborator">
                <p class="text-small text-gray-500 mb-lg">
                  Perlu review lintas divisi (teknis, pajak, atau kepatuhan)?
                </p>
                <div class="grid grid-cols-2 gap-2 mb-lg">
                  <button
                    type="button"
                    class="h-9 rounded-input border text-small font-medium"
                    :class="
                      needCollaborator
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700'
                    "
                    :disabled="activeStage > 2 || isViewOnly"
                    @click="needCollaborator = true"
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    class="h-9 rounded-input border text-small font-medium"
                    :class="
                      !needCollaborator
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700'
                    "
                    :disabled="activeStage > 2 || isViewOnly"
                    @click="needCollaborator = false"
                  >
                    Tidak
                  </button>
                </div>
                <Button
                  v-if="needCollaborator"
                  variant="secondary"
                  class="w-full"
                  :disabled="activeStage > 2 || isViewOnly"
                  @click="showCollabModal = true"
                  >Pilih Kolaborator</Button
                >
                <p v-else class="text-caption text-gray-400">
                  Telaah akan dilanjutkan langsung oleh Tim Legal tanpa
                  kolaborator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DocumentMembers>

      <div class="review-workspace space-y-2xl">
        <ReviewCycleHistory
          :request-id="task.requestId"
          :fallback-cycle="{
            cycleId: task.taskId,
            cycleNumber: 0,
            status:
              submitted || task.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
            revisionDocument: task.mainDocument?.name || 'Dokumen kontrak',
            items: rows,
            startedAt: task.startedAt || task.assignedAt,
          }"
          @open-comments="handleOpenHistoryComments"
        >
          <template #active>
            <p class="mb-4 text-small text-gray-500">
              {{
                reviewLocked
                  ? "Tabel dalam mode baca. Mulai review untuk mengisi catatan."
                  : collaboratorReviewPending
                    ? "Kolaborator sedang melakukan review. Tim Legal tetap dapat menambah baris dan mengisi review sendiri."
                    : "Klik sel Klausul Kontrak atau Catatan / Review untuk menulis. ON REVIEW diisi oleh Requestor."
              }}
            </p>
            <div
              class="review-toolbar mb-4 flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 p-3"
            >
              <div
                class="flex flex-wrap items-center gap-1.5"
                role="toolbar"
                aria-label="Format teks review"
                @mousedown.prevent
              >
                <button
                  type="button"
                  class="format-button font-bold"
                  :disabled="reviewLocked"
                  title="Bold"
                  @click="applyTextFormat('bold')"
                >
                  B
                </button>
                <button
                  type="button"
                  class="format-button italic"
                  :disabled="reviewLocked"
                  title="Italic"
                  @click="applyTextFormat('italic')"
                >
                  I
                </button>
                <button
                  type="button"
                  class="format-button underline"
                  :disabled="reviewLocked"
                  title="Underline"
                  @click="applyTextFormat('underline')"
                >
                  U
                </button>
                <span class="mx-1 h-6 w-px bg-gray-200"></span>
                <button
                  type="button"
                  class="format-button"
                  :disabled="reviewLocked"
                  title="Highlight kuning"
                  @click="applyTextFormat('hiliteColor', '#fef08a')"
                >
                  <span class="h-3.5 w-3.5 rounded-sm bg-yellow-200"></span>
                </button>
                <button
                  type="button"
                  class="format-button"
                  :disabled="reviewLocked"
                  title="Highlight hijau"
                  @click="applyTextFormat('hiliteColor', '#bbf7d0')"
                >
                  <span class="h-3.5 w-3.5 rounded-sm bg-green-200"></span>
                </button>
                <button
                  type="button"
                  class="format-button"
                  :disabled="reviewLocked"
                  title="Highlight biru"
                  @click="applyTextFormat('hiliteColor', '#bfdbfe')"
                >
                  <span class="h-3.5 w-3.5 rounded-sm bg-blue-200"></span>
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="autosaveStatus !== 'idle'"
                  class="text-caption"
                  :class="
                    autosaveStatus === 'saving'
                      ? 'text-gray-500'
                      : 'text-success'
                  "
                  >{{
                    autosaveStatus === "saving"
                      ? "Menyimpan…"
                      : "Tersimpan otomatis"
                  }}</span
                ><Button
                  variant="secondary"
                  size="sm"
                  @click="exportReviewToDoc"
                  ><template #icon-left
                    ><FileText class="h-3.5 w-3.5" /></template
                  >Export ke DOC</Button
                ><Button
                  variant="secondary"
                  size="sm"
                  :disabled="reviewLocked"
                  @click="addReviewRow"
                  >+ Tambah baris</Button
                >
              </div>
            </div>

            <div
              v-if="activeCycle"
              class="mb-lg flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-white text-brand-700 shadow-sm"
                >
                  <FileText class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-small font-semibold text-gray-900">
                    {{ activeCycle.revisionDocument }}
                  </p>
                  <p class="text-caption text-gray-500">
                    File dokumen kontrak · Cycle {{ activeCycle.cycleNumber }}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"
                  title="Preview dokumen"
                  @click="previewRevisionDocument"
                >
                  <Eye class="h-4 w-4" /></button
                ><button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"
                  title="Unduh dokumen"
                  @click="downloadRevisionDocument"
                >
                  <Download class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-input border border-gray-200 bg-gray-50 px-4 py-3">
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-small font-semibold text-gray-700">Status Poin Review Kolaborator:</span>
                <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-caption font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /> {{ approvedCount }} Disetujui (Approved)
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-caption font-bold text-red-700 border border-red-200">
                  <XCircle class="h-3.5 w-3.5 text-red-600" /> {{ rejectedCount }} Perlu Revisi (Rejected)
                </span>
              </div>
            </div>

            <div class="overflow-x-auto rounded-input border border-gray-200">
              <table class="min-w-[760px] w-full text-body">
                <thead class="bg-gray-50">
                  <tr
                    class="border-b border-gray-200 text-left text-caption font-semibold uppercase tracking-wide text-gray-500"
                  >
                    <th class="w-12 px-3 py-2.5">No</th>
                    <th class="w-[28%] px-3 py-2.5">Klausul Kontrak</th>
                    <th class="w-[38%] px-3 py-2.5">Catatan / Review</th>
                    <th class="w-[16%] px-3 py-2.5">On Review</th>
                    <th class="w-[18%] px-3 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in rows"
                    :key="row.reviewItemId || row.no"
                    class="border-b border-gray-100 align-top last:border-0"
                  >
                    <td class="px-3 py-3 text-gray-500">
                      <span>{{ row.no }}</span
                      ><span
                        v-if="!canEditRow(row)"
                        class="mt-2 flex justify-center text-gray-400"
                        title="Baris review Kolaborator"
                        ><Lock class="h-3.5 w-3.5"
                      /></span>
                    </td>
                    <td class="px-3 py-3">
                      <div
                        spellcheck="true"
                        :contenteditable="canEditRow(row) && (row.isEditing || row.decision === 'REJECTED' || !row.clause)"
                        class="spreadsheet-cell min-h-[72px] rounded-input border px-2 py-1.5 text-small focus:border-brand-500"
                        :class="
                          canEditRow(row) && (row.isEditing || row.decision === 'REJECTED')
                            ? 'bg-white border-brand-300 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        "
                        role="textbox"
                        :aria-label="`Klausul kontrak baris ${row.no}`"
                        v-html="row.clause"
                        @focus="rememberEditor($event, row)"
                        @keydown="handleEditorKeydown"
                        @blur="updateCell(row, 'clause', $event)"
                      ></div>
                      <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span class="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
                          Milik: {{ row.ownerName || (row.ownerRole === 'COLLABORATOR' ? 'Kolaborator' : 'Tim Legal') }}
                        </span>
                        <span
                          v-if="row.decision === 'APPROVED'"
                          class="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200"
                        >
                          <CheckCircle2 class="h-3 w-3 text-emerald-600" /> Disetujui
                        </span>
                        <span
                          v-else-if="row.decision === 'REJECTED'"
                          class="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200"
                        >
                          <XCircle class="h-3 w-3 text-red-600" /> Perlu Revisi / Ditolak
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-3">
                      <div
                        spellcheck="true"
                        :contenteditable="canEditRow(row) && (row.isEditing || row.decision === 'REJECTED' || !row.comment)"
                        class="spreadsheet-cell min-h-[72px] rounded-input border px-2 py-1.5 text-small focus:border-brand-500"
                        :class="
                          canEditRow(row) && (row.isEditing || row.decision === 'REJECTED')
                            ? 'bg-white border-brand-300 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        "
                        :data-placeholder="
                          row.comment ? '' : 'Tulis catatan atau rekomendasi...'
                        "
                        role="textbox"
                        :aria-label="`Catatan review baris ${row.no}`"
                        v-html="row.comment"
                        @focus="rememberEditor($event, row)"
                        @keydown="handleEditorKeydown"
                        @blur="updateCell(row, 'comment', $event)"
                      ></div>
                      <p
                        v-if="!canEditRow(row)"
                        class="mt-2 flex items-center gap-1 text-caption text-gray-500"
                      >
                        <Lock class="h-3 w-3" /> Review oleh
                        {{
                          row.reviewer ||
                          task.collaborator?.name ||
                          "Kolaborator"
                        }}
                      </p>
                    </td>
                    <td class="px-3 py-3">
                      <div
                        class="min-h-[72px] rounded-input border border-gray-200 bg-gray-50 px-2 py-1.5 text-small text-gray-700 whitespace-pre-wrap"
                      >
                        {{ row.onReview || "" }}
                      </div>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <div class="flex flex-col items-center gap-2">
                        <!-- Read-only Decision Label -->
                        <span
                          v-if="row.decision === 'APPROVED'"
                          class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-caption font-bold text-emerald-700 border border-emerald-200 shadow-sm"
                        >
                          <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" /> Disetujui
                        </span>
                        <span
                          v-else-if="row.decision === 'REJECTED'"
                          class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-caption font-bold text-red-700 border border-red-200 shadow-sm"
                        >
                          <XCircle class="h-3.5 w-3.5 text-red-600" /> Perlu Revisi
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-caption font-medium text-gray-500 border border-gray-200"
                        >
                          Belum Evaluasi
                        </span>

                        <!-- Pencil Edit & Resubmit Action Button for Row Owner -->
                        <div v-if="canEditRow(row)" class="mt-1">
                          <button
                            v-if="!row.isEditing"
                            type="button"
                            class="inline-flex items-center gap-1 rounded-button border border-gray-200 bg-white px-2.5 py-1 text-caption font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 shadow-sm transition"
                            title="Edit baris ini"
                            @click="toggleEditRow(row)"
                          >
                            <Pencil class="h-3.5 w-3.5 text-brand-600" /> Edit Poin
                          </button>
                          <div v-else class="flex flex-col gap-1 items-center">
                            <button
                              type="button"
                              class="inline-flex items-center gap-1 rounded-button bg-brand-600 px-2.5 py-1 text-caption font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                              title="Simpan & Kirim Ulang Poin Ini"
                              @click="saveAndResubmitRow(row)"
                            >
                              <Send class="h-3.5 w-3.5" /> Simpan & Kirim Ulang
                            </button>
                            <button
                              type="button"
                              class="text-[11px] text-gray-500 hover:underline"
                              @click="row.isEditing = false"
                            >
                              Batal
                            </button>
                          </div>
                        </div>

                        <!-- Action drawer & Delete -->
                        <div class="flex items-center justify-center gap-1.5 mt-1">
                          <button
                            type="button"
                            class="relative inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700 transition shadow-sm"
                            title="Lihat/Diskusi Komentar"
                            :aria-label="`Komentar baris ${row.no}`"
                            @click="openRowComments(row)"
                          >
                            <MessageSquare class="h-4 w-4 text-brand-600" />
                            <span
                              v-if="(row.comments || []).length"
                              class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm"
                            >
                              {{ row.comments.length }}
                            </span>
                          </button>
                          <button
                            type="button"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-button border border-gray-200 bg-white text-gray-400 hover:bg-danger-light hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 transition shadow-sm"
                            :disabled="!canEditRow(row) || rows.length <= 1"
                            title="Hapus baris"
                            :aria-label="`Hapus baris ${row.no}`"
                            @click="removeReviewRow(rows.indexOf(row))"
                          >
                            <X class="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-if="!submitted"
              class="mt-xl flex flex-col gap-4 rounded-input border border-gray-200 bg-gray-50 px-4 py-lg"
            >
              <p
                class="text-caption"
                :class="canSubmit ? 'text-success' : 'text-gray-500'"
              >
                <span v-if="savedDraft" class="font-semibold text-brand-700"
                  >Draft tersimpan.</span
                ><span v-else-if="collaboratorReviewPending"
                  >Tim Legal tetap dapat menambah review. Pengiriman hasil final
                  tersedia setelah Kolaborator menyelesaikan review.</span
                ><span v-else-if="canSubmit"
                  >Review siap disimpan atau dikirim ke Requestor.</span
                ><span v-else-if="incompleteReviewRows.length"
                  >Isi klausul dan catatan review pada semua baris terlebih
                  dahulu.</span
                ><span v-else
                  >Mulai review terlebih dahulu untuk mengisi tabel.</span
                >
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  v-if="activeStage === 2"
                  variant="primary"
                  @click="startReview"
                  >Mulai Review</Button
                ><Button
                  variant="secondary"
                  :disabled="reviewLocked"
                  @click="saveDraft"
                  ><template #icon-left><Save class="h-3.5 w-3.5" /></template
                  >Simpan Draft</Button
                ><Button
                  variant="secondary"
                  :disabled="reviewLocked || !canSubmit"
                  @click="showInternalProcessModal = true"
                  >Process Review Internal</Button
                ><Button
                  variant="primary"
                  :disabled="reviewLocked || !canSubmit"
                  @click="showSubmitModal = true"
                  >Simpan &amp; Kirim Review Final</Button
                >
              </div>
            </div>
          </template>
        </ReviewCycleHistory>
      </div>
    </template>

    <template v-else>
      <div
        class="rounded-card border border-gray-200 bg-white shadow-card p-3xl text-center"
      >
        <File class="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p class="text-cardtitle text-gray-900">Tugas review tidak ditemukan</p>
        <p class="mt-1 text-small text-gray-500">
          Task ID "{{ route.params.taskId }}" tidak ada dalam sistem.
        </p>
        <Button
          variant="secondary"
          class="mt-lg"
          @click="router.push('/legal/tasks')"
          >Kembali ke Daftar Tugas</Button
        >
      </div>
    </template>

    <!-- Select Collaborator Modal (DESIGN.md §38) -->
    <Modal
      v-if="showCollabModal"
      title="Pilih Kolaborator"
      @close="showCollabModal = false"
    >
      <label class="block text-small font-semibold text-gray-900 mb-1.5"
        >Cari Pengguna</label
      >
      <input
        v-model="collabSearch"
        type="text"
        placeholder="Cari nama atau divisi..."
        class="w-full h-10 rounded-input border border-gray-200 px-3 text-body mb-lg focus:border-brand-500"
      />
      <div class="space-y-2 mb-lg">
        <label
          v-for="c in filteredCollaborators"
          :key="c.id"
          class="flex items-center gap-3 rounded-input border px-lg py-3 cursor-pointer"
          :class="
            selectedCollaborator?.id === c.id
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200'
          "
        >
          <input
            type="radio"
            name="collaborator"
            class="text-brand-500"
            :checked="selectedCollaborator?.id === c.id"
            @change="selectedCollaborator = c"
          />
          <div>
            <p class="text-bodystrong text-gray-900">{{ c.name }}</p>
            <p class="text-caption text-gray-500">{{ c.division }}</p>
          </div>
        </label>
        <p
          v-if="filteredCollaborators.length === 0"
          class="text-small text-gray-500"
        >
          Tidak ada pengguna yang cocok.
        </p>
      </div>

      <div v-if="selectedCollaborator">
        <label class="block text-small font-semibold text-gray-900 mb-1.5"
          >Review Scope *</label
        >
        <div class="space-y-1.5">
          <label
            v-for="scope in selectedCollaborator.scopes"
            :key="scope"
            class="flex items-center gap-2 text-small text-gray-700"
          >
            <input
              type="checkbox"
              :checked="selectedScopes.includes(scope)"
              class="rounded border-gray-300 text-brand-500"
              @change="toggleScope(scope)"
            />
            {{ scope }}
          </label>
        </div>
      </div>

      <template #footer>
        <Button variant="secondary" @click="showCollabModal = false"
          >Batal</Button
        >
        <Button variant="primary" :disabled="!canAssign" @click="confirmAssign"
          >Tugaskan Kolaborator</Button
        >
      </template>
    </Modal>

    <!-- Submit Final Review Confirmation -->
    <Modal
      v-if="showSubmitModal"
      title="Kirim Review Final"
      max-width="max-w-md"
      @close="showSubmitModal = false"
    >
      <p class="text-small text-gray-700">
        Apakah Anda yakin dengan review yang sudah ditulis? Review berikut akan
        dikirim kembali ke Requestor sebagai rekomendasi resmi Tim Legal.
      </p>
      <div
        class="mt-lg max-h-64 space-y-2 overflow-y-auto rounded-input border border-gray-200 bg-gray-50 p-3"
      >
        <div
          v-for="row in rows"
          :key="row.no"
          class="rounded-input border border-gray-200 bg-white p-3"
        >
          <p class="text-caption font-semibold text-gray-500">
            ROW {{ row.no }} · {{ row.status }}
          </p>
          <p
            class="mt-1 text-small font-semibold text-gray-900"
            v-html="row.clause"
          />
          <p class="mt-1 text-small text-gray-700" v-html="row.comment" />
        </div>
      </div>
      <p class="mt-lg text-small text-gray-500">
        Pastikan seluruh catatan sudah benar. Setelah dikirim, review akan
        tercatat sebagai hasil final.
      </p>
      <template #footer>
        <Button variant="secondary" @click="showSubmitModal = false"
          >Batal</Button
        >
        <Button variant="primary" @click="confirmSubmit"
          >Simpan &amp; Kirim Review Final</Button
        >
      </template>
    </Modal>

    <!-- Process Review Internal Modal -->
    <Modal
      v-if="showInternalProcessModal"
      title="Process Review Internal"
      max-width="max-w-lg"
      @close="showInternalProcessModal = false"
    >
      <div class="space-y-4">
        <p class="text-small text-gray-700">
          Proses review internal ini akan meneruskan hasil telaah ke Kepala Divisi (Kadiv) terkait untuk dievaluasi dan mendapatkan rekomendasi/persetujuan internal sebelum dikirimkan.
        </p>

        <div class="rounded-input border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p class="text-caption font-semibold text-gray-500 uppercase tracking-wide">
            Daftar Kepala Divisi (Kadiv) yang Diinfokan:
          </p>

          <div
            v-for="kadiv in kadivList"
            :key="kadiv.id"
            class="flex items-center justify-between rounded-input bg-white p-3 border border-gray-200 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div class="h-8 w-8 rounded-full bg-brand-100 text-brand-700 font-bold text-caption flex items-center justify-center">
                {{ kadiv.avatar }}
              </div>
              <div>
                <p class="text-bodystrong text-gray-900 text-small font-semibold">{{ kadiv.name }}</p>
                <p class="text-caption text-gray-500">{{ kadiv.role }}</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-caption font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Notifikasi Sent
            </span>
          </div>
        </div>

        <p class="text-caption text-gray-500">
          Seluruh Kadiv yang terdaftar di atas akan menerima notifikasi dan hak akses untuk peninjauan internal draf review.
        </p>
      </div>

      <template #footer>
        <Button variant="secondary" @click="showInternalProcessModal = false">Batal</Button>
        <Button variant="primary" @click="confirmInternalProcess">Proses &amp; Infokan Kadiv</Button>
      </template>
    </Modal>
    <PdfPreviewPanel :document="previewDocument" @close="closePreview" />
    <RowCommentSidebar
      :is-open="isCommentSidebarOpen"
      :row="activeCommentRow"
      :cycle-label="activeCommentCycleLabel"
      :read-only="activeCommentReadOnly"
      :actor="user"
      @close="isCommentSidebarOpen = false"
    />
  </AppLayout>
</template>

<style scoped>
.submission-collapsed > div:not(:first-child),
.document-collapsed > div:not(:first-child) {
  display: none;
}

.spreadsheet-cell:empty::before {
  content: attr(data-placeholder);
  color: #94a3b8;
}

.spreadsheet-cell {
  white-space: pre-wrap;
}

.format-button {
  display: inline-flex;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
}

.format-button:hover:not(:disabled) {
  border-color: #2563eb;
}

.format-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.highlight-yellow {
  background: #fef08a;
}
.highlight-green {
  background: #bbf7d0;
}
.highlight-blue {
  background: #bfdbfe;
}
</style>

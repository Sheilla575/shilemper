<script setup>
import { computed, ref, watch } from "vue";
import { MessageSquare, Send } from "lucide-vue-next";

const props = defineProps({
  items: { type: Array, required: true },
  actor: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const columnOptions = [
  { value: "clause", label: "KLAUSUL KONTRAK" },
  { value: "comment", label: "CATATAN / REVIEW" },
  { value: "onReview", label: "ON REVIEW" },
];

const selectedRowKey = ref("");
const selectedColumn = ref("comment");
const draft = ref("");

const rowKey = (item) => String(item.reviewItemId || item.no);

watch(
  () => props.items.map(rowKey),
  (keys) => {
    if (!keys.includes(selectedRowKey.value))
      selectedRowKey.value = keys[0] || "";
  },
  { immediate: true },
);

const selectedItem = computed(() =>
  props.items.find((item) => rowKey(item) === selectedRowKey.value),
);

const comments = computed(() =>
  props.items
    .flatMap((item) =>
      (item.comments || []).map((comment) => ({
        ...comment,
        rowNo: item.no,
        targetLabel:
          columnOptions.find((option) => option.value === comment.targetColumn)
            ?.label || "UMUM",
      })),
    )
    .sort((a, b) => new Date(b.at) - new Date(a.at)),
);

function addComment() {
  const text = draft.value.trim();
  if (!text || !selectedItem.value || props.disabled) return;
  if (!selectedItem.value.comments) selectedItem.value.comments = [];
  selectedItem.value.comments.push({
    id: `${Date.now()}-${Math.random()}`,
    author: props.actor.name,
    text,
    at: new Date().toISOString(),
    targetColumn: selectedColumn.value,
  });
  draft.value = "";
}
</script>

<template>
  <section class="mt-xl rounded-card border border-gray-200 bg-gray-50/60 p-lg">
    <div class="flex items-start gap-3">
      <div
        class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
      >
        <MessageSquare class="h-4 w-4" />
      </div>
      <div>
        <h3 class="text-bodystrong text-gray-900">
          Diskusi Review
          <span
            class="ml-2 rounded-full bg-white px-2 py-0.5 text-small text-gray-500"
            >{{ comments.length }}</span
          >
        </h3>
        <p class="mt-0.5 text-caption text-gray-500">
          Pilih baris dan kolom agar komentar mengarah ke bagian yang tepat.
        </p>
      </div>
    </div>

    <div v-if="!disabled" class="mt-lg grid gap-3 sm:grid-cols-2">
      <label class="space-y-1.5 text-small font-semibold text-gray-700"
        ><span class="block">Baris tujuan</span>
        <select
          v-model="selectedRowKey"
          :disabled="!items.length"
          class="h-10 w-full rounded-input border border-gray-200 bg-white px-3 text-small text-gray-700 disabled:bg-gray-100"
        >
          <option
            v-for="item in items"
            :key="rowKey(item)"
            :value="rowKey(item)"
          >
            Baris {{ item.no }}
          </option>
        </select>
      </label>
      <label class="space-y-1.5 text-small font-semibold text-gray-700"
        ><span class="block">Kolom tujuan</span>
        <select
          v-model="selectedColumn"
          class="h-10 w-full rounded-input border border-gray-200 bg-white px-3 text-small text-gray-700 disabled:bg-gray-100"
        >
          <option
            v-for="column in columnOptions"
            :key="column.value"
            :value="column.value"
          >
            {{ column.label }}
          </option>
        </select>
      </label>
      <label class="sm:col-span-2 text-small font-semibold text-gray-700"
        ><span class="mb-1.5 block">Komentar</span
        ><textarea
          v-model="draft"
          rows="3"
          class="w-full resize-y rounded-input border border-gray-200 bg-white p-3 text-body font-normal text-gray-700 focus:border-brand-500"
          placeholder="Tulis pertanyaan atau masukan untuk bagian ini…"
        />
      </label>
      <button
        type="button"
        :disabled="!selectedItem || !draft.trim()"
        class="inline-flex h-10 items-center justify-center gap-2 justify-self-end sm:col-span-2 rounded-button bg-brand-600 px-4 text-small font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="addComment"
      >
        <Send class="h-4 w-4" />
        Kirim
      </button>
    </div>

    <div v-if="comments.length" class="mt-lg space-y-2">
      <article
        v-for="comment in comments"
        :key="comment.id"
        class="rounded-input border border-gray-200 bg-white px-4 py-3"
      >
        <div class="flex flex-wrap items-center gap-2 text-caption">
          <span class="font-semibold text-gray-900">{{ comment.author }}</span>
          <span
            class="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700"
            >Baris {{ comment.rowNo }}</span
          >
          <span
            class="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600"
            >{{ comment.targetLabel }}</span
          >
          <span class="text-gray-400">{{
            new Date(comment.at).toLocaleString("id-ID")
          }}</span>
        </div>
        <p class="mt-2 whitespace-pre-wrap break-words text-body text-gray-700">
          {{ comment.text }}
        </p>
      </article>
    </div>
    <p
      v-else
      class="mt-lg rounded-input border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-small text-gray-500"
    >
      Belum ada komentar review.
    </p>
  </section>
</template>

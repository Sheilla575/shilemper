<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { X, Send, MessageSquare, Lock, UserCheck } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  row: { type: Object, default: null },
  cycleLabel: { type: String, default: '' },
  actor: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'comment-added'])

const draft = ref('')
const commentsContainer = ref(null)

const cleanText = (val) => String(val || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

const rowClause = computed(() => cleanText(props.row?.clause) || `Baris ${props.row?.no || ''}`)
const rowContent = computed(() => cleanText(props.row?.clauseContent))
const rowComment = computed(() => cleanText(props.row?.comment || props.row?.reviewNote))
const rowOnReview = computed(() => cleanText(props.row?.onReview))

const comments = computed(() => props.row?.comments || [])

function scrollToBottom() {
  nextTick(() => {
    if (commentsContainer.value) {
      commentsContainer.value.scrollTop = commentsContainer.value.scrollHeight
    }
  })
}

watch(
  () => [props.isOpen, comments.value.length],
  () => {
    if (props.isOpen) {
      scrollToBottom()
    }
  },
  { immediate: true }
)

function getRoleBadge(comment) {
  const role = comment.role || (comment.author.includes('Fauzi') ? 'Tim Legal' : comment.author.includes('Budi') ? 'Requestor' : 'Kolaborator')
  if (role.toLowerCase().includes('legal')) return { text: 'Tim Legal', tone: 'bg-brand-50 text-brand-700 border-brand-200' }
  if (role.toLowerCase().includes('requestor')) return { text: 'Requestor', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  return { text: role, tone: 'bg-amber-50 text-amber-700 border-amber-200' }
}

function getAvatarInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

function handleAddComment() {
  const text = draft.value.trim()
  if (!text || !props.row) return

  if (!props.row.comments) {
    props.row.comments = []
  }

  const newComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author: props.actor?.name || 'User',
    role: props.actor?.role || 'Tim Legal',
    text,
    at: new Date().toISOString(),
  }

  props.row.comments.push(newComment)
  draft.value = ''
  emit('comment-added', newComment)
  scrollToBottom()
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        @click="emit('close')"
      ></div>

      <!-- Slide-over drawer -->
      <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div class="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
                <MessageSquare class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-bodystrong text-gray-900 truncate font-semibold">
                    Diskusi Poin Review
                  </h2>
                  <span
                    v-if="cycleLabel"
                    class="rounded-full bg-brand-100 px-2.5 py-0.5 text-caption font-semibold text-brand-700 shrink-0"
                  >
                    {{ cycleLabel }}
                  </span>
                </div>
                <p class="text-caption text-gray-500 truncate font-medium mt-0.5">
                  {{ rowClause }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-button p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Point Context Banner -->
          <div v-if="row" class="px-6 py-3 bg-brand-50/50 border-b border-gray-200 space-y-1.5 text-small">
            <div class="flex items-start justify-between gap-2">
              <span class="font-semibold text-gray-900">Klausul: {{ rowClause }}</span>
              <span
                v-if="row.risk"
                class="px-2 py-0.5 rounded text-caption font-bold"
                :class="row.risk === 'HIGH' ? 'bg-red-100 text-red-700' : row.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ row.risk }} RISK
              </span>
            </div>
            <p v-if="rowComment" class="text-caption text-gray-600 line-clamp-2">
              <strong class="text-gray-700">Catatan:</strong> {{ rowComment }}
            </p>
            <p v-if="rowOnReview" class="text-caption text-gray-500 line-clamp-2">
              <strong class="text-gray-700">On Review:</strong> {{ rowOnReview }}
            </p>
          </div>

          <!-- Comments Feed -->
          <div ref="commentsContainer" class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            <div v-if="comments.length === 0" class="py-12 text-center text-gray-400">
              <MessageSquare class="h-10 w-10 mx-auto mb-2 opacity-30 text-gray-400" />
              <p class="text-small font-medium text-gray-500">Belum ada catatan komentar pada poin ini.</p>
              <p class="text-caption text-gray-400 mt-1">Tulis komentar pertama Anda di bawah ini.</p>
            </div>

            <div
              v-for="comment in comments"
              :key="comment.id"
              class="flex gap-3 text-small"
            >
              <div class="h-8 w-8 rounded-full bg-brand-600 text-white font-bold text-caption flex items-center justify-center shrink-0 shadow-sm">
                {{ getAvatarInitials(comment.author) }}
              </div>
              <div class="flex-1 bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-900 text-small">{{ comment.author }}</span>
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                      :class="getRoleBadge(comment).tone"
                    >
                      {{ getRoleBadge(comment).text }}
                    </span>
                  </div>
                  <span class="text-[11px] text-gray-400">{{ formatDate(comment.at) }}</span>
                </div>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap text-small font-normal">
                  {{ comment.text }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer Input -->
          <div class="p-4 border-t border-gray-200 bg-white">
            <div v-if="readOnly" class="text-center py-2 bg-gray-100 rounded-input text-caption text-gray-500 flex items-center justify-center gap-1.5">
              <Lock class="h-3.5 w-3.5 text-gray-400" /> Mode baca saja (Cycle terdahulu/selesai)
            </div>
            <div v-else class="space-y-2">
              <div class="relative">
                <textarea
                  v-model="draft"
                  rows="3"
                  placeholder="Tulis komentar atau instruksi untuk poin ini..."
                  class="w-full resize-none rounded-input border border-gray-300 p-3 pr-10 text-small text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                  @keyup.ctrl.enter="handleAddComment"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-caption text-gray-400">Tekan Ctrl + Enter untuk mengirim</span>
                <button
                  type="button"
                  :disabled="!draft.trim()"
                  class="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-button font-semibold text-small transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  @click="handleAddComment"
                >
                  <Send class="h-3.5 w-3.5" />
                  Kirim Komentar
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

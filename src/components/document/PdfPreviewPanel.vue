<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { EventBus, PDFLinkService, PDFFindController, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Printer, Search, X, ZoomIn, ZoomOut } from 'lucide-vue-next'
import 'pdfjs-dist/web/pdf_viewer.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const props = defineProps({ document: { type: Object, default: null } })
const emit = defineEmits(['close'])
const containerRef = ref(null)
const viewerRef = ref(null)
const searchInputRef = ref(null)
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const currentScale = ref(1)
const searchOpen = ref(false)
const searchQuery = ref('')
const currentMatch = ref(0)
const totalMatches = ref(0)

let loadingTask = null
let pdfDocument = null
let eventBus = null
let linkService = null
let findController = null
let pdfViewer = null
const fallbackPdfSource = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'

function resetState() {
  currentPage.value = 1
  totalPages.value = 0
  currentScale.value = 1
  searchQuery.value = ''
  currentMatch.value = 0
  totalMatches.value = 0
}

async function destroyViewer() {
  if (loadingTask) {
    try { await loadingTask.destroy() } catch { /* already closed */ }
  }
  loadingTask = null
  pdfDocument = null
  pdfViewer = null
  findController = null
  linkService = null
  eventBus = null
}

async function initializeViewer() {
  if (!props.document || !containerRef.value || !viewerRef.value) return
  await destroyViewer()
  resetState()
  loading.value = true
  error.value = ''

  try {
    eventBus = new EventBus()
    linkService = new PDFLinkService({ eventBus })
    findController = new PDFFindController({ eventBus, linkService })
    pdfViewer = new PDFViewer({ container: containerRef.value, viewer: viewerRef.value, eventBus, linkService, findController, textLayerMode: 1 })
    linkService.setViewer(pdfViewer)
    eventBus.on('pagesinit', () => { pdfViewer.currentScaleValue = 'page-width'; currentScale.value = pdfViewer.currentScale })
    eventBus.on('pagechanging', ({ pageNumber }) => { currentPage.value = pageNumber })
    eventBus.on('scalechanging', ({ scale }) => { currentScale.value = scale })
    eventBus.on('updatefindmatchescount', ({ matchesCount }) => { currentMatch.value = matchesCount?.current || 0; totalMatches.value = matchesCount?.total || 0 })
    eventBus.on('updatefindcontrolstate', ({ matchesCount }) => { currentMatch.value = matchesCount?.current || 0; totalMatches.value = matchesCount?.total || 0 })
    loadingTask = pdfjsLib.getDocument({ url: props.document.source || fallbackPdfSource, enableXfa: true })
    pdfDocument = await loadingTask.promise
    totalPages.value = pdfDocument.numPages
    pdfViewer.setDocument(pdfDocument)
    linkService.setDocument(pdfDocument, null)
    loading.value = false
  } catch (err) {
    console.error('PDF viewer error:', err)
    error.value = err?.message || 'PDF tidak dapat dimuat.'
    loading.value = false
  }
}

function previousPage() { if (pdfViewer && currentPage.value > 1) pdfViewer.currentPageNumber -= 1 }
function nextPage() { if (pdfViewer && currentPage.value < totalPages.value) pdfViewer.currentPageNumber += 1 }
function goToPage(event) {
  if (!pdfViewer) return
  pdfViewer.currentPageNumber = Math.min(Math.max(Number(event.target.value) || currentPage.value, 1), totalPages.value)
}
function zoomAtPoint(factor, clientX = null, clientY = null) {
  if (!pdfViewer) return
  const container = containerRef.value
  const oldScale = pdfViewer.currentScale || currentScale.value || 1
  const targetScale = Math.min(Math.max(oldScale * factor, 0.25), 4)
  let anchorX = null
  let anchorY = null
  let rect = null
  if (container && clientX !== null && clientY !== null) {
    rect = container.getBoundingClientRect()
    anchorX = container.scrollLeft + clientX - rect.left
    anchorY = container.scrollTop + clientY - rect.top
  }
  pdfViewer.currentScaleValue = targetScale
  if (anchorX === null) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ratio = (pdfViewer?.currentScale || targetScale) / oldScale
      if (!container || !rect) return
      container.scrollLeft = anchorX * ratio - (clientX - rect.left)
      container.scrollTop = anchorY * ratio - (clientY - rect.top)
    })
  })
}
function zoomIn() { zoomAtPoint(1.1) }
function zoomOut() { zoomAtPoint(1 / 1.1) }
function resetZoom() { if (pdfViewer) pdfViewer.currentScaleValue = 'page-width' }

function handleViewerWheel(event) {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  zoomAtPoint(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX, event.clientY)
}

function executeSearch(query = searchQuery.value, findPrevious = false, type = '') {
  if (!eventBus || !findController) return
  const state = { query: query.trim(), phraseSearch: true, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious }
  if (typeof findController.executeCommand === 'function') findController.executeCommand('find', state)
  else eventBus.dispatch('find', { source: findController, type, ...state })
}
function openSearch() { searchOpen.value = true; nextTick(() => { searchInputRef.value?.focus(); searchInputRef.value?.select() }) }
function closeSearch() { searchOpen.value = false; searchQuery.value = ''; currentMatch.value = 0; totalMatches.value = 0; executeSearch('') }
function handleKeyboard(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); openSearch() }
  else if (event.key === 'Escape' && searchOpen.value) closeSearch()
}
function downloadPdf() {
  const link = window.document.createElement('a')
  link.href = props.document?.source || fallbackPdfSource
  link.download = props.document?.name || 'dokumen.pdf'
  link.target = '_blank'
  link.rel = 'noopener'
  window.document.body.appendChild(link)
  link.click()
  link.remove()
}
function printPdf() {
  const iframe = window.document.createElement('iframe')
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  iframe.src = props.document?.source || fallbackPdfSource
  window.document.body.appendChild(iframe)
  iframe.onload = () => { try { iframe.contentWindow?.focus(); iframe.contentWindow?.print() } catch { window.open(iframe.src, '_blank') }; setTimeout(() => iframe.remove(), 1000) }
}

watch(() => props.document, async (value) => {
  if (!value) { await destroyViewer(); resetState(); return }
  await nextTick()
  initializeViewer()
})
onMounted(() => { window.addEventListener('keydown', handleKeyboard); if (props.document) initializeViewer() })
onBeforeUnmount(async () => { window.removeEventListener('keydown', handleKeyboard); await destroyViewer() })
</script>

<template>
  <div v-if="document" class="fixed inset-y-0 right-0 z-[60] flex w-full max-w-3xl flex-col border-l border-gray-200 bg-white shadow-modal">
    <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <div class="min-w-0"><p class="text-cardtitle text-gray-900">Preview Dokumen</p><p class="mt-0.5 truncate text-caption text-gray-500">{{ document.name }}</p></div>
      <button type="button" class="ml-3 rounded-button px-3 py-2 text-small text-gray-500 hover:bg-gray-100" aria-label="Tutup preview" @click="emit('close')">Tutup</button>
    </div>
    <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
      <button type="button" class="viewer-button" :disabled="currentPage <= 1" aria-label="Halaman sebelumnya" @click="previousPage"><ChevronLeft class="h-4 w-4" /></button>
      <input class="page-input" type="number" :value="currentPage" min="1" :max="totalPages" aria-label="Nomor halaman" @change="goToPage" @keyup.enter="goToPage" />
      <span class="text-small text-gray-500">/ {{ totalPages || '-' }}</span>
      <button type="button" class="viewer-button" :disabled="currentPage >= totalPages" aria-label="Halaman berikutnya" @click="nextPage"><ChevronRight class="h-4 w-4" /></button>
      <span class="mx-1 h-5 border-l border-gray-200" />
      <button type="button" class="viewer-button" aria-label="Perkecil" @click="zoomOut"><ZoomOut class="h-4 w-4" /></button>
      <button type="button" class="zoom-label" aria-label="Reset zoom" @click="resetZoom">{{ Math.round(currentScale * 100) }}%</button>
      <button type="button" class="viewer-button" aria-label="Perbesar" @click="zoomIn"><ZoomIn class="h-4 w-4" /></button>
      <div class="ml-auto flex items-center gap-1">
        <button type="button" class="viewer-button" title="Cari (Ctrl + F)" aria-label="Cari" @click="openSearch"><Search class="h-4 w-4" /></button>
        <button type="button" class="viewer-action" @click="downloadPdf"><Download class="h-4 w-4" /> Download</button>
        <button type="button" class="viewer-button" title="Print" aria-label="Print" @click="printPdf"><Printer class="h-4 w-4" /></button>
      </div>
    </div>
    <div v-if="searchOpen" class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
      <Search class="h-4 w-4 shrink-0 text-gray-400" />
      <input ref="searchInputRef" v-model="searchQuery" type="search" placeholder="Cari teks dalam dokumen..." class="h-9 min-w-0 flex-1 rounded-input border border-gray-200 bg-white px-3 text-small focus:border-brand-500" @input="executeSearch()" @keyup.enter="executeSearch(searchQuery, false, 'again')" />
      <span v-if="searchQuery" class="min-w-12 text-center text-caption text-gray-500">{{ currentMatch }} / {{ totalMatches }}</span>
      <button type="button" class="viewer-button" :disabled="!totalMatches" aria-label="Hasil sebelumnya" @click="executeSearch(searchQuery, true, 'again')"><ArrowUp class="h-4 w-4" /></button>
      <button type="button" class="viewer-button" :disabled="!totalMatches" aria-label="Hasil berikutnya" @click="executeSearch(searchQuery, false, 'again')"><ArrowDown class="h-4 w-4" /></button>
      <button type="button" class="viewer-button" aria-label="Tutup pencarian" @click="closeSearch"><X class="h-4 w-4" /></button>
    </div>
    <div class="pdf-preview-area">
      <div v-if="loading" class="pdf-state">Memuat dokumen...</div>
      <div v-if="error" class="pdf-state text-danger">{{ error }}</div>
      <div ref="containerRef" class="pdf-viewer-container" @wheel="handleViewerWheel"><div ref="viewerRef" class="pdfViewer" /></div>
    </div>
  </div>
</template>

<style scoped>
.pdf-preview-area { position: relative; flex: 1; min-height: 0; background: #e5e7eb; }
.pdf-viewer-container { position: absolute; inset: 0; overflow: auto; }
.pdfViewer { position: relative; padding: 24px 0; }
.viewer-button { display: inline-flex; height: 34px; width: 34px; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 6px; color: #4b5563; background: #fff; }
.viewer-button:hover:not(:disabled) { background: #f3f4f6; }
.viewer-button:disabled { cursor: not-allowed; opacity: .4; }
.viewer-action { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; color: #4b5563; background: #fff; font-size: 12px; }
.viewer-action:hover { background: #f3f4f6; }
.page-input { width: 52px; height: 32px; border: 1px solid #d1d5db; border-radius: 5px; padding: 0 6px; text-align: center; font-size: 13px; }
.zoom-label { min-width: 52px; height: 32px; border-radius: 5px; color: #4b5563; font-size: 12px; }
.zoom-label:hover { background: #f3f4f6; }
.pdf-state { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: #f9fafb; color: #6b7280; font-size: 14px; }
</style>

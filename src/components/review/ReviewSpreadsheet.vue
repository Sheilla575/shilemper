<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ICommandService } from '@univerjs/core'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import '@univerjs/preset-sheets-core/lib/index.css'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  cycleNumber: { type: [Number, String], default: 0 },
  autosaveStatus: { type: String, default: 'saved' },
  lastSavedAt: { type: String, default: '' },
})
const emit = defineEmits(['autosave', 'change', 'comment'])

const containerRef = ref(null)
let univerInstance = null
let commandSubscription = null
let saveTimer = null

const fallbackRows = [
  { clause: '1.1', clauseContent: 'The parties agree...', comment: '', onReview: '' },
  { clause: '2.1', clauseContent: 'Payment shall be...', comment: '', onReview: '' },
  { clause: '3.2', clauseContent: 'Termination...', comment: '', onReview: '' },
]
const statusLabel = { OPEN: 'Open', IN_REVIEW: 'Sedang Direview', RESOLVED: 'Selesai' }
const statusValue = Object.fromEntries(Object.entries(statusLabel).map(([value, label]) => [label.toLowerCase(), value]))

onMounted(() => {
  const sourceRows = props.rows.length ? props.rows : fallbackRows
  const autosaveKey = `sitrack-review-draft-${props.cycleNumber}`
  try {
    const savedChanges = JSON.parse(window.localStorage.getItem(autosaveKey) || '[]')
    savedChanges.forEach((change) => {
      const row = sourceRows.find((item) => item.reviewItemId === change.reviewItemId)
      if (row) {
        row.clause = change.clause
        row.comment = change.comment
      }
    })
  } catch {
    // A corrupt browser draft must not prevent the review table from opening.
  }
  const { univer, univerAPI } = createUniver({
    locale: LocaleType.EN_US,
    locales: { [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS) },
    presets: [UniverSheetsCorePreset({ container: containerRef.value })],
  })

  univerInstance = univer
  const workbook = univerAPI.createWorkbook({
    id: `sitrack-review-cycle-${props.cycleNumber}`,
    name: `SITRACK Review Cycle ${props.cycleNumber}`,
    sheetCount: 1,
  })
  const sheet = workbook.getActiveSheet()
  sheet.getRange(`A1:E${sourceRows.length + 1}`).setValues([
    ['No.', 'Klausul Kontrak', 'Catatan / Review dari SENA', 'On Review', 'Status Review'],
    ...sourceRows.map((row, index) => [
      index + 1,
      [row.clause, row.clauseContent].filter(Boolean).join('\n'),
      row.comment || row.reviewNote || '',
      row.onReview || '',
      statusLabel[row.status] || row.status || 'Open',
    ]),
  ])

  const syncRowsForAutosave = () => {
    const values = sheet.getRange(`A2:E${sourceRows.length + 1}`).getValues()
    const changes = sourceRows.map((row, index) => ({
      reviewItemId: row.reviewItemId,
      clause: String(values[index]?.[1] ?? ''),
      comment: String(values[index]?.[2] ?? ''),
      status: statusValue[String(values[index]?.[4] ?? '').toLowerCase()] || row.status || 'OPEN',
    }))
    changes.forEach((change, index) => {
      sourceRows[index].clause = change.clause
      sourceRows[index].comment = change.comment
      sourceRows[index].status = change.status
    })
    window.localStorage.setItem(autosaveKey, JSON.stringify(changes))
    emit('autosave', changes)
  }

  const commandService = univer.__getInjector().get(ICommandService)
  commandSubscription = commandService.onCommandExecuted((command) => {
    if (command.id !== 'sheet.mutation.set-range-values' || command.params?.unitId !== workbook.getId()) return
    emit('change')
    clearTimeout(saveTimer)
    saveTimer = setTimeout(syncRowsForAutosave, 900)
  })
})

onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  commandSubscription?.dispose()
  commandSubscription = null
  univerInstance?.dispose()
  univerInstance = null
})
</script>

<template>
  <div class="mb-3 flex items-center justify-between gap-3 rounded-input border px-3 py-2 text-small" :class="autosaveStatus === 'saved' ? 'border-success/40 bg-success-light/30 text-success' : 'border-warning/40 bg-warning-light/30 text-warning'">
    <span class="font-semibold">{{ autosaveStatus === 'pending' ? 'Perubahan belum tersimpan' : autosaveStatus === 'saving' ? 'Menyimpan perubahan…' : '✓ Tersimpan otomatis' }}</span>
    <span v-if="autosaveStatus === 'saved' && lastSavedAt" class="text-caption">{{ lastSavedAt }}</span>
  </div>
  <p class="mb-2 text-caption text-gray-500">Status Review: <span class="font-medium">Open</span> (belum ditelaah), <span class="font-medium">Sedang Direview</span>, atau <span class="font-medium">Selesai</span>. Ubah nilai pada kolom Status Review sesuai progres row.</p>
  <div ref="containerRef" class="univer-container" />
  <div class="mt-3 flex flex-wrap items-center gap-2 rounded-input border border-gray-200 bg-gray-50 px-3 py-2">
    <span class="mr-1 text-caption font-semibold text-gray-600">Komentar per row:</span>
    <button v-for="(row, index) in rows" :key="row.reviewItemId || index" type="button" class="inline-flex h-8 items-center rounded-input border border-gray-200 bg-white px-2.5 text-caption font-medium text-gray-700 hover:border-brand-300 hover:text-brand-700" @click="emit('comment', row)">
      Row {{ index + 1 }} <span class="ml-1 text-gray-400">({{ row.comments?.length || 0 }})</span>
    </button>
  </div>
</template>

<style scoped>
.univer-container {
  width: 100%;
  height: 600px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
</style>

<script setup>
import AppLayout from '../../components/layout/AppLayout.vue'
import StatCard from '../../components/ui/StatCard.vue'
import TaskList from '../../components/legal/TaskList.vue'
import { USERS } from '../../data/users'
import { LEGAL_SUMMARY } from '../../data/legal'

const user = USERS.legal
</script>

<template>
  <AppLayout role-key="legal" :user="user" :breadcrumb="['Legal Portal']">
    <div class="hero-gradient relative mb-6 overflow-hidden rounded-card p-4 text-white sm:mb-2xl sm:p-2xl">
      <span class="mb-3 inline-block rounded-badge bg-white/15 px-2.5 py-1 text-caption font-semibold">LEGAL TEAM · REVIEW CENTER</span>
      <h1 class="text-pagetitle">Welcome, {{ user.name }}</h1>
      <p class="mt-2 max-w-2xl text-body text-white/80">Manage active reviews and check new document requests from Requestors.</p>
    </div>
    <div class="mb-2xl grid grid-cols-2 gap-lg md:grid-cols-4">
      <StatCard label="New Requests" :value="LEGAL_SUMMARY.pendingValidation" tone="warning" hint="From Requestors" />
      <StatCard label="Active Tasks" :value="LEGAL_SUMMARY.openReviewTasks" hint="Reviews in progress" />
      <StatCard label="Waiting for Collaborator" :value="LEGAL_SUMMARY.awaitingCollaborator" tone="warning" hint="Waiting for review result" />
      <StatCard label="Completed This Month" :value="LEGAL_SUMMARY.completedThisMonth" tone="success" hint="Legal review completed" />
    </div>
    <div class="space-y-2xl">
      <TaskList title="Pekerjaan yang Sedang Saya Kerjakan" description="Tugas review legal yang sedang ditangani." scope="review" />
      <TaskList title="Antrian Baru dari Requestor" description="Dokumen baru yang menunggu validasi Team Legal." scope="validation" />
    </div>
  </AppLayout>
</template>

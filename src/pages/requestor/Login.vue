<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Scale, Eye, EyeOff } from 'lucide-vue-next'
import Button from '../../components/ui/Button.vue'
import { USERS } from '../../data/users'

const router = useRouter()

// Demo-only role switcher. In production, SSO authenticates the user and the
// backend maps their identity to exactly one SITRACK role (DESIGN.md §15) —
// the person never chooses their own role.
const roleKey = ref('nonlegal')
const roleOptions = [
  { value: 'nonlegal', label: 'Non-Legal' },
  { value: 'legal', label: 'Team Legal' },
]
const roleDashboard = { nonlegal: '/requestor/dashboard', legal: '/legal/dashboard' }

const email = ref(USERS.requestor.email)
const password = ref('••••••••••••')
const showPassword = ref(false)
const loading = ref(false)

watch(roleKey, (key) => { email.value = key === 'nonlegal' ? USERS.requestor.email : USERS[key].email })

function handleLogin() {
  // In production this redirects to company SSO (DESIGN.md §15).
  // SSO authenticates, then maps identity -> SITRACK role -> session.
  loading.value = true
  setTimeout(() => {
    loading.value = false
    router.push(roleDashboard[roleKey.value])
  }, 500)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-lg">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-2xl">
        <div class="h-12 w-12 rounded-xl bg-brand-700 flex items-center justify-center text-white mb-3">
          <Scale class="h-6 w-6" />
        </div>
        <h1 class="text-cardtitle text-gray-900">SITRACK</h1>
      </div>

      <div class="text-center mb-xl">
        <h2 class="text-sectiontitle text-gray-900">Masuk ke Akun SITRACK</h2>
        <p class="mt-1 text-small text-gray-500">Sistem Manajemen & Telaah Kontrak Hukum Korporat</p>
      </div>

      <form class="rounded-card border border-gray-200 bg-white p-2xl shadow-card space-y-lg" @submit.prevent="handleLogin">
        <div>
          <label class="block text-small font-semibold text-gray-900 mb-1.5">Masuk sebagai (demo)</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in roleOptions"
              :key="opt.value"
              type="button"
              class="h-9 rounded-input border text-small font-medium"
              :class="roleKey === opt.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700'"
              @click="roleKey = opt.value"
            >{{ opt.label }}</button>
          </div>
          <p class="mt-1 text-caption text-gray-500">Pemilihan ini hanya untuk kebutuhan demo — pada produksi, role ditentukan otomatis oleh SSO.</p>
        </div>
        <div>
          <label for="email" class="block text-small font-semibold text-gray-900 mb-1.5">Email *</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full h-10 rounded-input border border-gray-200 px-3 text-body focus:border-brand-500"
          />
        </div>
        <div>
          <label for="password" class="block text-small font-semibold text-gray-900 mb-1.5">Kata Sandi *</label>
          <div class="relative">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              class="w-full h-10 rounded-input border border-gray-200 px-3 pr-10 text-body focus:border-brand-500"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
            </button>
          </div>
        </div>
        <Button type="submit" variant="primary" class="w-full" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </Button>
      </form>

      <div class="mt-2xl flex items-center justify-center gap-lg text-caption text-gray-500">
        <a href="#" class="hover:text-gray-700">Ketentuan Layanan</a>
        <span>·</span>
        <a href="#" class="hover:text-gray-700">Kebijakan Privasi</a>
        <span>·</span>
        <a href="#" class="hover:text-gray-700">IT Helpdesk</a>
      </div>
      <p class="mt-2 text-center text-caption text-gray-300">© 2026 SITRACK Legal. Hak Cipta Dilindungi Undang-Undang.</p>
    </div>
  </div>
</template>

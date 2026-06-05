<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const me = ref(null)
const loading = ref(true)

// perfil
const name = ref('')
const savingProfile = ref(false)
const profileMsg = ref('')

// avatar
const uploadingAvatar = ref(false)

// contraseña
const pwd = ref({ current: '', next: '', confirm: '' })
const savingPwd = ref(false)
const pwdMsg = ref('')
const pwdErr = ref('')

const roleLabel = () => me.value?.role === 'admin' ? 'Administrador (acceso total)' : (me.value?.roleName || 'Staff')

const load = async () => {
  loading.value = true
  try {
    me.value = await auth.fetchMe()
    name.value = me.value.name || ''
  } finally { loading.value = false }
}

const saveProfile = async () => {
  savingProfile.value = true; profileMsg.value = ''
  try {
    await auth.saveProfile({ name: name.value })
    me.value.name = name.value
    profileMsg.value = '✅ Guardado'
  } finally { savingProfile.value = false }
}

const onAvatar = async (e) => {
  const f = e.target.files[0]; if (!f) return
  uploadingAvatar.value = true
  try {
    const out = await auth.uploadAvatar(f)
    if (out.avatar) me.value.avatar = out.avatar
  } finally { uploadingAvatar.value = false }
}

const savePassword = async () => {
  pwdErr.value = ''; pwdMsg.value = ''
  if (pwd.value.next !== pwd.value.confirm) { pwdErr.value = 'Las contraseñas no coinciden'; return }
  savingPwd.value = true
  try {
    await auth.changePassword(pwd.value.current, pwd.value.next)
    pwd.value = { current: '', next: '', confirm: '' }
    pwdMsg.value = '✅ Contraseña actualizada'
  } catch (e) { pwdErr.value = e.message } finally { savingPwd.value = false }
}

onMounted(load)
</script>

<template>
  <div class="p-8 max-w-3xl">
    <h1 class="text-2xl font-bold text-brand-dark">Configuración</h1>
    <div class="h-1 w-16 bg-brand-base rounded-full mb-6 mt-1"></div>

    <div v-if="loading" class="text-gray-400">Cargando...</div>
    <template v-else>
      <!-- Perfil -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div class="flex items-center gap-5 mb-5">
          <div class="relative">
            <img v-if="me.avatar?.url" :src="me.avatar.url" class="w-20 h-20 rounded-full object-cover ring-2 ring-brand-base/30" />
            <div v-else class="w-20 h-20 rounded-full bg-brand-base/15 flex items-center justify-center text-3xl font-bold text-brand-medium">{{ me.name?.[0] }}</div>
            <label class="absolute -bottom-1 -right-1 bg-brand-green text-white w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-lightGreen text-sm shadow">
              <span v-if="!uploadingAvatar">✎</span><span v-else>…</span>
              <input type="file" accept="image/*" class="hidden" @change="onAvatar" />
            </label>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-brand-dark">{{ me.name }}</h2>
            <p class="text-sm text-gray-500">{{ me.email || '—' }}</p>
            <span class="inline-block mt-1 text-xs bg-brand-base/15 text-brand-medium px-2 py-0.5 rounded-full">{{ roleLabel() }}</span>
          </div>
        </div>

        <label class="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
        <div class="flex gap-2">
          <input v-model="name" class="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-base" />
          <button @click="saveProfile" :disabled="savingProfile" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen disabled:opacity-50">
            {{ savingProfile ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
        <p v-if="profileMsg" class="text-xs text-green-600 mt-1">{{ profileMsg }}</p>
      </div>

      <!-- Datos de cuenta -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-5">
        <h3 class="font-semibold text-gray-700 mb-3">Datos de la cuenta</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-gray-400 text-xs">Correo</p><p class="text-brand-dark">{{ me.email || '—' }}</p></div>
          <div><p class="text-gray-400 text-xs">Rol</p><p class="text-brand-dark">{{ roleLabel() }}</p></div>
        </div>
        <div v-if="me.modules?.length" class="mt-3">
          <p class="text-gray-400 text-xs mb-1">Módulos con acceso</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="m in me.modules" :key="m" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{{ m }}</span>
          </div>
        </div>
      </div>

      <!-- Cambiar contraseña -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="font-semibold text-gray-700 mb-3">Cambiar contraseña</h3>
        <div v-if="pwdErr" class="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-3">{{ pwdErr }}</div>
        <div class="space-y-3 max-w-sm">
          <input v-model="pwd.current" type="password" placeholder="Contraseña actual" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-base" />
          <input v-model="pwd.next" type="password" placeholder="Nueva contraseña (mín. 6)" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-base" />
          <input v-model="pwd.confirm" type="password" placeholder="Confirmar nueva contraseña" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-base" />
          <button @click="savePassword" :disabled="savingPwd" class="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-lightGreen disabled:opacity-50">
            {{ savingPwd ? 'Actualizando...' : 'Actualizar contraseña' }}
          </button>
          <p v-if="pwdMsg" class="text-xs text-green-600">{{ pwdMsg }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

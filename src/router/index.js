import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue') },
  { path: '/', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true, module: 'dashboard' } },
  { path: '/providers', component: () => import('../views/ProvidersView.vue'), meta: { requiresAuth: true, module: 'providers' } },
  { path: '/users', component: () => import('../views/UsersView.vue'), meta: { requiresAuth: true, module: 'users' } },
  { path: '/roles', component: () => import('../views/RolesView.vue'), meta: { requiresAuth: true, module: 'roles' } },
  { path: '/subscriptions', component: () => import('../views/SubscriptionsView.vue'), meta: { requiresAuth: true, module: 'subscriptions' } },
  { path: '/categories', component: () => import('../views/CategoriesView.vue'), meta: { requiresAuth: true, module: 'categories' } },
  { path: '/conversations', component: () => import('../views/ConversationsView.vue'), meta: { requiresAuth: true, module: 'conversations' } },
  { path: '/requests', component: () => import('../views/RequestsView.vue'), meta: { requiresAuth: true, module: 'requests' } },
  { path: '/whatsapp', component: () => import('../views/WhatsAppView.vue'), meta: { requiresAuth: true, module: 'whatsapp' } },
  { path: '/bot', component: () => import('../views/BotConfigView.vue'), meta: { requiresAuth: true, module: 'bot' } },
  { path: '/settings', component: () => import('../views/SettingsView.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  // Gating por módulo: si no tiene acceso, mándalo al primero permitido o a Configuración (siempre disponible)
  if (to.meta.requiresAuth && to.meta.module && !auth.canAccess(to.meta.module)) {
    const first = auth.modules?.[0]
    const map = { dashboard: '/', providers: '/providers', users: '/users', roles: '/roles', conversations: '/conversations', requests: '/requests', whatsapp: '/whatsapp', bot: '/bot', subscriptions: '/subscriptions', categories: '/categories' }
    return first ? (map[first] || '/settings') : '/settings'
  }
})

export default router

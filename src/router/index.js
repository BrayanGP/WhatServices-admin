import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue') },
  { path: '/', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/providers', component: () => import('../views/ProvidersView.vue'), meta: { requiresAuth: true } },
  { path: '/users', component: () => import('../views/UsersView.vue'), meta: { requiresAuth: true } },
  { path: '/subscriptions', component: () => import('../views/SubscriptionsView.vue'), meta: { requiresAuth: true } },
  { path: '/categories', component: () => import('../views/CategoriesView.vue'), meta: { requiresAuth: true } },
  { path: '/conversations', component: () => import('../views/ConversationsView.vue'), meta: { requiresAuth: true } },
  { path: '/whatsapp', component: () => import('../views/WhatsAppView.vue'), meta: { requiresAuth: true } },
  { path: '/bot', component: () => import('../views/BotConfigView.vue'), meta: { requiresAuth: true } },
  { path: '/settings', component: () => import('../views/SettingsView.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
})

export default router

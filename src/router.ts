import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/meeting', name: 'meeting', component: () => import('@/views/Meeting.vue') },
    { path: '/relay', name: 'relay', component: () => import('@/views/Relay.vue') },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue')
    }
  ]
})

export default router

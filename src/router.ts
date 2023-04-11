import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/Home.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/meeting', name: 'meeting', component: () => import('@/views/Meeting.vue') },
    { path: '/relay', name: 'relay', component: () => import('@/views/Selectable.vue') },
  ]
})

export default router

import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/Home.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/meeting', name: 'meeting', component: () => import('@/views/Meeting.vue') },
    { path: '/selectable', name: 'selectable', component: () => import('@/views/Selectable.vue') },
    { path: '/relay', name: 'relay', component: () => import('@/views/Relay.vue') },
  ]
})

export default router

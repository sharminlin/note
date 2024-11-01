import { createWebHistory, createRouter } from 'vue-router'

import HomeView from '../page/home/index.vue'
import SceneView from '../page/01-scene/index.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/01-scene', component: SceneView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

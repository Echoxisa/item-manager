import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AreaView from '../views/AreaView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/area/:id', name: 'area', component: AreaView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
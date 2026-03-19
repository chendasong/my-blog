import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/pages/HomePage.vue'),
        },
        {
          path: 'blog',
          name: 'blog',
          component: () => import('@/pages/blog/BlogList.vue'),
        },
        {
          path: 'blog/new',
          name: 'blog-new',
          component: () => import('@/pages/blog/BlogEditor.vue'),
        },
        {
          path: 'blog/:id',
          name: 'blog-detail',
          component: () => import('@/pages/blog/BlogDetail.vue'),
        },
        {
          path: 'blog/:id/edit',
          name: 'blog-edit',
          component: () => import('@/pages/blog/BlogEditor.vue'),
        },
        {
          path: 'notes',
          name: 'notes',
          component: () => import('@/pages/notes/NotesPage.vue'),
        },
        {
          path: 'ai',
          name: 'ai',
          component: () => import('@/pages/ai/AIPage.vue'),
        },
        {
          path: 'couple',
          name: 'couple-entry',
          component: () => import('@/pages/couple/CoupleEntry.vue'),
        },
        {
          path: 'couple/space',
          name: 'couple-space',
          component: () => import('@/pages/couple/CoupleSpace.vue'),
          meta: { requiresCoupleAuth: true },
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresCoupleAuth) {
    const authed = sessionStorage.getItem('couple_auth')
    if (!authed) {
      return { name: 'couple-entry' }
    }
  }
})

export default router

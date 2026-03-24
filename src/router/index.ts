import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
    },
    {
      path: '/admin/profile',
      name: 'admin-profile',
      component: () => import('@/pages/AdminProfile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/pages/HomePage.vue') },
        { path: 'blog', name: 'blog', component: () => import('@/pages/blog/BlogList.vue') },
        {
          path: 'blog/new',
          name: 'blog-new',
          component: () => import('@/pages/blog/BlogEditor.vue'),
        },
        { path: 'blog/:id', name: 'blog-detail', component: () => import('@/pages/blog/BlogDetail.vue') },
        {
          path: 'blog/:id/edit',
          name: 'blog-edit',
          component: () => import('@/pages/blog/BlogEditor.vue'),
          meta: { requiresAuth: true },
        },
        { path: 'notes', name: 'notes', component: () => import('@/pages/notes/NotesPage.vue') },
        { path: 'notes/new', name: 'notes-new', component: () => import('@/pages/notes/NoteEditor.vue') },
        { path: 'notes/:id', name: 'notes-detail', component: () => import('@/pages/notes/NoteDetail.vue') },
        { path: 'notes/:id/edit', name: 'notes-edit', component: () => import('@/pages/notes/NoteEditor.vue'), meta: { requiresAuth: true } },
        { path: 'ai', name: 'ai', component: () => import('@/pages/ai/AIPage.vue') },
        {
          path: 'ai/agent',
          name: 'ai-agent',
          component: () => import('@/pages/ai/AgentPage.vue'),
        },
        { path: 'resume', name: 'resume', component: () => import('@/pages/resume/ResumeView.vue') },
        {
          path: 'resume/edit',
          name: 'resume-edit',
          component: () => import('@/pages/resume/ResumeEditor.vue'),
          meta: { requiresAuth: true },
        },
        { path: 'couple', name: 'couple-entry', component: () => import('@/pages/couple/CoupleEntry.vue') },
        {
          path: 'couple/space',
          name: 'couple-space',
          component: () => import('@/pages/couple/CoupleSpace.vue'),
          meta: { requiresCoupleAuth: true },
        },
        {
          path: 'couple/memory/new',
          name: 'memory-new',
          component: () => import('@/pages/couple/MemoryEditor.vue'),
          meta: { requiresCoupleAuth: true },
        },
        {
          path: 'couple/memory/:id',
          name: 'memory-detail',
          component: () => import('@/pages/couple/MemoryDetail.vue'),
          meta: { requiresCoupleAuth: true },
        },
        {
          path: 'couple/memory/:id/edit',
          name: 'memory-edit',
          component: () => import('@/pages/couple/MemoryEditor.vue'),
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
  if (to.meta.requiresAuth) {
    const stored = localStorage.getItem('admin_user')
    if (!stored) return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresCoupleAuth) {
    const authed = sessionStorage.getItem('couple_auth')
    if (!authed) return { name: 'couple-entry' }
  }
})

export default router

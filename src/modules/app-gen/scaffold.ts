import type { AppGenFileMap, AppGenPlan } from './types'

/**
 * 生成固定 Vue3 + Vite + TS + Vue Router 脚手架（AppGenFileMap）。
 * 业务分工：本函数提供可 npm run dev 的完整工程骨架与占位页；LLM 只负责按 plan
 * 覆盖 views/components 等业务文件，避免每次从零写 package.json/router 导致结构漂移。
 */
export function createVueViteScaffold(plan: AppGenPlan): AppGenFileMap {
  const pkgName = sanitizePkgName(plan.appName)
  const routeImports = plan.routes
    .map((r) => `  { path: '${r.path}', name: '${r.name}', component: () => import('../views/${r.viewFile}') },`)
    .join('\n')

  const navLinks = plan.routes
    .map((r) => `      <RouterLink to="${r.path}">${escapeHtml(r.name)}</RouterLink>`)
    .join('\n')

  const files: AppGenFileMap = {
    'package.json': JSON.stringify(
      {
        name: pkgName,
        private: true,
        version: '0.0.1',
        type: 'module',
        scripts: {
          dev: 'vite --host',
          build: 'vite build',
          preview: 'vite preview --host',
        },
        dependencies: {
          vue: '^3.5.13',
          'vue-router': '^4.5.0',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.2.1',
          vite: '^6.0.7',
        },
      },
      null,
      2,
    ),
    'index.html': `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(plan.appTitle || plan.appName)}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"><\/script>
  </body>
</html>
`,
    'vite.config.ts': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
})
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          module: 'ESNext',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'preserve',
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
      },
      null,
      2,
    ),
    'tsconfig.node.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2023'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: 'force',
          noEmit: true,
          strict: true,
        },
        include: ['vite.config.ts'],
      },
      null,
      2,
    ),
    'src/vite-env.d.ts': `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`,
    'src/main.ts': `import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles.css'

createApp(App).use(router).mount('#app')
`,
    'src/App.vue': `<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">${escapeHtml(plan.appTitle || plan.appName)}</div>
      <nav class="nav">
${navLinks}
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
`,
    'src/styles.css': `:root {
  color-scheme: light;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #f6f8fc;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; }
a { color: #3b82f6; text-decoration: none; }
a.router-link-active { color: #1d4ed8; font-weight: 600; }

.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.app-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 14px 22px; background: #fff; border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 10;
}
.brand { font-weight: 700; font-size: 1.1rem; letter-spacing: -0.02em; }
.nav { display: flex; flex-wrap: wrap; gap: 14px; }
.app-main { width: min(960px, 100%); margin: 0 auto; padding: 28px 20px 48px; }

.card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
  padding: 20px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}
.grid { display: grid; gap: 16px; }
.grid-2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 16px; border-radius: 999px; border: none; cursor: pointer;
  background: #3b82f6; color: #fff; font-weight: 600;
}
.muted { color: #6b7280; }
h1,h2,h3 { line-height: 1.25; letter-spacing: -0.02em; }
`,
    'src/router/index.ts': `import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
${routeImports}
  ],
})
`,
    'README.md': `# ${plan.appTitle || plan.appName}

${plan.description || '由 AI 应用生成模块创建的 Vue 3 项目。'}

## 本地运行

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  }

  // plan 里声明的页面/组件若 LLM 尚未生成，先写占位，保证 merge 前工程即可编译预览
  for (const route of plan.routes) {
    const path = `src/views/${route.viewFile}`
    if (!files[path]) {
      files[path] = placeholderView(route.name, route.description)
    }
  }

  for (const comp of plan.components || []) {
    const path = `src/components/${comp.endsWith('.vue') ? comp : `${comp}.vue`}`
    if (!files[path]) {
      files[path] = placeholderComponent(comp.replace(/\.vue$/, ''))
    }
  }

  return files
}

/** 占位视图：LLM 流式生成完成前，用户仍能看到路由与页面标题，减少「空白页」感知 */
function placeholderView(title: string, desc: string): string {
  return `<script setup lang="ts">
</script>

<template>
  <section class="card">
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">${escapeHtml(desc || '页面内容生成中…')}</p>
  </section>
</template>
`
}

function placeholderComponent(name: string): string {
  return `<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="card">
    <h3>{{ title || '${escapeHtml(name)}' }}</h3>
    <slot />
  </div>
</template>
`
}

/** npm package name 只允许小写、数字、连字符，中文标题需转换否则 install 会报错 */
function sanitizePkgName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'ai-generated-app'
}

/** 用户/模型输入的标题可能含 HTML 特殊字符，写入模板字符串前必须转义 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

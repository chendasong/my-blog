/**
 * ESLint 与 Prettier 分工：
 * - 使用 eslint-config-prettier（最后一项）关闭与 Prettier 重叠的格式规则。
 * - 不要安装 eslint-plugin-prettier：会把 Prettier 再跑一遍进 ESLint，和 Prettier
 *   扩展 / CLI 双轨，易冲突、变慢。
 */
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

/** Vue：essential 侧重纠错，不含 recommended 里大量模板排版规则 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'api/**',
      '**/*.config.js',
    ],
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // ESLint 10+：重抛时建议挂 cause；与现有大量 catch/throw 不一致时先关闭
      'preserve-caught-error': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // 简历编辑器等沿用可变 props + 本地同步模式
      'vue/no-mutating-props': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'vite/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  /** 关闭与 Prettier 冲突的 ESLint 格式规则，须放在最后 */
  eslintConfigPrettier,
)

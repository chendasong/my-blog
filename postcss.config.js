/**
 * 生产构建时由 cssnano 压缩 CSS（与 Vite 内置 css 压缩二选一，见 vite.config.ts build.cssMinify）。
 * 开发模式不启用，避免拖慢 HMR。
 */
const prod = process.env.NODE_ENV === 'production'

export default {
  plugins: {
    ...(prod
      ? {
          cssnano: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }
      : {}),
  },
}

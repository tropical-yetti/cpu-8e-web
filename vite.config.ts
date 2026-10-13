import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // O site é publicado em https://<usuario>.github.io/cpu-8e-web/
  base: '/cpu-8e-web/',
  plugins: [
    vue(),
    // Mensagens de tradução pré-compiladas: menos código no site e nenhuma
    // avaliação de texto como código em tempo de execução.
    VueI18nPlugin({
      include: fileURLToPath(new URL('./src/locales/**', import.meta.url)),
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    environment: 'node',
  },
})

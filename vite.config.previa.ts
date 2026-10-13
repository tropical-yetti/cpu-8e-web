// Versão do site em um único arquivo HTML, para prévias (por exemplo, como
// página privada antes de o GitHub Pages estar ativo).
// SPDX-License-Identifier: GPL-3.0-or-later
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { outDir: 'dist-previa' },
})

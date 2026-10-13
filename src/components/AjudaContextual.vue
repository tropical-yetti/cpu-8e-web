<!--
  Botão "?" que abre a parte da documentação sobre um elemento da tela.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Pagina } from '@/docs/paginas'

defineProps<{ pagina: Pagina; secao?: string; assunto: string }>()
const { t } = useI18n()
</script>

<template>
  <RouterLink
    class="ajuda"
    :to="{ path: `/documentacao/${pagina}`, hash: secao ? `#${secao}` : '' }"
    :title="t('docs.ajuda', { assunto })"
    :aria-label="t('docs.ajuda', { assunto })"
  >
    ?
  </RouterLink>
</template>

<style scoped>
.ajuda {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  border: 1px solid var(--borda);
  border-radius: 50%;
  font:
    700 12px/1 Arial,
    sans-serif;
  color: var(--texto-suave);
  background: var(--fundo);
  text-decoration: none;
}
.ajuda:hover,
.ajuda:focus-visible {
  color: var(--destaque);
  border-color: var(--destaque);
  outline: none;
}
</style>

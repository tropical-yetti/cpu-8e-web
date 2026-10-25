<!--
  Botão "?" ao lado de uma parte da tela: abre o balão do guia só para
  aquela parte (ajuda contextual). O balão tem o link para a documentação.

  Copiado do MEM-8E Web (src/guia/BotaoAjuda.vue) em 2026-10-25 (ADR 0004).
  Modificado: sem os experimentos (chegam na 2.1).
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useGuia, type IdPasso } from './guia'

const props = defineProps<{ passo: IdPasso }>()
const { t } = useI18n()
const guia = useGuia()
</script>

<template>
  <button
    type="button"
    class="ajuda"
    :aria-label="t('guia.ajudaDe', { parte: t(`guia.passos.${props.passo}.titulo`) })"
    :title="t('guia.ajuda')"
    @click="guia.ajuda(props.passo)"
  >
    ?
  </button>
</template>

<style scoped>
.ajuda {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  font:
    700 0.8rem/1 system-ui,
    sans-serif;
  color: var(--texto-suave);
  background: var(--fundo-tabela);
  border: 1px solid var(--borda);
  border-radius: 50%;
  cursor: pointer;
  vertical-align: middle;
}
.ajuda:hover {
  color: var(--texto);
  background: var(--fundo-hover);
}
</style>

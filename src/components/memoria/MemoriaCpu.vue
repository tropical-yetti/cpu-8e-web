<!--
  A memória ao lado do painel (ADR 0006): o título, o seletor
  "Por dentro | Tabela" e a vista escolhida. Por dentro (linha × coluna) é o
  padrão; a tabela é a de antes, com endereço, conteúdo e símbolo.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AjudaContextual from '@/components/AjudaContextual.vue'
import TabelaMemoria from '@/components/TabelaMemoria.vue'
import { VISTAS_MEMORIA, useVistaMemoria } from '@/painel/vistaMemoria'
import GradeMemoria from './GradeMemoria.vue'

const { t } = useI18n()
const { vista, mudarVista } = useVistaMemoria()
</script>

<template>
  <section class="memoria-cpu" :class="`vista-${vista}`" aria-labelledby="titulo-memoria">
    <div class="cabeca">
      <h2 id="titulo-memoria">{{ t('memoria.titulo') }}</h2>
      <div class="vistas" role="radiogroup" :aria-label="t('grade.vista')">
        <button
          v-for="opcao in VISTAS_MEMORIA"
          :key="opcao"
          type="button"
          role="radio"
          :aria-checked="vista === opcao"
          @click="mudarVista(opcao)"
        >
          {{ t(`grade.vistas.${opcao}`) }}
        </button>
      </div>
      <AjudaContextual
        v-if="vista === 'porDentro'"
        pagina="simulador"
        secao="memoria"
        :assunto="t('memoria.titulo')"
      />
    </div>
    <GradeMemoria v-if="vista === 'porDentro'" />
    <TabelaMemoria v-else class="tabela" />
  </section>
</template>

<style scoped>
.memoria-cpu {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--fundo-painel);
}
.cabeca {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--borda);
}
h2 {
  flex: 1;
  margin: 0;
  font-size: 0.9rem;
}
.vistas {
  display: inline-flex;
  border: 1px solid var(--borda);
  border-radius: 6px;
  overflow: hidden;
}
.vistas button {
  min-height: 28px;
  padding: 2px 10px;
  font: inherit;
  font-size: 0.8rem;
  color: var(--texto-suave);
  background: var(--fundo-tabela);
  border: 0;
  cursor: pointer;
}
.vistas button + button {
  border-left: 1px solid var(--borda);
}
.vistas button[aria-checked='true'] {
  color: var(--texto);
  font-weight: 600;
  background: var(--fundo-hover);
}
/* Na tabela, a rolagem ocupa a altura que sobra. */
.tabela {
  flex: 1;
  border: 0;
}
</style>

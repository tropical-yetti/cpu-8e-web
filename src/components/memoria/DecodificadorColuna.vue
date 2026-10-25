<!--
  Decodificador de coluna 4 → 16, desenhado acima da grade: recebe os 4 bits
  baixos do endereço no MAR (A3–A0) e liga uma das 16 colunas.

  Na CPU-8E a memória não tem sinal de seleção (CS): o decodificador está
  sempre habilitado e acompanha o MAR.

  As medidas vêm de --cel-l (largura de uma célula da grade), para que cada
  saída caia exatamente sobre a sua coluna.

  Copiado do MEM-8E Web (src/components/porDentro/DecodificadorColuna.vue) em 2026-10-25 (ADR 0004).
  Modificado: sem a entrada EN (CS), entrada como número.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FormaBloco from './FormaBloco.vue'
import TracoDecodificador from './TracoDecodificador.vue'

/** A coluna escolhida (0 a 15), que é o valor de A3–A0. */
defineProps<{ coluna: number }>()
const { t } = useI18n()
</script>

<template>
  <div class="decodificador">
    <div class="caixa">
      <FormaBloco pontos="5,0 95,0 100,100 0,100" />
      <span class="entrada"
        >A3–A0 = {{ coluna.toString(2).padStart(4, '0') }} ({{
          coluna.toString(16).toUpperCase()
        }})</span
      >
      <span class="nome">{{ t('grade.decColuna') }}</span>
    </div>
    <div class="saidas">
      <TracoDecodificador v-for="i in 16" :key="i" :aceso="i - 1 === coluna" direcao="vertical" />
    </div>
  </div>
</template>

<style scoped>
.decodificador {
  display: grid;
  padding-left: calc(var(--cel-l) + 1px);
}
.caixa {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 2px 10px;
  padding: 5px 7% 6px;
  font-size: 0.74rem;
  color: var(--texto);
}
.caixa > span {
  position: relative;
  z-index: 1;
}
.nome {
  font-weight: 700;
}
.entrada {
  font-family: var(--mono);
}
.saidas {
  display: grid;
  grid-template-columns: repeat(16, var(--cel-l));
  height: 12px;
}
</style>

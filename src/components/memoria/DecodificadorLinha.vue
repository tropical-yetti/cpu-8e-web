<!--
  Decodificador de linha 4 → 16, desenhado à esquerda da grade: recebe os
  4 bits altos do endereço no MAR (A7–A4) e liga uma das 16 linhas.

  Na CPU-8E a memória não tem sinal de seleção (CS): o decodificador está
  sempre habilitado e acompanha o MAR.

  As medidas vêm de --cel-a (altura de uma célula da grade).

  Copiado do MEM-8E Web (src/components/porDentro/DecodificadorLinha.vue) em 2026-10-25 (ADR 0004).
  Modificado: sem a entrada EN (CS), mais estreito, entrada como número.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FormaBloco from './FormaBloco.vue'
import TracoDecodificador from './TracoDecodificador.vue'

/** A linha escolhida (0 a 15), que é o valor de A7–A4. */
defineProps<{ linha: number }>()
const { t } = useI18n()
</script>

<template>
  <div class="decodificador">
    <div class="caixa">
      <FormaBloco pontos="0,5 100,0 100,100 0,95" />
      <span class="nome vertical">{{ t('grade.decLinha') }}</span>
      <span class="entrada"
        >A7–A4<br />{{ linha.toString(2).padStart(4, '0') }}<br />({{
          linha.toString(16).toUpperCase()
        }})</span
      >
    </div>
    <div class="saidas">
      <TracoDecodificador v-for="i in 16" :key="i" :aceso="i - 1 === linha" direcao="horizontal" />
    </div>
  </div>
</template>

<style scoped>
.decodificador {
  display: grid;
  grid-template-columns: auto 10px;
  /* Pula a linha de cabeçalho da grade e a borda dela. */
  padding-top: calc(var(--cel-a) + 1px);
}
.caixa {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 3.2rem;
  height: calc(16 * var(--cel-a));
  padding: 14px 2px;
  font-size: 0.7rem;
  line-height: 1.3;
  text-align: center;
  color: var(--texto);
}
.caixa > span {
  position: relative;
  z-index: 1;
}
.nome {
  font-weight: 700;
}
/* O nome corre ao longo do bloco, de baixo para cima. */
.vertical {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
}
.entrada {
  font-family: var(--mono);
}
.saidas {
  display: grid;
  grid-template-rows: repeat(16, var(--cel-a));
}
/* Celular: o bloco fica estreito, só com o nome (A7–A4 aparece no resumo). */
@media (max-width: 480px) {
  .decodificador {
    grid-template-columns: auto 8px;
  }
  .caixa {
    width: 1.6rem;
    padding: 10px 0;
    font-size: 0.62rem;
  }
  .entrada {
    display: none;
  }
}
</style>

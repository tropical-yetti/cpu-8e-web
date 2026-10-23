<!--
  Um fio do painel novo: cheio na cor do barramento quando passa dado, fino e
  apagado quando não passa. A seta mostra para onde o dado vai.

  Só desenho: o que muda a cada pulso é anunciado em texto pelo painel.

  Copiado do MEM-8E Web (src/components/FioPainel.vue) em 2026-10-23 (ADR 0004).
  Modificado: só dois estados (aceso e apagado, sem Z nem X), fios verticais e
  a cor do barramento interno.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Nome sobre o fio (só nos barramentos entre a CPU e a memória). */
  nome?: string
  /** Chave da legenda (siglas.<chave> nas mensagens). */
  sigla?: string
  aceso: boolean
  /** Valor mostrado sobre o fio enquanto ele está aceso. */
  valor?: string
  cor: 'bi' | 'be' | 'bd' | 'controle'
  largo?: boolean
  vertical?: boolean
  /** Para onde o dado vai. */
  direcao?: 'direita' | 'esquerda' | 'baixo' | null
}>()

const classes = computed(() => [
  `cor-${props.cor}`,
  props.aceso ? 'aceso' : 'apagado',
  { largo: props.largo, vertical: props.vertical },
  props.aceso && props.direcao ? `para-${props.direcao}` : null,
])
</script>

<template>
  <div class="fio" :class="classes" aria-hidden="true" :data-sigla="sigla">
    <span v-if="nome" class="rotulo">
      <span class="nome">{{ nome }}</span>
      <span v-if="valor && aceso" class="valor">{{ valor }}</span>
    </span>
    <span class="linha"></span>
  </div>
</template>

<style scoped>
.fio {
  --cor: var(--fio-controle);
  --espessura: 4px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
  color: var(--cor);
}
.fio.cor-bi {
  --cor: var(--fio-bi);
}
.fio.cor-be {
  --cor: var(--fio-be);
}
.fio.cor-bd {
  --cor: var(--fio-bd);
}
.fio.largo {
  --espessura: 8px;
}
.fio.vertical {
  flex-direction: row;
  justify-content: center;
  min-height: 0;
  height: 100%;
}
.rotulo {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 4px;
  white-space: nowrap;
  /* O texto fica mais escuro (ou mais claro) que o fio, para ser legível. */
  color: color-mix(in srgb, var(--cor) 40%, var(--texto));
}
.valor {
  font-family: var(--mono);
}
.linha {
  position: relative;
  display: block;
  height: var(--espessura);
  border-radius: 2px;
  background: var(--cor);
  transition:
    background-color 120ms,
    height 120ms,
    width 120ms;
}
.vertical .linha {
  width: var(--espessura);
  height: auto;
  align-self: stretch;
}

/* Apagado: fino e cinza */
.fio.apagado {
  --cor: var(--fio-apagado);
  color: var(--texto-suave);
}
.apagado .linha {
  height: 2px;
}
.vertical.apagado .linha {
  width: 2px;
  height: auto;
}

/* Setas: um triângulo na ponta para onde o dado vai. */
.para-direita .linha::after,
.para-esquerda .linha::before,
.para-baixo .linha::after {
  content: '';
  position: absolute;
  border: calc(var(--espessura) / 2 + 5px) solid transparent;
}
.para-direita .linha::after {
  top: 50%;
  right: -9px;
  transform: translateY(-50%);
  border-left-color: var(--cor);
  border-right-width: 0;
}
.para-esquerda .linha::before {
  top: 50%;
  left: -9px;
  transform: translateY(-50%);
  border-right-color: var(--cor);
  border-left-width: 0;
}
.para-baixo .linha::after {
  left: 50%;
  bottom: -9px;
  transform: translateX(-50%);
  border-top-color: var(--cor);
  border-bottom-width: 0;
}
</style>

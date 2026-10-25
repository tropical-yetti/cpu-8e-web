<!--
  Um traço curto que liga a saída de um decodificador à sua linha ou coluna
  da grade: aceso (na cor do barramento de endereços) na saída escolhida,
  fino e apagado nas outras. Só desenho.

  Copiado do MEM-8E Web (src/components/porDentro/TracoNivel.vue) em 2026-10-25 (ADR 0004).
  Modificado: só dois estados (aceso e apagado, sem Z nem X), na cor do BE.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
defineProps<{ aceso: boolean; direcao: 'vertical' | 'horizontal' }>()
</script>

<template>
  <span class="traco" :class="[direcao, { aceso }]" aria-hidden="true"></span>
</template>

<style scoped>
.traco {
  display: block;
  justify-self: center;
  align-self: center;
  background: var(--fio-apagado);
  border-radius: 1px;
  transition: background-color 120ms;
}
.vertical {
  width: 1px;
  height: 100%;
}
.horizontal {
  width: 100%;
  height: 1px;
}
.aceso {
  background: var(--fio-be);
}
.vertical.aceso {
  width: 3px;
}
.horizontal.aceso {
  height: 3px;
}
</style>

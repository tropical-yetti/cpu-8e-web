<!--
  Tabela das instruções da CPU-8E, gerada a partir de src/core/opcodes.ts
  (a mesma tabela usada pelo decodificador), para nunca ficar desatualizada.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { INSTRUCOES, hex2, type ModoEnderecamento } from '@/core'

const { t, locale } = useI18n()
const idioma = computed<'pt' | 'en'>(() => (locale.value.startsWith('pt') ? 'pt' : 'en'))
const MODOS: ModoEnderecamento[] = ['implicito', 'imediato', 'direto']
</script>

<template>
  <div class="tabela-rolavel">
    <table class="instrucoes">
      <thead>
        <tr>
          <th scope="col">{{ t('docs.instrucao') }}</th>
          <th v-for="modo in MODOS" :key="modo" scope="col">{{ t(`docs.modos.${modo}`) }}</th>
          <th scope="col">{{ t('docs.efeito') }}</th>
          <th scope="col">{{ t('docs.descricao') }}</th>
          <th scope="col">{{ t('docs.flags') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="instrucao in INSTRUCOES" :key="instrucao.mnemonico">
          <th scope="row" class="mnemonico">{{ instrucao.mnemonico }}</th>
          <td v-for="modo in MODOS" :key="modo" class="codigo">
            {{ instrucao.codigos[modo] === undefined ? '' : `${hex2(instrucao.codigos[modo]!)}h` }}
          </td>
          <td class="efeito">{{ instrucao.efeito[idioma] }}</td>
          <td>{{ instrucao.descricao[idioma] }}</td>
          <td class="flags">{{ instrucao.alteraFlags ? 'Z N C' : '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.instrucoes {
  font-size: 0.9rem;
}
.mnemonico,
.codigo,
.efeito,
.flags {
  font-family: 'Courier New', monospace;
}
.mnemonico,
.codigo,
.flags {
  white-space: nowrap;
}
.efeito {
  min-width: 16ch;
}
.mnemonico {
  font-weight: 700;
}
.codigo {
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>

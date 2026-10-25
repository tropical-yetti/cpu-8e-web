<!--
  Tabela das siglas, gerada das mesmas mensagens das legendas (siglas.* nos
  arquivos de tradução): uma só fonte para a legenda e para a documentação.

  Copiado do MEM-8E Web (src/components/docs/TabelaSiglas.vue) em 2026-10-23 (ADR 0004).
  Modificado: a lista das siglas vem de src/painel/siglas.ts.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SIGLAS } from '@/painel/siglas'

const { t } = useI18n()
</script>

<template>
  <div class="tabela-rolavel" tabindex="0">
    <table>
      <thead>
        <tr>
          <th scope="col">{{ t('docs.sigla') }}</th>
          <th scope="col">{{ t('docs.significado') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sigla in SIGLAS" :id="`sigla-${sigla}`" :key="sigla">
          <th scope="row">
            <code>{{ t(`siglas.${sigla}.sigla`) }}</code>
          </th>
          <td>{{ t(`siglas.${sigla}.nome`) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

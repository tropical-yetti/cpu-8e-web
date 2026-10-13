<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { URL_CODIGO_FONTE, URL_CODIGO_ORIGINAL, URL_LICENCA } from '@/config'

const { t } = useI18n()
const VERSAO = __VERSAO__

/** Créditos da obra original, como em NOTICE.md. */
const AUTORES_ORIGINAIS = [
  { versao: '0.9 – 1.0b (2009)', nomes: 'Prof. Joel Guilherme da Silva Filho' },
  { versao: '2.0 – 2.1 (2009)', nomes: 'Wanderlan Santos dos Anjos, Bárbara A. B. dos Anjos' },
  { versao: '2.2 (2010)', nomes: 'Anderson de Souza Freitas, Daniel Machado Vasconcelos' },
]
</script>

<template>
  <article class="sobre">
    <h1>{{ t('sobre.titulo') }}</h1>
    <p>{{ t('sobre.historia') }}</p>

    <h2>{{ t('sobre.autoresOriginais') }}</h2>
    <p>Copyright 2009/10 Joel Guilherme da Silva Filho — IESB, Brasília/DF</p>
    <ul>
      <li v-for="autor in AUTORES_ORIGINAIS" :key="autor.versao">
        <strong>{{ autor.versao }}:</strong> {{ autor.nomes }}
      </li>
    </ul>
    <p>
      <a :href="URL_CODIGO_ORIGINAL" target="_blank" rel="noopener">{{
        t('sobre.codigoOriginal')
      }}</a>
    </p>

    <h2>{{ t('sobre.derivada') }}</h2>
    <p>{{ t('rodape.versao', { versao: VERSAO }) }}</p>
    <p>{{ t('sobre.modificacoes') }}</p>
    <p>
      <a :href="URL_CODIGO_FONTE" target="_blank" rel="noopener">{{ t('rodape.codigoFonte') }}</a>
    </p>

    <h2>{{ t('sobre.licencaTitulo') }}</h2>
    <p>{{ t('sobre.licenca') }}</p>
    <p>{{ t('sobre.garantia') }}</p>
    <p>
      <a :href="URL_LICENCA" target="_blank" rel="noopener">{{ t('sobre.lerLicenca') }}</a>
    </p>
  </article>
</template>

<style scoped>
.sobre {
  max-width: 72ch;
}
</style>

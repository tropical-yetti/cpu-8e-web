<!--
  Estado da CPU para leitores de tela: uma tabela (oculta na tela) com todos
  os valores do painel e um anúncio a cada parada da execução, dizendo o que
  mudou no pulso de clock.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSimuladorStore } from '@/stores/simulador'
import type { ItemPainel } from '@/core'
import { rotuloNoIdioma, siglaNoIdioma } from '@/painel/rotulos'

const simulador = useSimuladorStore()
const { t, locale } = useI18n()

/** Texto de um item do painel ("ULA:05") no idioma da interface ("ALU:05"). */
function texto(item: ItemPainel): string {
  return rotuloNoIdioma(simulador.painel.textos[item], locale.value)
}

const ITENS: ItemPainel[] = [
  'PC',
  'MAR',
  'MDR',
  'IR',
  'DI',
  'ACC',
  'A',
  'B',
  'ULA',
  'SP',
  'Z',
  'N',
  'C',
]

const anuncio = ref('')

/** O que dizer quando a execução para (pausa ou parada). */
function descreverParada(): string {
  const { painel } = simulador
  if (painel.status === 'parada') return t('acessivel.parada', { di: texto('DI') })
  const fase = painel.fase ? t(`fases.${painel.fase}`) : ''
  if (painel.realcados.length > 0) {
    const mudancas = painel.realcados.map(texto).join(', ')
    return t('acessivel.pulso', { fase, mudancas })
  }
  return t('acessivel.fimInstrucao', { di: texto('DI'), acc: texto('ACC') })
}

// Anuncia ao pausar (passo a passo ou ciclo) e ao parar, nunca durante a
// execução contínua, para não inundar o leitor de tela.
watch(
  () => [simulador.painel.status, simulador.painel.realcados] as const,
  ([status], [statusAnterior]) => {
    if (status === 'pausa' || (status === 'parada' && statusAnterior !== 'parada')) {
      anuncio.value = descreverParada()
    }
  },
)
</script>

<template>
  <div class="visualmente-oculto">
    <table>
      <caption>
        {{
          t('acessivel.titulo')
        }}
      </caption>
      <tbody>
        <tr v-for="item in ITENS" :key="item">
          <th scope="row">{{ siglaNoIdioma(item, locale) }}</th>
          <td>{{ simulador.painel.textos[item].split(':').slice(1).join(':') }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t('barra.fase') }}</th>
          <td>{{ simulador.painel.fase ? t(`fases.${simulador.painel.fase}`) : '—' }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t('barra.status') }}</th>
          <td>{{ t(`status.${simulador.painel.status}`) }}</td>
        </tr>
      </tbody>
    </table>
    <p aria-live="polite" aria-atomic="true">{{ anuncio }}</p>
  </div>
</template>

<!--
  O balão de um experimento "e se…?" (ADR 0007): pergunta, passos de ação,
  resultado e "por que isso importa". Sem escurecer a tela: o aluno precisa
  ver o painel e a memória mudarem.

  Copiado do MEM-8E Web (src/experimentos/BalaoExperimento.vue) em 2026-10-26 (ADR 0004).
  Modificado: o momento "por que isso importa" depois do resultado, e os
  passos conferidos a cada mudança do painel.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BalaoBase from '@/guia/BalaoBase.vue'
import '@/guia/balao.css'
import { useSimuladorStore } from '@/stores/simulador'
import { useExperimentos } from './experimentos'

const { t } = useI18n()
const simulador = useSimuladorStore()
const experimentos = useExperimentos()

// A cada mudança no painel, confere se o passo atual terminou.
watch(() => simulador.painel, experimentos.conferir, { deep: true })

const base = computed(() =>
  experimentos.atual.value ? `experimentos.itens.${experimentos.atual.value.id}` : '',
)
const total = computed(() => experimentos.atual.value?.passos.length ?? 0)

const texto = computed(() => {
  const m = experimentos.momento.value
  if (!m) return ''
  if (m.tipo === 'pergunta') return t(`${base.value}.pergunta`)
  if (m.tipo === 'resultado') return t(`${base.value}.resultado`)
  if (m.tipo === 'importancia') return t(`${base.value}.importancia`)
  return t(`${base.value}.passos.${m.passo.id}`)
})

const rotuloMomento = computed(() => {
  const m = experimentos.momento.value
  if (!m) return ''
  if (m.tipo === 'pergunta') return t('experimentos.pergunta')
  if (m.tipo === 'resultado') return t('experimentos.resultado')
  if (m.tipo === 'importancia') return t('experimentos.importancia')
  return t('experimentos.passo', { n: m.numero, total: total.value })
})
</script>

<template>
  <BalaoBase
    v-if="experimentos.atual.value && experimentos.momento.value"
    :alvo="experimentos.alvo.value"
    :chave="`${experimentos.atual.value.id}-${experimentos.posicao.value}`"
    :escurecer="false"
    rotulo="experimento-titulo"
    descricao="experimento-texto"
    @fechar="experimentos.sair()"
  >
    <template #default="{ irParaAlvo }">
      <p class="contador" data-momento>{{ rotuloMomento }}</p>
      <h2 id="experimento-titulo" tabindex="-1" data-foco>
        {{ t(`${base}.titulo`) }}
      </h2>
      <p
        id="experimento-texto"
        class="texto"
        :class="{ observacao: experimentos.momento.value.tipo === 'importancia' }"
        aria-live="polite"
      >
        {{ texto }}
      </p>
      <p v-if="experimentos.esperandoAcao.value" class="aguardando">
        {{ t('experimentos.aguardando') }}
      </p>
      <p v-if="experimentos.momento.value.tipo === 'acao' && experimentos.alvo.value" class="ir">
        <button type="button" class="ir-para" aria-keyshortcuts="F6" @click="irParaAlvo()">
          {{ t('guia.irPara') }}
        </button>
      </p>

      <div class="botoes">
        <button type="button" class="pular" @click="experimentos.sair()">
          {{ t('experimentos.sair') }}
        </button>
        <span class="espaco"></span>
        <template v-if="experimentos.momento.value.tipo === 'importancia'">
          <button type="button" @click="experimentos.repetir()">
            {{ t('experimentos.repetir') }}
          </button>
          <button type="button" class="principal" @click="experimentos.sair()">
            {{ t('experimentos.concluir') }}
          </button>
        </template>
        <button
          v-if="experimentos.momento.value.tipo === 'acao'"
          type="button"
          @click="experimentos.repetir()"
        >
          {{ t('experimentos.recomecar') }}
        </button>
        <button
          v-if="
            experimentos.momento.value.tipo !== 'importancia' && !experimentos.esperandoAcao.value
          "
          type="button"
          class="principal"
          @click="experimentos.proximo()"
        >
          {{
            experimentos.momento.value.tipo === 'pergunta'
              ? t('experimentos.vamosVer')
              : experimentos.momento.value.tipo === 'resultado'
                ? t('experimentos.porQue')
                : t('experimentos.proximo')
          }}
        </button>
      </div>
    </template>
  </BalaoBase>
</template>

<!--
  Tabela da memória de 256 bytes: endereço, conteúdo (editável) e símbolo
  (disassembly). A linha selecionada acompanha a execução.

  Derivado de CPU8E_Panel.pas (sgMemoria, ShowMem), CPU-8E v2.2.3
  Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (veja NOTICE.md)
  Modificado em 2026-10-13: tabela refeita em HTML.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AjudaContextual from '@/components/AjudaContextual.vue'
import { useSimuladorStore } from '@/stores/simulador'
import { traduzirDica } from '@/painel/dicas'

const simulador = useSimuladorStore()
const { t, locale } = useI18n()

const rolagem = ref<HTMLElement | null>(null)
const editando = ref<number | null>(null)
const textoEdicao = ref('')
const campo = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

/** Mantém a linha selecionada visível, mais ou menos no meio da tabela. */
async function mostrarFoco(endereco: number) {
  await nextTick()
  const conteiner = rolagem.value
  const linha = conteiner?.querySelector<HTMLElement>(`[data-endereco="${endereco}"]`)
  if (!conteiner || !linha) return
  const topo = linha.offsetTop - conteiner.clientHeight / 2 + linha.offsetHeight / 2
  conteiner.scrollTop = Math.max(0, topo)
}

watch(
  () => simulador.painel.foco,
  (endereco) => void mostrarFoco(endereco),
)

async function editar(endereco: number) {
  editando.value = endereco
  textoEdicao.value = simulador.memoria[endereco]?.valor ?? ''
  await nextTick()
  const elemento = Array.isArray(campo.value) ? campo.value[0] : campo.value
  elemento?.focus()
  elemento?.select()
}

/** Grava a célula; com Enter, segue para a linha de baixo (AutoAdvance do original). */
function confirmar(avancar: boolean) {
  const endereco = editando.value
  if (endereco === null) return
  simulador.editarMemoria(endereco, textoEdicao.value.trim())
  editando.value = null
  if (avancar && endereco < 255) void editar(endereco + 1)
}

function cancelar() {
  editando.value = null
}

/** Ao sair do campo, grava — a menos que a edição já tenha passado para outra linha. */
function aoSair(endereco: number) {
  if (editando.value === endereco) confirmar(false)
}
</script>

<template>
  <div class="tabela-memoria" :title="traduzirDica('Memória principal com 256 bytes', locale)">
    <div class="cabecalho-tabela">
      <span aria-hidden="true">{{ t('memoria.endereco') }}</span>
      <span aria-hidden="true">{{ t('memoria.conteudo') }}</span>
      <span class="com-ajuda">
        <span aria-hidden="true">{{ t('memoria.simbolo') }}</span>
        <AjudaContextual pagina="simulador" secao="memoria" :assunto="t('memoria.titulo')" />
      </span>
    </div>
    <div ref="rolagem" class="rolagem">
      <table>
        <caption class="visualmente-oculto">
          {{
            t('memoria.titulo')
          }}
        </caption>
        <thead class="visualmente-oculto">
          <tr>
            <th scope="col">{{ t('memoria.endereco') }}</th>
            <th scope="col">{{ t('memoria.conteudo') }}</th>
            <th scope="col">{{ t('memoria.simbolo') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(linha, endereco) in simulador.memoria"
            :key="linha.endereco"
            :data-endereco="endereco"
            :class="{ foco: endereco === simulador.painel.foco, alternada: endereco % 2 === 1 }"
          >
            <th scope="row">{{ linha.endereco }}</th>
            <td class="valor" @click="editar(endereco)">
              <input
                v-if="editando === endereco"
                ref="campo"
                v-model="textoEdicao"
                class="campo"
                maxlength="8"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                :aria-label="t('memoria.editar', { endereco: linha.endereco })"
                @keydown.enter.prevent="confirmar(true)"
                @keydown.escape.prevent="cancelar"
                @blur="aoSair(endereco)"
              />
              <button
                v-else
                type="button"
                class="botao-celula"
                :aria-label="t('memoria.editar', { endereco: linha.endereco })"
              >
                {{ linha.valor }}
              </button>
            </td>
            <td class="simbolo">{{ linha.simbolo }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.tabela-memoria {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--borda);
  background: var(--fundo-tabela);
  font-family: Arial, sans-serif;
  font-size: 13px;
  min-height: 0;
}
.cabecalho-tabela,
tr {
  display: grid;
  grid-template-columns: 57fr 57fr 67fr;
}
.cabecalho-tabela {
  font-weight: 700;
  text-align: center;
  background: var(--fundo-cabecalho);
  border-bottom: 1px solid var(--borda);
  padding: 2px 0;
}
.com-ajuda {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.rolagem {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: center;
  padding: 0;
  height: 20px;
  line-height: 20px;
  border-bottom: 1px solid var(--borda-suave);
}
th {
  font-weight: 700;
  background: var(--fundo-cabecalho);
}
.alternada td {
  background: var(--fundo-alternado);
}
.foco td,
.foco th {
  background: var(--selecao);
  color: var(--texto-selecao);
}
.botao-celula {
  all: unset;
  display: block;
  width: 100%;
  cursor: text;
}
.botao-celula:focus-visible {
  outline: 2px solid var(--destaque);
}
.campo {
  width: 100%;
  height: 20px;
  text-align: center;
  font: inherit;
  text-transform: uppercase;
  border: 1px solid var(--destaque);
  padding: 0;
}
.simbolo {
  font-family: 'Courier New', monospace;
  font-weight: 700;
}
</style>

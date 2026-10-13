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
import LinhaMemoria from '@/components/LinhaMemoria.vue'
import { useSimuladorStore } from '@/stores/simulador'
import { traduzirDica } from '@/painel/dicas'

const simulador = useSimuladorStore()
const { t, locale } = useI18n()

const rolagem = ref<HTMLElement | null>(null)
const editando = ref<number | null>(null)

/** Mantém a linha selecionada visível, mais ou menos no meio da tabela. */
async function mostrarFoco(endereco: number) {
  await nextTick()
  const conteiner = rolagem.value
  const linha = conteiner?.querySelector<HTMLElement>(`tbody tr:nth-child(${endereco + 1})`)
  if (!conteiner || !linha) return
  const topo = linha.offsetTop - conteiner.clientHeight / 2 + linha.offsetHeight / 2
  conteiner.scrollTop = Math.max(0, topo)
}

watch(
  () => simulador.painel.foco,
  (endereco) => void mostrarFoco(endereco),
)

/** Grava a célula; com Enter, segue para a linha de baixo (AutoAdvance do original). */
function confirmar(endereco: number, texto: string, avancar: boolean) {
  if (editando.value !== endereco) return
  simulador.editarMemoria(endereco, texto.trim())
  editando.value = avancar && endereco < 255 ? endereco + 1 : null
}

function cancelar(endereco: number) {
  if (editando.value === endereco) editando.value = null
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
          <LinhaMemoria
            v-for="(linha, endereco) in simulador.memoria"
            :key="endereco"
            :data-endereco="endereco"
            :endereco="linha.endereco"
            :valor="linha.valor"
            :simbolo="linha.simbolo"
            :foco="endereco === simulador.painel.foco"
            :alternada="endereco % 2 === 1"
            :editando="editando === endereco"
            @editar="editando = endereco"
            @confirmar="(texto, avancar) => confirmar(endereco, texto, avancar)"
            @cancelar="cancelar(endereco)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* As linhas são do componente LinhaMemoria: os estilos internos usam :deep(). */
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
.rolagem :deep(tr) {
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
.rolagem :deep(th),
.rolagem :deep(td) {
  text-align: center;
  padding: 0;
  height: 24px;
  line-height: 24px;
  border-bottom: 1px solid var(--borda-suave);
}
.rolagem :deep(th) {
  font-weight: 700;
  background: var(--fundo-cabecalho);
}
.rolagem :deep(.alternada td) {
  background: var(--fundo-alternado);
}
.rolagem :deep(.foco td),
.rolagem :deep(.foco th) {
  background: var(--selecao);
  color: var(--texto-selecao);
}
.rolagem :deep(.botao-celula) {
  all: unset;
  display: block;
  width: 100%;
  cursor: text;
}
.rolagem :deep(.botao-celula:focus-visible) {
  outline: 2px solid var(--destaque);
}
.rolagem :deep(.campo) {
  width: 100%;
  height: 24px;
  text-align: center;
  font: inherit;
  text-transform: uppercase;
  border: 1px solid var(--destaque);
  padding: 0;
}
.rolagem :deep(.simbolo) {
  font-family: 'Courier New', monospace;
  font-weight: 700;
}
</style>

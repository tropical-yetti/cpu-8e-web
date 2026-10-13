<!--
  Escolha do programa a carregar: um arquivo do dispositivo ou um dos
  programas que acompanham o simulador original (teste.bin e allopcodes.bin).

  No original esses arquivos ficavam na mesma pasta do executável; no
  navegador, eles são oferecidos aqui.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import urlAllopcodes from '@/assets/programas/allopcodes.bin?url'
import urlTeste from '@/assets/programas/teste.bin?url'

const emit = defineEmits<{ escolhido: [bytes: Uint8Array, nome: string] }>()
const { t } = useI18n()

const dialogo = ref<HTMLDialogElement | null>(null)
const seletor = ref<HTMLInputElement | null>(null)
const erro = ref<string | null>(null)

const PROGRAMAS_ORIGINAIS: Record<string, string> = {
  'teste.bin': urlTeste,
  'allopcodes.bin': urlAllopcodes,
}

function abrir() {
  erro.value = null
  dialogo.value?.showModal()
}

defineExpose({ abrir })

async function aoEscolherArquivo(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  const arquivo = entrada.files?.[0]
  entrada.value = ''
  if (!arquivo) return
  dialogo.value?.close()
  emit('escolhido', new Uint8Array(await arquivo.arrayBuffer()), arquivo.name)
}

async function carregarOriginal(nome: string) {
  try {
    const resposta = await fetch(PROGRAMAS_ORIGINAIS[nome]!)
    if (!resposta.ok) throw new Error(String(resposta.status))
    dialogo.value?.close()
    emit('escolhido', new Uint8Array(await resposta.arrayBuffer()), nome)
  } catch {
    erro.value = t('carregar.erro', { nome })
  }
}
</script>

<template>
  <dialog ref="dialogo" class="dialogo" :aria-label="t('carregar.titulo')">
    <h2>{{ t('carregar.titulo') }}</h2>
    <button type="button" class="opcao principal" @click="seletor?.click()">
      {{ t('carregar.dispositivo') }}
    </button>
    <input
      ref="seletor"
      type="file"
      accept=".bin,application/octet-stream"
      hidden
      @change="aoEscolherArquivo"
    />
    <p class="rotulo">{{ t('carregar.originais') }}</p>
    <button
      v-for="nome in Object.keys(PROGRAMAS_ORIGINAIS)"
      :key="nome"
      type="button"
      class="opcao"
      @click="carregarOriginal(nome)"
    >
      {{ nome }}
    </button>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <form method="dialog">
      <button type="submit" class="cancelar">{{ t('carregar.cancelar') }}</button>
    </form>
  </dialog>
</template>

<style scoped>
.dialogo {
  width: min(90vw, 360px);
  border: 1px solid var(--borda);
  border-radius: 8px;
  background: var(--fundo);
  color: var(--texto);
  padding: 20px;
  font-family: Arial, sans-serif;
}
.dialogo::backdrop {
  background: rgb(0 0 0 / 35%);
}
h2 {
  margin: 0 0 12px;
  font-size: 1.1rem;
}
.rotulo {
  margin: 16px 0 6px;
  color: var(--texto-suave);
  font-size: 0.9rem;
}
.opcao {
  display: block;
  width: 100%;
  margin-bottom: 6px;
  padding: 10px;
  text-align: left;
  font: inherit;
  border: 1px solid var(--borda);
  border-radius: 6px;
  background: var(--fundo-barra);
  color: inherit;
  cursor: pointer;
}
.opcao.principal {
  font-weight: 700;
}
.opcao:hover {
  border-color: var(--destaque);
}
form {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.cancelar {
  padding: 6px 12px;
  font: inherit;
  border: 1px solid var(--borda);
  border-radius: 4px;
  background: none;
  color: inherit;
  cursor: pointer;
}
.erro {
  color: #cf222e;
}
</style>

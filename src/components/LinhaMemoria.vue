<!--
  Uma linha da tabela de memória. Fica num componente próprio para que só as
  linhas que mudaram sejam redesenhadas durante a execução.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  endereco: string
  valor: string
  simbolo: string
  foco: boolean
  alternada: boolean
  editando: boolean
  /** O último valor digitado foi recusado (fora de 00–FF). */
  invalido?: boolean
}>()

const emit = defineEmits<{
  editar: []
  confirmar: [texto: string, avancar: boolean]
  cancelar: []
}>()

const { t } = useI18n()
const texto = ref('')
const campo = ref<HTMLInputElement | null>(null)

watch(
  () => props.editando,
  async (editando) => {
    if (!editando) return
    texto.value = props.valor
    await nextTick()
    campo.value?.focus()
    campo.value?.select()
  },
  { immediate: true },
)

/** Ao sair do campo, grava, a menos que a edição já tenha sido encerrada. */
function aoSair() {
  if (props.editando) emit('confirmar', texto.value, false)
}
</script>

<template>
  <tr :class="{ foco, alternada }">
    <th scope="row">{{ endereco }}</th>
    <td class="valor" @click="emit('editar')">
      <input
        v-if="editando"
        ref="campo"
        v-model="texto"
        class="campo"
        maxlength="2"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        :aria-label="t('memoria.editar', { endereco })"
        :aria-invalid="invalido ? 'true' : undefined"
        :aria-describedby="invalido ? 'aviso-memoria' : undefined"
        @keydown.enter.prevent="emit('confirmar', texto, true)"
        @keydown.escape.prevent="emit('cancelar')"
        @blur="aoSair"
      />
      <button
        v-else
        type="button"
        class="botao-celula"
        :aria-label="t('memoria.editarCelula', { valor, endereco })"
      >
        {{ valor }}
      </button>
    </td>
    <td class="simbolo">{{ simbolo }}</td>
  </tr>
</template>

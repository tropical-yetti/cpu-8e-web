<!--
  Caixa de mensagem modal (as ShowMessage do original). Enquanto está
  aberta, a CPU espera, como no original.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSimuladorStore } from '@/stores/simulador'

const simulador = useSimuladorStore()
const { t } = useI18n()
const dialogo = ref<HTMLDialogElement | null>(null)

const texto = computed(() => {
  const mensagem = simulador.painel.mensagem
  if (!mensagem) return ''
  if (mensagem.chave === 'lidos' || mensagem.chave === 'gravados') {
    const hex = mensagem.bytes.toString(16).toUpperCase().padStart(2, '0')
    return t(`mensagens.${mensagem.chave}`, { bytes: mensagem.bytes, hex })
  }
  return t(`mensagens.${mensagem.chave}`)
})

watch(
  () => simulador.painel.mensagem,
  async (mensagem) => {
    await nextTick()
    if (mensagem && !dialogo.value?.open) dialogo.value?.showModal()
    if (!mensagem && dialogo.value?.open) dialogo.value.close()
  },
  // Uma mensagem pode ter sido criada antes de a página abrir (ex.: exemplo da documentação).
  { immediate: true },
)
</script>

<template>
  <dialog ref="dialogo" class="caixa" @close="simulador.fecharMensagem()">
    <p>{{ texto }}</p>
    <form method="dialog">
      <button type="submit" autofocus>OK</button>
    </form>
  </dialog>
</template>

<style scoped>
.caixa {
  min-width: 260px;
  max-width: min(90vw, 420px);
  border: 1px solid var(--borda);
  border-radius: 8px;
  background: var(--fundo);
  color: var(--texto);
  padding: 20px;
  font-family: Arial, sans-serif;
}
.caixa::backdrop {
  background: rgb(0 0 0 / 35%);
}
.caixa form {
  display: flex;
  justify-content: flex-end;
}
.caixa button {
  min-width: 80px;
  padding: 6px 12px;
  font: inherit;
  font-weight: 700;
  border: 1px solid var(--borda);
  border-radius: 4px;
  background: var(--fundo-barra);
  color: inherit;
  cursor: pointer;
}
</style>

<!--
  Programa de exemplo da documentação, com um botão que o carrega no
  simulador.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { lerPrograma } from '@/docs/programas'
import { useSimuladorStore } from '@/stores/simulador'

const props = defineProps<{ codigo: string; nome: string }>()
const { t } = useI18n()
const router = useRouter()
const simulador = useSimuladorStore()

const programa = computed(() => lerPrograma(props.codigo))

async function abrirNoSimulador() {
  simulador.carregar(programa.value.bytes, `${props.nome}.bin`)
  await router.push('/')
}
</script>

<template>
  <figure class="programa">
    <pre tabindex="0"><code>{{ codigo }}</code></pre>
    <figcaption>
      <button type="button" @click="abrirNoSimulador">{{ t('docs.abrirNoSimulador') }}</button>
    </figcaption>
  </figure>
</template>

<style scoped>
.programa {
  margin: 16px 0;
  border: 1px solid var(--borda);
  border-radius: 6px;
  overflow: hidden;
}
pre {
  margin: 0;
  padding: 12px 16px;
  overflow-x: auto;
  background: var(--fundo-barra);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.45;
}
figcaption {
  display: flex;
  justify-content: flex-end;
  padding: 6px 8px;
  border-top: 1px solid var(--borda);
}
button {
  padding: 4px 10px;
  font: inherit;
  font-size: 0.85rem;
  border: 1px solid var(--borda);
  border-radius: 4px;
  background: var(--fundo);
  color: var(--destaque);
  cursor: pointer;
}
button:hover {
  border-color: var(--destaque);
}
button:focus-visible {
  outline: 2px solid var(--destaque);
}
</style>

<!--
  Página do simulador: barra de ferramentas, diagrama da CPU e memória.

  Atalhos de teclado (os mesmos do original): Ctrl+L carregar, Ctrl+S gravar,
  Ctrl+G executar, Ctrl+P pausar, Ctrl+R reset, F1 ajuda. O Ctrl+H (parar)
  saiu na v1.1, junto com o botão Parar.

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AjudaContextual from '@/components/AjudaContextual.vue'
import BarraFerramentas from '@/components/BarraFerramentas.vue'
import CaixaMensagem from '@/components/CaixaMensagem.vue'
import DiagramaCpu from '@/components/DiagramaCpu.vue'
import DialogoCarregar from '@/components/DialogoCarregar.vue'
import EstadoAcessivel from '@/components/EstadoAcessivel.vue'
import PainelCpu from '@/components/painel/PainelCpu.vue'
import TabelaMemoria from '@/components/TabelaMemoria.vue'
import { VISUAIS, useVisual } from '@/painel/visual'
import { useSimuladorStore } from '@/stores/simulador'

const simulador = useSimuladorStore()
const router = useRouter()
const { t } = useI18n()
const { visual, mudarVisual } = useVisual()
const dialogoCarregar = ref<InstanceType<typeof DialogoCarregar> | null>(null)

function carregar() {
  dialogoCarregar.value?.abrir()
}

function gravar() {
  const bytes = simulador.gravar()
  const nome = simulador.painel.nomePrograma ?? 'programa.bin'
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = nome.toLowerCase().endsWith('.bin') ? nome : `${nome}.bin`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function ajuda() {
  void router.push('/documentacao')
}

/** Atalhos do original. Só funcionam quando o botão correspondente está habilitado. */
function aoTeclar(evento: KeyboardEvent) {
  if (simulador.painel.mensagem) return
  if (evento.key === 'F1') {
    evento.preventDefault()
    ajuda()
    return
  }
  if (!evento.ctrlKey || evento.altKey || evento.shiftKey || evento.metaKey) return
  const { habilitados } = simulador.painel
  const acoes: Record<string, [boolean, () => unknown]> = {
    l: [true, carregar],
    s: [true, gravar],
    g: [habilitados.executar, simulador.executar],
    p: [habilitados.pausar, simulador.pausar],
    r: [habilitados.resetar, simulador.resetar],
  }
  const acao = acoes[evento.key.toLowerCase()]
  if (!acao) return
  evento.preventDefault()
  const [habilitado, executar] = acao
  if (habilitado) void executar()
}

// Visual clássico, no celular em pé: diagrama ampliado (com rolagem lateral) ou ajustado à tela.
const CHAVE_AJUSTE = 'cpu8e.ajustarDiagrama'
function lerAjuste(): boolean {
  try {
    return localStorage.getItem(CHAVE_AJUSTE) === '1'
  } catch {
    return false
  }
}
const ajustarATela = ref(lerAjuste())
watch(ajustarATela, (ajustar) => {
  try {
    localStorage.setItem(CHAVE_AJUSTE, ajustar ? '1' : '0')
  } catch {
    // Sem armazenamento, a escolha vale só para esta visita.
  }
})

onMounted(() => window.addEventListener('keydown', aoTeclar))
onBeforeUnmount(() => window.removeEventListener('keydown', aoTeclar))
</script>

<template>
  <section class="simulador" :aria-label="t('nav.simulador')">
    <h1 class="visualmente-oculto">{{ t('nav.simulador') }}</h1>
    <p v-if="simulador.painel.nomePrograma" class="programa">
      {{ t('simulador.programa') }} <strong>{{ simulador.painel.nomePrograma }}</strong>
    </p>
    <BarraFerramentas @carregar="carregar" @gravar="gravar" @ajuda="ajuda" />
    <div class="opcoes-painel">
      <div class="visuais" role="radiogroup" :aria-label="t('painel.visual')">
        <button
          v-for="opcao in VISUAIS"
          :key="opcao"
          type="button"
          role="radio"
          :aria-checked="visual === opcao"
          @click="mudarVisual(opcao)"
        >
          {{ t(`painel.visuais.${opcao}`) }}
        </button>
      </div>
    </div>
    <div class="area">
      <div
        class="painel-cpu"
        :class="{ ampliado: visual === 'classico' && !ajustarATela, novo: visual === 'novo' }"
      >
        <PainelCpu v-if="visual === 'novo'" />
        <DiagramaCpu v-else />
        <AjudaContextual class="ajuda-diagrama" pagina="cpu" :assunto="t('diagrama.descricao')" />
      </div>
      <TabelaMemoria class="memoria" />
    </div>
    <p class="dica-uso">{{ t('simulador.dicaUso') }}</p>
    <p v-if="visual === 'classico'" class="dica-uso dica-celular">
      {{ t('simulador.dicaCelular') }}
      <button
        type="button"
        class="botao-ajuste"
        :aria-pressed="ajustarATela"
        @click="ajustarATela = !ajustarATela"
      >
        {{ ajustarATela ? t('simulador.ampliar') : t('simulador.ajustar') }}
      </button>
    </p>
    <DialogoCarregar ref="dialogoCarregar" @escolhido="simulador.carregar" />
    <CaixaMensagem />
    <EstadoAcessivel />
  </section>
</template>

<style scoped>
.simulador {
  display: flex;
  flex-direction: column;
}
.programa {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: var(--texto-suave);
}
.opcoes-painel {
  display: flex;
  justify-content: flex-end;
  margin: 8px 0;
}
.visuais {
  display: inline-flex;
  border: 1px solid var(--borda);
  border-radius: 6px;
  overflow: hidden;
}
.visuais button {
  min-height: 32px;
  padding: 4px 12px;
  font: inherit;
  font-size: 0.85rem;
  color: var(--texto-suave);
  background: var(--fundo-tabela);
  border: 0;
  cursor: pointer;
}
.visuais button + button {
  border-left: 1px solid var(--borda);
}
.visuais button[aria-checked='true'] {
  color: var(--texto);
  font-weight: 600;
  background: var(--fundo-hover);
}
.area {
  display: grid;
  grid-template-columns: minmax(0, 688fr) minmax(190px, 200fr);
  border: 1px solid var(--borda);
}
.painel-cpu {
  position: relative;
  background: var(--fundo-painel);
  color: var(--texto);
  overflow-x: auto;
}
.ajuda-diagrama {
  position: absolute;
  top: 6px;
  right: 6px;
}
.memoria {
  border: none;
  border-left: 1px solid var(--borda);
  /* mesma altura do diagrama */
  max-height: 100%;
  height: 0;
  min-height: 100%;
}
.dica-uso {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: var(--texto-suave);
}
.dica-celular {
  display: none;
}
.botao-ajuste {
  margin-left: 4px;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
  border: 1px solid var(--borda);
  border-radius: 4px;
  background: var(--fundo-barra);
  color: var(--texto);
  cursor: pointer;
}
@media (max-width: 720px) {
  .area {
    grid-template-columns: 1fr;
  }
  /* No celular em pé, o diagrama fica legível com rolagem lateral. */
  .painel-cpu.ampliado :deep(.diagrama-conteiner) {
    min-width: 640px;
  }
  .memoria {
    border-left: none;
    border-top: 1px solid var(--borda);
    height: 280px;
    min-height: 0;
  }
  .dica-celular {
    display: block;
  }
}
</style>

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
import BarraFerramentas from '@/components/BarraFerramentas.vue'
import CaixaMensagem from '@/components/CaixaMensagem.vue'
import DiagramaCpu from '@/components/DiagramaCpu.vue'
import DialogoCarregar from '@/components/DialogoCarregar.vue'
import EstadoAcessivel from '@/components/EstadoAcessivel.vue'
import PainelCpu from '@/components/painel/PainelCpu.vue'
import MemoriaCpu from '@/components/memoria/MemoriaCpu.vue'
import BalaoExperimento from '@/experimentos/BalaoExperimento.vue'
import ListaExperimentos from '@/experimentos/ListaExperimentos.vue'
import { useExperimentos } from '@/experimentos/experimentos'
import BalaoGuia from '@/guia/BalaoGuia.vue'
import BotaoAjuda from '@/guia/BotaoAjuda.vue'
import { guiaJaVisto, useGuia } from '@/guia/guia'
import { VISUAIS, useVisual } from '@/painel/visual'
import { useVistaMemoria } from '@/painel/vistaMemoria'
import { useSimuladorStore } from '@/stores/simulador'

const simulador = useSimuladorStore()
const router = useRouter()
const { t } = useI18n()
const { visual, mudarVisual } = useVisual()
const { vista: vistaMemoria } = useVistaMemoria()
const guia = useGuia()
const experimentos = useExperimentos()

/** Rever o guia fecha o experimento em andamento, se houver. */
function reverGuia() {
  experimentos.sair()
  guia.iniciar()
}
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

onMounted(() => {
  window.addEventListener('keydown', aoTeclar)
  // No primeiro acesso, o guia abre sozinho.
  if (!guiaJaVisto()) guia.iniciar()
})
onBeforeUnmount(() => window.removeEventListener('keydown', aoTeclar))
</script>

<template>
  <section class="simulador" :aria-label="t('nav.simulador')">
    <h1 class="visualmente-oculto">{{ t('nav.simulador') }}</h1>
    <BarraFerramentas @carregar="carregar" @gravar="gravar" @ajuda="ajuda" />
    <!-- O nome do programa fica na mesma linha do seletor de visual, que existe
         sempre: carregar um arquivo não empurra o painel para baixo. -->
    <div class="opcoes-painel">
      <p
        class="programa"
        :title="simulador.painel.nomePrograma ?? undefined"
        :aria-hidden="simulador.painel.nomePrograma ? undefined : 'true'"
      >
        <template v-if="simulador.painel.nomePrograma">
          <span class="rotulo-programa">{{ `${t('simulador.programa')} ` }}</span
          ><strong>{{ simulador.painel.nomePrograma }}</strong>
        </template>
      </p>
      <div class="visuais" role="radiogroup" :aria-label="t('painel.visual')" data-guia="visual">
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
    <div class="area" :class="{ 'memoria-por-dentro': vistaMemoria === 'porDentro' }">
      <div
        class="painel-cpu"
        data-guia="painel"
        :class="{ ampliado: visual === 'classico' && !ajustarATela, novo: visual === 'novo' }"
      >
        <PainelCpu v-if="visual === 'novo'" />
        <DiagramaCpu v-else />
        <BotaoAjuda class="ajuda-diagrama" passo="painel" />
      </div>
      <MemoriaCpu class="memoria" />
    </div>
    <p class="dica-uso">
      <button type="button" class="botao-guia" data-guia="rever-guia" @click="reverGuia">
        {{ t('guia.rever') }}
      </button>
      <ListaExperimentos />
      {{ t('simulador.dicaUso') }}
    </p>
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
    <BalaoGuia />
    <BalaoExperimento />
    <EstadoAcessivel />
  </section>
</template>

<style scoped>
.simulador {
  display: flex;
  flex-direction: column;
}
.programa {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 0.9rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--texto-suave);
}
.opcoes-painel {
  display: flex;
  align-items: center;
  gap: 12px;
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
/* A memória por dentro tem a largura da grade; o painel fica com o resto. */
.area.memoria-por-dentro {
  grid-template-columns: minmax(0, 1fr) auto;
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
.memoria-por-dentro .memoria {
  height: auto;
  max-height: none;
  min-height: 0;
}
.dica-uso {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: var(--texto-suave);
}
.dica-celular {
  display: none;
}
.botao-guia {
  margin-right: 6px;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
  font-weight: 600;
  color: var(--texto);
  border: 1px solid var(--borda);
  border-radius: 4px;
  background: var(--fundo-barra);
  cursor: pointer;
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
/* Em telas estreitas, só o nome do arquivo: "Programa:" fica para leitores de tela. */
@media (max-width: 400px) {
  .rotulo-programa {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
}
@media (max-width: 720px) {
  .area {
    grid-template-columns: 1fr;
  }
  /* No celular em pé, o diagrama fica legível com rolagem lateral. */
  .painel-cpu.ampliado :deep(.diagrama-conteiner) {
    min-width: 640px;
  }
  .area.memoria-por-dentro {
    grid-template-columns: minmax(0, 1fr);
  }
  .memoria {
    border-left: none;
    border-top: 1px solid var(--borda);
    height: 320px;
    min-height: 0;
  }
  .memoria-por-dentro .memoria {
    height: auto;
  }
  .dica-celular {
    display: block;
  }
}
</style>

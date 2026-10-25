<!--
  Diagrama da CPU: registradores, ULA, barramentos e unidade de controle,
  desenhados a partir do formulário original (layout-original.json).

  O desenho é um SVG só de imagem. Os controles (registradores clicáveis e o
  seletor de clock) ficam numa camada HTML por cima, nas mesmas posições,
  para funcionarem com teclado e leitores de tela.

  Pressionar um registrador mostra o valor dele em binário, como no original.
  Em telas de toque, tocar numa parte do diagrama mostra a dica dela.

  Derivado de CPU8E_Panel.lfm/.pas (CPU-8E v2.2.3)
  Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
  Modificado em 2026-10-13: desenho refeito em SVG, com camada acessível.
  Modificado em 2026-10-25: partes do desenho ocultas para leitores de tela
  (o SVG é lido pela descrição).
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSimuladorStore } from '@/stores/simulador'
import { traduzirDica } from '@/painel/dicas'
import { rotuloNoIdioma } from '@/painel/rotulos'
import {
  FORMAS_DO_CLOCK,
  LAYOUT,
  itemDoTexto,
  type ElementoForma,
  type ElementoTexto,
} from '@/painel/layout'
import type { ItemPainel } from '@/core'

const simulador = useSimuladorStore()
const { t, locale } = useI18n()

const VERMELHO = '#FF0000'
const VALORES_CLOCK = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

const ALTURA = LAYOUT.altura - LAYOUT.topo
const viewBox = `0 ${LAYOUT.topo} ${LAYOUT.largura} ${ALTURA}`

/** Posição de um elemento do desenho em porcentagem da área do diagrama. */
function posicao(x: number, y: number, largura: number, altura: number) {
  return {
    left: `${(x / LAYOUT.largura) * 100}%`,
    top: `${((y - LAYOUT.topo) / ALTURA) * 100}%`,
    width: `${(largura / LAYOUT.largura) * 100}%`,
    height: `${(altura / ALTURA) * 100}%`,
  }
}

/** Pontos de um triângulo ou losango dentro da caixa do elemento. */
function pontos(f: ElementoForma): string {
  const { x, y, largura: w, altura: h } = f
  const lista: Record<string, number[]> = {
    trianguloBaixo: [x, y, x + w, y, x + w / 2, y + h],
    trianguloCima: [x + w / 2, y, x + w, y + h, x, y + h],
    trianguloEsquerda: [x + w, y, x + w, y + h, x, y + h / 2],
    trianguloDireita: [x, y, x + w, y + h / 2, x, y + h],
    losango: [x + w / 2, y, x + w, y + h / 2, x + w / 2, y + h, x, y + h / 2],
  }
  return (lista[f.forma] ?? []).join(' ')
}

const barramentosAtivos = computed(() => new Set<string>(simulador.painel.barramentos))
const realcados = computed(() => new Set<string>(simulador.painel.realcados))

function corDaForma(f: ElementoForma): string {
  if (barramentosAtivos.value.has(f.nome)) return VERMELHO
  if (FORMAS_DO_CLOCK.has(f.nome) && simulador.painel.clockPiscando) return VERMELHO
  // As setinhas pretas das flags ficariam invisíveis no tema escuro.
  if (f.cor === '#000000') return 'light-dark(#000000, #C9D1D9)'
  return f.cor
}

function textoDe(elemento: ElementoTexto): string {
  const item = itemDoTexto(elemento.nome)
  const texto = item ? simulador.painel.textos[item] : elemento.texto
  return rotuloNoIdioma(texto, locale.value)
}

/**
 * Rótulos escuros sem fundo (BI, BD, BE, RD, WR) ficam ilegíveis no tema
 * escuro; lá eles usam uma versão clara da mesma cor. No tema claro, as
 * cores são as do original.
 */
const VERSAO_CLARA: Record<string, string> = {
  '#0000FF': '#8CA0FF',
  '#008000': '#4CC24C',
  '#800000': '#FF7A7A',
}

function estiloDoTexto(elemento: ElementoTexto): Record<string, string> {
  const item = itemDoTexto(elemento.nome)
  if (item && realcados.value.has(item)) return { fill: VERMELHO }
  if (elemento.fundo !== null) return { fill: elemento.corTexto }
  // Texto preto sem fundo próprio acompanha o tema.
  if (elemento.corTexto === '#000000') return { fill: 'currentColor' }
  const clara = VERSAO_CLARA[elemento.corTexto]
  return { fill: clara ? `light-dark(${elemento.corTexto}, ${clara})` : elemento.corTexto }
}

function dica(texto: string | undefined): string | undefined {
  return traduzirDica(texto, locale.value)
}

// -------------------------------------------------------------------------
// Registradores pressionáveis (valor em binário)
// -------------------------------------------------------------------------

/** Registradores com valor em binário: um botão invisível sobre cada um. */
const REGISTRADORES = LAYOUT.textos.filter((elemento) => {
  const item = itemDoTexto(elemento.nome)
  return item !== undefined && simulador.valorBinario(item) !== null
})

const binario = ref<{ texto: string; dica?: string; elemento: ElementoTexto } | null>(null)

function mostrarBinario(elemento: ElementoTexto, comDica: boolean) {
  const valor = simulador.valorBinario(itemDoTexto(elemento.nome)!)
  if (valor) {
    const texto = rotuloNoIdioma(valor, locale.value)
    binario.value = { texto, dica: comDica ? dica(elemento.dica) : undefined, elemento }
  }
}

function esconderBinario() {
  binario.value = null
}

function alternarBinario(elemento: ElementoTexto) {
  if (binario.value?.elemento === elemento) esconderBinario()
  else mostrarBinario(elemento, false)
}

function rotuloDoRegistrador(elemento: ElementoTexto): string {
  const item = itemDoTexto(elemento.nome) as ItemPainel
  void simulador.painel.textos[item] // recalcula quando o valor muda
  const emBinario = simulador.valorBinario(item)?.split('=')[1] ?? ''
  return t('diagrama.registrador', {
    texto: rotuloNoIdioma(simulador.painel.textos[item], locale.value),
    binario: emBinario,
  })
}

function estiloDoBalao(elemento: ElementoTexto) {
  return posicao(elemento.x - 10, elemento.y - 22, 150, 22)
}

// -------------------------------------------------------------------------
// Dicas ao tocar (telas de toque não mostram o "title" do SVG)
// -------------------------------------------------------------------------

const dicaTocada = ref<{ texto: string; x: number; y: number } | null>(null)
let temporizadorDica: ReturnType<typeof setTimeout> | undefined

function aoTocarDesenho(evento: PointerEvent, texto: string | undefined, x: number, y: number) {
  if (evento.pointerType !== 'touch' || !texto) return
  dicaTocada.value = { texto: dica(texto)!, x, y }
  clearTimeout(temporizadorDica)
  temporizadorDica = setTimeout(() => (dicaTocada.value = null), 4000)
}

onBeforeUnmount(() => clearTimeout(temporizadorDica))

function aoMudarClock(evento: Event) {
  void simulador.mudarClock(Number((evento.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="diagrama-conteiner" @pointerup="esconderBinario" @pointerleave="esconderBinario">
    <svg class="diagrama" :viewBox="viewBox" role="img" :aria-label="t('diagrama.descricao')">
      <!-- Formas: blocos, setas e segmentos de barramento -->
      <!-- aria-hidden: o desenho é lido pela descrição do SVG, não pelas dicas de cada parte. -->
      <g
        v-for="forma in LAYOUT.formas"
        :key="forma.nome"
        aria-hidden="true"
        @pointerdown="aoTocarDesenho($event, forma.dica, forma.x, forma.y)"
      >
        <title v-if="forma.dica">{{ dica(forma.dica) }}</title>
        <rect
          v-if="forma.forma === 'retangulo' || forma.forma === 'retanguloArredondado'"
          :x="forma.x"
          :y="forma.y"
          :width="forma.largura"
          :height="forma.altura"
          :rx="forma.forma === 'retanguloArredondado' ? 6 : 0"
          :style="{ fill: corDaForma(forma) }"
          :stroke="forma.contorno ? '#000' : 'none'"
        />
        <ellipse
          v-else-if="forma.forma === 'elipse'"
          :cx="forma.x + forma.largura / 2"
          :cy="forma.y + forma.altura / 2"
          :rx="forma.largura / 2"
          :ry="forma.altura / 2"
          :style="{ fill: corDaForma(forma) }"
          :stroke="forma.contorno ? '#000' : 'none'"
        />
        <polygon
          v-else
          :points="pontos(forma)"
          :style="{ fill: corDaForma(forma) }"
          :stroke="forma.contorno ? '#000' : 'none'"
        />
      </g>

      <!-- Textos: registradores, flags e rótulos -->
      <g
        v-for="elemento in LAYOUT.textos"
        :key="elemento.nome"
        aria-hidden="true"
        @pointerdown="aoTocarDesenho($event, elemento.dica, elemento.x, elemento.y)"
      >
        <title v-if="elemento.dica">{{ dica(elemento.dica) }}</title>
        <rect
          v-if="elemento.fundo"
          :x="elemento.x"
          :y="elemento.y"
          :width="elemento.largura"
          :height="elemento.altura"
          :fill="elemento.fundo"
        />
        <text
          :x="elemento.centralizado ? elemento.x + elemento.largura / 2 : elemento.x + 2"
          :y="elemento.y + elemento.altura / 2 + elemento.tamanhoFonte * 0.36"
          :text-anchor="elemento.centralizado ? 'middle' : 'start'"
          :font-size="elemento.tamanhoFonte"
          :font-weight="elemento.negrito ? 900 : 400"
          :font-style="elemento.italico ? 'italic' : 'normal'"
          :fill="elemento.corTexto"
          :style="estiloDoTexto(elemento)"
          class="texto-painel"
        >
          {{ textoDe(elemento) }}
        </text>
      </g>
    </svg>

    <!-- Camada de controles, nas mesmas posições do desenho -->
    <button
      v-for="elemento in REGISTRADORES"
      :key="elemento.nome"
      type="button"
      class="registrador"
      :style="posicao(elemento.x, elemento.y, elemento.largura, elemento.altura)"
      :title="dica(elemento.dica)"
      :aria-label="rotuloDoRegistrador(elemento)"
      :aria-pressed="binario?.elemento === elemento"
      @pointerdown.prevent="mostrarBinario(elemento, $event.pointerType === 'touch')"
      @keydown.enter.prevent="alternarBinario(elemento)"
      @keydown.space.prevent="alternarBinario(elemento)"
      @blur="esconderBinario"
    />

    <select
      class="seletor-clock"
      :style="posicao(LAYOUT.clock.x, LAYOUT.clock.y, LAYOUT.clock.largura, LAYOUT.clock.altura)"
      :value="simulador.painel.clock"
      :title="dica('Velocidade do Clock')"
      :aria-label="t('diagrama.clock')"
      @change="aoMudarClock"
    >
      <option v-for="valor in VALORES_CLOCK" :key="valor" :value="valor">{{ valor }}</option>
    </select>

    <!-- Valor em binário do registrador pressionado (como o "Label1" do original) -->
    <div
      v-if="binario"
      class="balao-binario"
      :style="estiloDoBalao(binario.elemento)"
      aria-hidden="true"
    >
      <strong>{{ binario.texto }}</strong>
      <span v-if="binario.dica" class="dica-do-registrador">{{ binario.dica }}</span>
    </div>

    <!-- Dica de uma parte do diagrama, ao tocar -->
    <div
      v-if="dicaTocada"
      class="balao-dica"
      :style="posicao(dicaTocada.x, dicaTocada.y - 4, 0, 0)"
      role="status"
    >
      {{ dicaTocada.texto }}
    </div>
  </div>
</template>

<style scoped>
.diagrama-conteiner {
  position: relative;
  container-type: inline-size;
}
.diagrama {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  touch-action: manipulation;
}
.texto-painel {
  font-family: 'Arial Black', 'Arial', sans-serif;
}
/* Tamanhos proporcionais à largura do diagrama (688 unidades do desenho). */
.registrador {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}
.registrador:focus-visible {
  outline: 2px solid var(--destaque);
  outline-offset: 2px;
}
.seletor-clock {
  position: absolute;
  font:
    700 calc(14 / 688 * 100cqw) Arial,
    sans-serif;
  background: #c0c0c0;
  color: #000;
  border: 1px solid #808080;
  padding: 0 2px;
}
.seletor-clock:focus-visible {
  outline: 2px solid var(--destaque);
  outline-offset: 2px;
}
.balao-binario {
  position: absolute;
  height: auto !important;
  width: auto !important;
  min-width: calc(140 / 688 * 100cqw);
  max-width: calc(260 / 688 * 100cqw);
  padding: 0 calc(3 / 688 * 100cqw);
  background: #d4d0c8;
  color: #000080;
  font:
    700 calc(16 / 688 * 100cqw) / 1.35 Arial,
    sans-serif;
  pointer-events: none;
  z-index: 2;
}
.dica-do-registrador {
  display: block;
  font-weight: 400;
  font-size: calc(12 / 688 * 100cqw);
  color: #000;
  white-space: pre-line;
}
.balao-dica {
  position: absolute;
  transform: translateY(-100%);
  max-width: 60%;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--texto);
  color: var(--fundo);
  font:
    13px/1.35 system-ui,
    sans-serif;
  white-space: pre-line;
  pointer-events: none;
  z-index: 3;
}
</style>

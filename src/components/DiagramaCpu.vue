<!--
  Diagrama da CPU: registradores, ULA, barramentos e unidade de controle,
  desenhados a partir do formulário original (layout-original.json).

  Pressionar um registrador mostra o valor dele em binário, como no original.

  Derivado de CPU8E_Panel.lfm/.pas (CPU-8E v2.2.3)
  Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (veja NOTICE.md)
  Modificado em 2026-10-13: desenho refeito em SVG.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSimuladorStore } from '@/stores/simulador'
import { traduzirDica } from '@/painel/dicas'
import {
  FORMAS_DO_CLOCK,
  LAYOUT,
  itemDoTexto,
  type ElementoForma,
  type ElementoTexto,
} from '@/painel/layout'

const simulador = useSimuladorStore()
const { t, locale } = useI18n()

const VERMELHO = '#FF0000'
const VALORES_CLOCK = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

const viewBox = `0 ${LAYOUT.topo} ${LAYOUT.largura} ${LAYOUT.altura - LAYOUT.topo}`

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
  return f.cor
}

function textoDe(elemento: ElementoTexto): string {
  const item = itemDoTexto(elemento.nome)
  return item ? simulador.painel.textos[item] : elemento.texto
}

function corDoTexto(elemento: ElementoTexto): string {
  const item = itemDoTexto(elemento.nome)
  if (item && realcados.value.has(item)) return VERMELHO
  // Texto preto sem fundo próprio acompanha o tema (fica claro no modo escuro).
  if (elemento.fundo === null && elemento.corTexto === '#000000') return 'currentColor'
  return elemento.corTexto
}

function dica(texto: string | undefined): string | undefined {
  return traduzirDica(texto, locale.value)
}

// Valor em binário enquanto o registrador estiver pressionado.
const binario = ref<{ texto: string; x: number; y: number } | null>(null)

function pressionar(elemento: ElementoTexto) {
  const item = itemDoTexto(elemento.nome)
  const texto = item ? simulador.valorBinario(item) : null
  if (texto) binario.value = { texto, x: elemento.x - 10, y: elemento.y - 20 }
}

function soltar() {
  binario.value = null
}

function aoMudarClock(evento: Event) {
  void simulador.mudarClock(Number((evento.target as HTMLSelectElement).value))
}
</script>

<template>
  <svg
    class="diagrama"
    :viewBox="viewBox"
    role="img"
    :aria-label="t('diagrama.descricao')"
    @pointerup="soltar"
    @pointerleave="soltar"
  >
    <!-- Formas: blocos, setas e segmentos de barramento -->
    <g v-for="forma in LAYOUT.formas" :key="forma.nome">
      <title v-if="forma.dica">{{ dica(forma.dica) }}</title>
      <rect
        v-if="forma.forma === 'retangulo' || forma.forma === 'retanguloArredondado'"
        :x="forma.x"
        :y="forma.y"
        :width="forma.largura"
        :height="forma.altura"
        :rx="forma.forma === 'retanguloArredondado' ? 6 : 0"
        :fill="corDaForma(forma)"
        :stroke="forma.contorno ? '#000' : 'none'"
      />
      <ellipse
        v-else-if="forma.forma === 'elipse'"
        :cx="forma.x + forma.largura / 2"
        :cy="forma.y + forma.altura / 2"
        :rx="forma.largura / 2"
        :ry="forma.altura / 2"
        :fill="corDaForma(forma)"
        :stroke="forma.contorno ? '#000' : 'none'"
      />
      <polygon
        v-else
        :points="pontos(forma)"
        :fill="corDaForma(forma)"
        :stroke="forma.contorno ? '#000' : 'none'"
      />
    </g>

    <!-- Textos: registradores, flags e rótulos -->
    <g
      v-for="elemento in LAYOUT.textos"
      :key="elemento.nome"
      :class="{ pressionavel: itemDoTexto(elemento.nome) }"
      @pointerdown.prevent="pressionar(elemento)"
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
        :fill="corDoTexto(elemento)"
        class="texto-painel"
      >
        {{ textoDe(elemento) }}
      </text>
    </g>

    <!-- Seletor de velocidade do clock -->
    <foreignObject
      :x="LAYOUT.clock.x"
      :y="LAYOUT.clock.y"
      :width="LAYOUT.clock.largura"
      :height="LAYOUT.clock.altura"
    >
      <select
        class="seletor-clock"
        :value="simulador.painel.clock"
        :title="dica('Velocidade do Clock')"
        :aria-label="t('diagrama.clock')"
        @change="aoMudarClock"
      >
        <option v-for="valor in VALORES_CLOCK" :key="valor" :value="valor">{{ valor }}</option>
      </select>
    </foreignObject>

    <!-- Valor em binário do registrador pressionado -->
    <g v-if="binario" class="binario" aria-live="polite">
      <rect :x="binario.x - 2" :y="binario.y - 2" width="140" height="22" fill="#D4D0C8" />
      <text :x="binario.x + 2" :y="binario.y + 15" font-size="16" font-weight="700" fill="#000080">
        {{ binario.texto }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.diagrama {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  touch-action: manipulation;
}
.texto-painel {
  font-family: 'Arial Black', 'Arial', sans-serif;
  pointer-events: none;
}
.binario text {
  font-family: Arial, sans-serif;
}
.pressionavel {
  cursor: pointer;
}
.seletor-clock {
  width: 100%;
  height: 100%;
  font:
    700 14px Arial,
    sans-serif;
  background: #c0c0c0;
  color: #000;
  border: 1px solid #808080;
}
</style>

/**
 * Layout do painel da CPU, extraído do formulário original
 * (veja tools/layout/extrair-layout.ts), com os tipos e as ligações entre
 * os elementos do desenho e os itens do núcleo.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ItemPainel, SegmentoBarramento } from '@/core'
import dados from './layout-original.json'

export type Forma =
  | 'retangulo'
  | 'trianguloBaixo'
  | 'trianguloCima'
  | 'trianguloEsquerda'
  | 'trianguloDireita'
  | 'elipse'
  | 'retanguloArredondado'
  | 'losango'

export interface ElementoForma {
  nome: string
  x: number
  y: number
  largura: number
  altura: number
  cor: string
  contorno: boolean
  forma: Forma
  dica?: string
}

export interface ElementoTexto {
  nome: string
  x: number
  y: number
  largura: number
  altura: number
  texto: string
  /** null = sem fundo (usa o fundo da página). */
  fundo: string | null
  corTexto: string
  tamanhoFonte: number
  negrito: boolean
  italico: boolean
  centralizado: boolean
  dica?: string
}

export interface Layout {
  largura: number
  altura: number
  topo: number
  formas: ElementoForma[]
  textos: ElementoTexto[]
  clock: { x: number; y: number; largura: number; altura: number }
}

export const LAYOUT = dados as Layout

/**
 * Texto do painel → item do núcleo. As flags aparecem duas vezes no
 * desenho (perto da ULA e na entrada da UC); as duas mostram o mesmo item.
 */
const ITEM_POR_TEXTO: Record<string, ItemPainel> = {
  stACC: 'ACC',
  stPC: 'PC',
  stMAR: 'MAR',
  stMDR: 'MDR',
  stIR: 'IR',
  stSP: 'SP',
  stA: 'A',
  stB: 'B',
  stULA: 'ULA',
  stDI: 'DI',
  stZ: 'Z',
  sxZ: 'Z',
  stN: 'N',
  sxN: 'N',
  stC: 'C',
  sxC: 'C',
}

export function itemDoTexto(nome: string): ItemPainel | undefined {
  return ITEM_POR_TEXTO[nome]
}

/** Formas que acendem quando o clock muda de velocidade. */
export const FORMAS_DO_CLOCK = new Set(['shClock1', 'shClock2'])

/** Indica se uma forma é um segmento de barramento que pode acender. */
export function ehSegmento(nome: string, ativos: readonly SegmentoBarramento[]): boolean {
  return (ativos as readonly string[]).includes(nome)
}

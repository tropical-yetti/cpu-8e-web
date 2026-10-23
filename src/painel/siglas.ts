/**
 * Siglas do painel novo (ADR 0005). Os textos ficam nas mensagens
 * (siglas.<chave>.sigla e siglas.<chave>.nome), e a mesma lista alimenta as
 * legendas do painel e a página "Siglas" da documentação.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ItemPainel } from '@/core'

/** Ordem da página "Siglas": registradores, ULA e flags, controle, barramentos. */
export const SIGLAS = [
  'pc',
  'sp',
  'mar',
  'mdr',
  'ir',
  'acc',
  'a',
  'b',
  'ula',
  'z',
  'n',
  'c',
  'uc',
  'di',
  'clk',
  'bi',
  'be',
  'bd',
  'rd',
  'wr',
] as const

export type Sigla = (typeof SIGLAS)[number]

/** Sigla de cada item do núcleo que aparece no painel. */
export const SIGLA_DO_ITEM: Record<ItemPainel, Sigla> = {
  PC: 'pc',
  SP: 'sp',
  MAR: 'mar',
  MDR: 'mdr',
  IR: 'ir',
  ACC: 'acc',
  A: 'a',
  B: 'b',
  ULA: 'ula',
  Z: 'z',
  N: 'n',
  C: 'c',
  DI: 'di',
}

/**
 * Formatação de valores como o painel do original os mostra.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Byte, ItemPainel } from './tipos'

/** Byte em hexadecimal com 2 dígitos maiúsculos: 10 → "0A". */
export function hex2(valor: Byte): string {
  return valor.toString(16).toUpperCase().padStart(2, '0')
}

/** Itens que mostram um único dígito (as flags). */
const ITENS_DE_UM_DIGITO: ReadonlySet<ItemPainel> = new Set(['Z', 'N', 'C'])

/** Texto mostrado por um item do painel (LenReg + IntToHex no original). */
export function textoDoItem(item: ItemPainel, valor: Byte): string {
  return ITENS_DE_UM_DIGITO.has(item) ? valor.toString(16).toUpperCase() : hex2(valor)
}

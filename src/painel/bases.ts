/**
 * Bases de exibição dos registradores no painel novo: hexadecimal (padrão,
 * com o prefixo 0x), decimal e binário (com o prefixo 0b). Tocar num
 * registrador passa para a próxima base.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type Base = 'hex' | 'dec' | 'bin'

export const BASES: readonly Base[] = ['hex', 'dec', 'bin']

/** A base seguinte, na ordem hexadecimal → decimal → binário → hexadecimal. */
export function proximaBase(base: Base): Base {
  return BASES[(BASES.indexOf(base) + 1) % BASES.length]!
}

/** Um byte (0 a 255) escrito na base pedida: "0x05", "5" ou "0b00000101". */
export function formatar(valor: number, base: Base): string {
  switch (base) {
    case 'hex':
      return `0x${valor.toString(16).toUpperCase().padStart(2, '0')}`
    case 'dec':
      return String(valor)
    case 'bin':
      return `0b${valor.toString(2).padStart(8, '0')}`
  }
}

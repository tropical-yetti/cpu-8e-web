/**
 * Bases de exibição dos registradores no painel novo.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { BASES, formatar, proximaBase } from '../../src/painel/bases'

describe('bases de exibição', () => {
  it('hexadecimal com 0x e dois dígitos maiúsculos', () => {
    expect(formatar(0x05, 'hex')).toBe('0x05')
    expect(formatar(0xfe, 'hex')).toBe('0xFE')
    expect(formatar(0, 'hex')).toBe('0x00')
  })

  it('decimal sem prefixo nem zeros à esquerda', () => {
    expect(formatar(0x05, 'dec')).toBe('5')
    expect(formatar(0xff, 'dec')).toBe('255')
    expect(formatar(0, 'dec')).toBe('0')
  })

  it('binário com 0b e oito dígitos', () => {
    expect(formatar(0x05, 'bin')).toBe('0b00000101')
    expect(formatar(0xff, 'bin')).toBe('0b11111111')
  })

  it('cada toque passa para a próxima base e volta ao hexadecimal', () => {
    expect(proximaBase('hex')).toBe('dec')
    expect(proximaBase('dec')).toBe('bin')
    expect(proximaBase('bin')).toBe('hex')
    expect(BASES[0]).toBe('hex')
  })
})

/**
 * Siglas do painel no idioma da interface.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { rotuloNoIdioma, siglaNoIdioma } from '../../src/painel/rotulos'

describe('rótulos do painel', () => {
  it('em português, ficam exatamente como no original', () => {
    for (const texto of ['ULA:05', 'UC', 'BI', 'BD', 'BE', 'DI:LOD 05', 'ID:NOP', 'ACC=00000101']) {
      expect(rotuloNoIdioma(texto, 'pt-BR')).toBe(texto)
    }
  })

  it('em inglês, as siglas portuguesas viram as inglesas', () => {
    expect(rotuloNoIdioma('ULA:05', 'en')).toBe('ALU:05')
    expect(rotuloNoIdioma('ULA=00000101', 'en')).toBe('ALU=00000101')
    expect(rotuloNoIdioma('DI:JMP[0E]', 'en')).toBe('ID:JMP[0E]')
    expect(rotuloNoIdioma('UC', 'en')).toBe('CU')
    expect(['BI', 'BD', 'BE'].map((s) => siglaNoIdioma(s, 'en'))).toEqual(['IB', 'DB', 'AB'])
  })

  it('siglas que já são inglesas e valores não mudam', () => {
    for (const texto of ['ACC:05', 'PC:0E', 'MAR:16', 'RD', 'WR', 'Clock', 'ID:NOP', 'Z:1']) {
      expect(rotuloNoIdioma(texto, 'en')).toBe(texto)
    }
    // Um valor que por acaso contém uma sigla não é traduzido.
    expect(rotuloNoIdioma('DI:STO[BE]', 'en')).toBe('ID:STO[BE]')
  })
})

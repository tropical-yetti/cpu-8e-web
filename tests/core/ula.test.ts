/**
 * Testes da ULA.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { calcularIntermediario, operarUla, type OperacaoUla } from '../../src/core'

/**
 * Ordem das operações na tabela gravada em tests/fixtures/ula-original.bin.gz,
 * gerada na série 1.x pelo código Pascal original (tag v1.1.0). A tabela
 * continua como teste de regressão (ADR 0003).
 */
const OPERACOES: OperacaoUla[] = [
  'NOT',
  'LOD',
  'CMP',
  'ADD',
  'SUB',
  'AND',
  'XOR',
  'ORL',
  'SHL',
  'SHR',
  'SRA',
  'ROL',
  'ROR',
]

describe('ULA', () => {
  it('reproduz o original em todas as combinações de operação, A e B', () => {
    const arquivo = new URL('../fixtures/ula-original.bin.gz', import.meta.url)
    const tabela = gunzipSync(readFileSync(arquivo))
    let diferencas = 0
    OPERACOES.forEach((operacao, o) => {
      for (let a = 0; a < 256; a++) {
        for (let b = 0; b < 256; b++) {
          const esperado = tabela.readUInt16LE((o * 65536 + a * 256 + b) * 2)
          if (calcularIntermediario(operacao, a, b) !== esperado) diferencas++
        }
      }
    })
    expect(diferencas).toBe(0)
  })

  // Exemplos legíveis, úteis como documentação do comportamento.
  it.each([
    // operação, A, B, valor, Z, N, C
    ['ADD', 0x05, 0xfc, 0x01, false, false, true], // 5 + 252 = 257: passa de 8 bits, C = 1
    ['ADD', 0x00, 0x00, 0x00, true, false, false],
    ['SUB', 0x07, 0x05, 0x02, false, false, true], // sem empréstimo: C = 1
    ['SUB', 0x05, 0x07, 0xfe, false, true, false], // com empréstimo: C = 0 e N = 1
    ['CMP', 0x05, 0x05, 0x00, true, false, true], // iguais: Z = 1
    ['NOT', 0x0f, 0x00, 0xf0, false, true, false], // NOT nunca liga o carry
    ['SHL', 0x81, 0x00, 0x02, false, false, true], // bit 7 sai para o carry
    ['SHR', 0x81, 0x00, 0x40, false, false, true], // bit 0 sai para o carry
    ['SRA', 0x81, 0x00, 0xc0, false, true, true], // mantém o bit de sinal
    ['ROL', 0x81, 0x00, 0x03, false, false, true], // bit 7 volta no bit 0
    ['ROR', 0x01, 0x00, 0x80, false, true, true], // bit 0 volta no bit 7
  ] as const)('%s com A=%i e B=%i', (operacao, a, b, valor, z, n, c) => {
    expect(operarUla(operacao, a, b)).toEqual({ valor, z, n, c })
  })
})

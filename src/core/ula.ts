/**
 * ULA — Unidade Lógica e Aritmética da CPU-8E.
 *
 * A ULA recebe os registradores A e B e produz um resultado de 8 bits e três
 * flags. Como no original, o cálculo é feito num valor intermediário de
 * 16 bits (`R`, do tipo `word` no Pascal); as flags saem dele:
 *
 *   Z = resultado (8 bits) igual a zero
 *   N = bit 7 de R (sinal)
 *   C = bit 8 de R ("vai-um")
 *
 * Observação para quem estuda: em SUB e CMP a subtração é feita somando o
 * complemento de 2 de B. Por isso C = 1 quando NÃO há empréstimo (A ≥ B) e
 * C = 0 quando A < B — a mesma convenção de processadores como o ARM.
 *
 * Derivado de CPU8E_Control.pas (ProcessULA), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript como função pura.
 * Modificado em 2026-10-17: subtração escrita de forma explícita (v1.1).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Byte, Mnemonico } from './tipos'

export interface ResultadoUla {
  valor: Byte
  z: boolean
  n: boolean
  c: boolean
}

/** Operações que passam pela ULA. */
export type OperacaoUla = Extract<
  Mnemonico,
  | 'NOT'
  | 'LOD'
  | 'CMP'
  | 'ADD'
  | 'SUB'
  | 'AND'
  | 'XOR'
  | 'ORL'
  | 'SHL'
  | 'SHR'
  | 'SRA'
  | 'ROL'
  | 'ROR'
>

const BIT_0 = 0x01
const BIT_7 = 0x80
const BIT_8 = 0x100

/** Inverte os 8 bits de um byte (o `not` do Pascal sobre um `byte`). */
const inverter = (x: Byte): number => ~x & 0xff

/** Mantém 16 bits, como uma variável `word` do Pascal. */
const word = (x: number): number => x & 0xffff

/**
 * Calcula o valor intermediário de 16 bits. Cada caso segue a expressão
 * correspondente do original (validado contra todas as 851.968 combinações
 * pela tabela gerada a partir do código Pascal original, em
 * tests/fixtures/ula-original.bin.gz).
 */
export function calcularIntermediario(operacao: OperacaoUla, a: Byte, b: Byte): number {
  switch (operacao) {
    case 'NOT':
      return inverter(a)
    case 'LOD':
      return a
    case 'CMP':
    case 'SUB':
      // A − B. O original soma A ao complemento de 2 de B num `word`:
      // (not B) + 1 + A. Escrito de forma explícita, dá o mesmo resultado:
      // os 8 bits de baixo são A − B, e o bit 8 (carry) é 1 quando não há
      // empréstimo, isto é, quando A ≥ B (inclusive com B = 0).
      // CORRIGIDO NA v1.1 (item 2): só a forma de escrever mudou; a tabela
      // completa da ULA confere que o resultado é o mesmo do original.
      return ((a - b) & 0xff) | (a >= b ? BIT_8 : 0)
    case 'ADD':
      return word(a + b)
    case 'AND':
      return a & b
    case 'XOR':
      return a ^ b
    case 'ORL':
      return a | b
    case 'SHL':
      // o bit 7 que "sai" vira o bit 8 (carry)
      return word(a << 1)
    case 'SHR':
      // o bit 0 que "sai" vira o carry
      return (a >> 1) | (a & BIT_0 ? BIT_8 : 0)
    case 'SRA':
      // repete o bit de sinal (bit 7) ao deslocar
      return (a >> 1) | (a & BIT_7) | (a & BIT_0 ? BIT_8 : 0)
    case 'ROL':
      // o bit 7 volta no bit 0 e também vai para o carry
      return word(a << 1) | (a & BIT_7 ? BIT_8 | BIT_0 : 0)
    case 'ROR':
      // o bit 0 volta no bit 7 e também vai para o carry
      return (a >> 1) | (a & BIT_0 ? BIT_8 | BIT_7 : 0)
  }
}

/** Executa uma operação da ULA e devolve o resultado com as flags. */
export function operarUla(operacao: OperacaoUla, a: Byte, b: Byte): ResultadoUla {
  const r = calcularIntermediario(operacao, a, b)
  const valor = r & 0xff
  return {
    valor,
    z: valor === 0,
    n: (r & BIT_7) !== 0,
    c: (r & BIT_8) !== 0,
  }
}

/**
 * Tabela de instruções da CPU-8E — fonte única para o decodificador, o
 * disassembler e a documentação.
 *
 * Formato do código de instrução (1 byte):
 *
 *     bit 7      bit 6         bits 4..0
 *     DW         ED            identidade da instrução
 *     2 bytes?   end. direto?
 *
 * - DW = 1: a instrução tem um segundo byte (o operando).
 * - ED = 1: endereçamento direto — o operando é um ENDEREÇO de memória.
 *   ED = 0 com DW = 1: endereçamento imediato — o operando é o próprio VALOR.
 *
 * Derivado de CPU8E.pas e CPU8E_Control.pas (DecodeOpCode), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: tabela reorganizada com descrições em pt e en.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Byte, Mnemonico } from './tipos'

export type ModoEnderecamento = 'implicito' | 'imediato' | 'direto'

export interface Texto {
  pt: string
  en: string
}

export interface DefinicaoInstrucao {
  mnemonico: Exclude<Mnemonico, 'XXX'>
  /** Código de cada modo de endereçamento aceito pela instrução. */
  codigos: Partial<Record<ModoEnderecamento, Byte>>
  /** Efeito em notação de transferência entre registradores. */
  efeito: Texto
  descricao: Texto
  /** Se altera as flags Z, N e C. */
  alteraFlags: boolean
}

/**
 * "op" = o operando: o valor imediato ou o conteúdo da memória no endereço dado.
 * "end" (en: "addr") = o endereço escrito na instrução.
 */
export const INSTRUCOES: readonly DefinicaoInstrucao[] = [
  {
    mnemonico: 'HLT',
    codigos: { implicito: 0x00 },
    efeito: { pt: '—', en: '—' },
    alteraFlags: false,
    descricao: { pt: 'Para a CPU.', en: 'Halts the CPU.' },
  },
  {
    mnemonico: 'NOP',
    codigos: { implicito: 0x01 },
    efeito: { pt: '—', en: '—' },
    alteraFlags: false,
    descricao: { pt: 'Não faz nada.', en: 'Does nothing.' },
  },
  {
    mnemonico: 'NOT',
    codigos: { implicito: 0x02 },
    efeito: { pt: 'ACC ← NOT ACC', en: 'ACC ← NOT ACC' },
    alteraFlags: true,
    descricao: { pt: 'Inverte todos os bits do ACC.', en: 'Inverts every bit of ACC.' },
  },
  {
    mnemonico: 'RET',
    codigos: { implicito: 0x03 },
    efeito: { pt: 'SP ← SP + 1; PC ← M[SP]', en: 'SP ← SP + 1; PC ← M[SP]' },
    alteraFlags: false,
    descricao: { pt: 'Retorna de uma sub-rotina.', en: 'Returns from a subroutine.' },
  },
  {
    mnemonico: 'JMP',
    codigos: { direto: 0xc4 },
    efeito: { pt: 'PC ← end', en: 'PC ← addr' },
    alteraFlags: false,
    descricao: { pt: 'Desvia sempre para o endereço.', en: 'Always jumps to the address.' },
  },
  {
    mnemonico: 'JEQ',
    codigos: { direto: 0xc5 },
    efeito: { pt: 'se Z = 1: PC ← end', en: 'if Z = 1: PC ← addr' },
    alteraFlags: false,
    descricao: {
      pt: 'Desvia se o último resultado foi zero.',
      en: 'Jumps if the last result was zero.',
    },
  },
  {
    mnemonico: 'JGT',
    codigos: { direto: 0xc6 },
    efeito: { pt: 'se Z = 0 e N = 0: PC ← end', en: 'if Z = 0 and N = 0: PC ← addr' },
    alteraFlags: false,
    descricao: {
      pt: 'Desvia se o último resultado foi maior que zero.',
      en: 'Jumps if the last result was greater than zero.',
    },
  },
  {
    mnemonico: 'JGE',
    codigos: { direto: 0xc7 },
    efeito: { pt: 'se N = 0: PC ← end', en: 'if N = 0: PC ← addr' },
    alteraFlags: false,
    descricao: {
      pt: 'Desvia se o último resultado foi maior ou igual a zero.',
      en: 'Jumps if the last result was greater than or equal to zero.',
    },
  },
  {
    mnemonico: 'JCY',
    codigos: { direto: 0xc8 },
    efeito: { pt: 'se C = 1: PC ← end', en: 'if C = 1: PC ← addr' },
    alteraFlags: false,
    descricao: { pt: 'Desvia se houve "vai-um" (carry).', en: 'Jumps if there was a carry.' },
  },
  {
    mnemonico: 'CAL',
    codigos: { direto: 0xc9 },
    efeito: { pt: 'M[SP] ← PC; SP ← SP − 1; PC ← end', en: 'M[SP] ← PC; SP ← SP − 1; PC ← addr' },
    alteraFlags: false,
    descricao: {
      pt: 'Chama uma sub-rotina, guardando o endereço de retorno na pilha.',
      en: 'Calls a subroutine, saving the return address on the stack.',
    },
  },
  {
    mnemonico: 'SHL',
    codigos: { imediato: 0x8a, direto: 0xca },
    efeito: {
      pt: 'ACC ← ACC deslocado op vezes à esquerda',
      en: 'ACC ← ACC shifted left op times',
    },
    alteraFlags: true,
    descricao: {
      pt: 'Desloca o ACC para a esquerda; entra 0 à direita.',
      en: 'Shifts ACC left; a 0 enters on the right.',
    },
  },
  {
    mnemonico: 'SHR',
    codigos: { imediato: 0x8b, direto: 0xcb },
    efeito: {
      pt: 'ACC ← ACC deslocado op vezes à direita',
      en: 'ACC ← ACC shifted right op times',
    },
    alteraFlags: true,
    descricao: {
      pt: 'Desloca o ACC para a direita; entra 0 à esquerda.',
      en: 'Shifts ACC right; a 0 enters on the left.',
    },
  },
  {
    mnemonico: 'SRA',
    codigos: { imediato: 0x8c, direto: 0xcc },
    efeito: {
      pt: 'ACC ← ACC deslocado op vezes à direita (aritmético)',
      en: 'ACC ← ACC shifted right op times (arithmetic)',
    },
    alteraFlags: true,
    descricao: {
      pt: 'Desloca o ACC para a direita mantendo o bit de sinal.',
      en: 'Shifts ACC right keeping the sign bit.',
    },
  },
  {
    mnemonico: 'ROL',
    codigos: { imediato: 0x8d, direto: 0xcd },
    efeito: { pt: 'ACC ← ACC girado op vezes à esquerda', en: 'ACC ← ACC rotated left op times' },
    alteraFlags: true,
    descricao: {
      pt: 'Gira o ACC para a esquerda; o bit 7 volta no bit 0.',
      en: 'Rotates ACC left; bit 7 comes back as bit 0.',
    },
  },
  {
    mnemonico: 'ROR',
    codigos: { imediato: 0x8e, direto: 0xce },
    efeito: { pt: 'ACC ← ACC girado op vezes à direita', en: 'ACC ← ACC rotated right op times' },
    alteraFlags: true,
    descricao: {
      pt: 'Gira o ACC para a direita; o bit 0 volta no bit 7.',
      en: 'Rotates ACC right; bit 0 comes back as bit 7.',
    },
  },
  {
    mnemonico: 'STO',
    codigos: { direto: 0xd0 },
    efeito: { pt: 'M[end] ← ACC', en: 'M[addr] ← ACC' },
    alteraFlags: false,
    descricao: { pt: 'Guarda o ACC na memória.', en: 'Stores ACC in memory.' },
  },
  {
    mnemonico: 'LOD',
    codigos: { imediato: 0x91, direto: 0xd1 },
    efeito: { pt: 'ACC ← op', en: 'ACC ← op' },
    alteraFlags: true,
    descricao: { pt: 'Carrega um valor no ACC.', en: 'Loads a value into ACC.' },
  },
  {
    mnemonico: 'CMP',
    codigos: { imediato: 0x94, direto: 0xd4 },
    efeito: { pt: 'flags ← ACC − op', en: 'flags ← ACC − op' },
    alteraFlags: true,
    descricao: {
      pt: 'Compara o ACC com o operando (subtrai sem guardar o resultado).',
      en: 'Compares ACC with the operand (subtracts without keeping the result).',
    },
  },
  {
    mnemonico: 'ADD',
    codigos: { imediato: 0x95, direto: 0xd5 },
    efeito: { pt: 'ACC ← ACC + op', en: 'ACC ← ACC + op' },
    alteraFlags: true,
    descricao: { pt: 'Soma o operando ao ACC.', en: 'Adds the operand to ACC.' },
  },
  {
    mnemonico: 'SUB',
    codigos: { imediato: 0x96, direto: 0xd6 },
    efeito: { pt: 'ACC ← ACC − op', en: 'ACC ← ACC − op' },
    alteraFlags: true,
    descricao: { pt: 'Subtrai o operando do ACC.', en: 'Subtracts the operand from ACC.' },
  },
  {
    mnemonico: 'AND',
    codigos: { imediato: 0x9a, direto: 0xda },
    efeito: { pt: 'ACC ← ACC AND op', en: 'ACC ← ACC AND op' },
    alteraFlags: true,
    descricao: { pt: 'E lógico bit a bit.', en: 'Bitwise logical AND.' },
  },
  {
    mnemonico: 'XOR',
    codigos: { imediato: 0x9b, direto: 0xdb },
    efeito: { pt: 'ACC ← ACC XOR op', en: 'ACC ← ACC XOR op' },
    alteraFlags: true,
    descricao: { pt: 'OU exclusivo bit a bit.', en: 'Bitwise exclusive OR.' },
  },
  {
    mnemonico: 'ORL',
    codigos: { imediato: 0x9c, direto: 0xdc },
    efeito: { pt: 'ACC ← ACC OR op', en: 'ACC ← ACC OR op' },
    alteraFlags: true,
    descricao: { pt: 'OU lógico bit a bit.', en: 'Bitwise logical OR.' },
  },
]

/** Máscara do bit DW (instrução de 2 bytes). */
export const MASCARA_DW = 0x80
/** Máscara do bit ED (endereçamento direto). */
export const MASCARA_ED = 0x40

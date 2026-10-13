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
 * Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (veja NOTICE.md)
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
  efeito: string
  descricao: Texto
  /** Se altera as flags Z, N e C. */
  alteraFlags: boolean
}

/** "op" = o operando: o valor imediato ou o conteúdo da memória no endereço dado. */
export const INSTRUCOES: readonly DefinicaoInstrucao[] = [
  {
    mnemonico: 'HLT',
    codigos: { implicito: 0x00 },
    efeito: '—',
    alteraFlags: false,
    descricao: { pt: 'Para a CPU.', en: 'Halts the CPU.' },
  },
  {
    mnemonico: 'NOP',
    codigos: { implicito: 0x01 },
    efeito: '—',
    alteraFlags: false,
    descricao: { pt: 'Não faz nada.', en: 'Does nothing.' },
  },
  {
    mnemonico: 'NOT',
    codigos: { implicito: 0x02 },
    efeito: 'ACC ← NOT ACC',
    alteraFlags: true,
    descricao: { pt: 'Inverte todos os bits do ACC.', en: 'Inverts every bit of ACC.' },
  },
  {
    mnemonico: 'RET',
    codigos: { implicito: 0x03 },
    efeito: 'SP ← SP + 1; PC ← M[SP]',
    alteraFlags: false,
    descricao: { pt: 'Retorna de uma sub-rotina.', en: 'Returns from a subroutine.' },
  },
  {
    mnemonico: 'JMP',
    codigos: { direto: 0xc4 },
    efeito: 'PC ← end',
    alteraFlags: false,
    descricao: { pt: 'Desvia sempre para o endereço.', en: 'Always jumps to the address.' },
  },
  {
    mnemonico: 'JEQ',
    codigos: { direto: 0xc5 },
    efeito: 'se Z = 1: PC ← end',
    alteraFlags: false,
    descricao: {
      pt: 'Desvia se o último resultado foi zero.',
      en: 'Jumps if the last result was zero.',
    },
  },
  {
    mnemonico: 'JGT',
    codigos: { direto: 0xc6 },
    efeito: 'se Z = 0 e N = 0: PC ← end',
    alteraFlags: false,
    descricao: {
      pt: 'Desvia se o último resultado foi maior que zero.',
      en: 'Jumps if the last result was greater than zero.',
    },
  },
  {
    mnemonico: 'JGE',
    codigos: { direto: 0xc7 },
    efeito: 'se N = 0: PC ← end',
    alteraFlags: false,
    descricao: {
      pt: 'Desvia se o último resultado foi maior ou igual a zero.',
      en: 'Jumps if the last result was greater than or equal to zero.',
    },
  },
  {
    mnemonico: 'JCY',
    codigos: { direto: 0xc8 },
    efeito: 'se C = 1: PC ← end',
    alteraFlags: false,
    descricao: { pt: 'Desvia se houve "vai-um" (carry).', en: 'Jumps if there was a carry.' },
  },
  {
    mnemonico: 'CAL',
    codigos: { direto: 0xc9 },
    efeito: 'M[SP] ← PC; SP ← SP − 1; PC ← end',
    alteraFlags: false,
    descricao: {
      pt: 'Chama uma sub-rotina, guardando o endereço de retorno na pilha.',
      en: 'Calls a subroutine, saving the return address on the stack.',
    },
  },
  {
    mnemonico: 'SHL',
    codigos: { imediato: 0x8a, direto: 0xca },
    efeito: 'ACC ← ACC deslocado op vezes à esquerda',
    alteraFlags: true,
    descricao: {
      pt: 'Desloca o ACC para a esquerda; entra 0 à direita.',
      en: 'Shifts ACC left; a 0 enters on the right.',
    },
  },
  {
    mnemonico: 'SHR',
    codigos: { imediato: 0x8b, direto: 0xcb },
    efeito: 'ACC ← ACC deslocado op vezes à direita',
    alteraFlags: true,
    descricao: {
      pt: 'Desloca o ACC para a direita; entra 0 à esquerda.',
      en: 'Shifts ACC right; a 0 enters on the left.',
    },
  },
  {
    mnemonico: 'SRA',
    codigos: { imediato: 0x8c, direto: 0xcc },
    efeito: 'ACC ← ACC deslocado op vezes à direita (aritmético)',
    alteraFlags: true,
    descricao: {
      pt: 'Desloca o ACC para a direita mantendo o bit de sinal.',
      en: 'Shifts ACC right keeping the sign bit.',
    },
  },
  {
    mnemonico: 'ROL',
    codigos: { imediato: 0x8d, direto: 0xcd },
    efeito: 'ACC ← ACC girado op vezes à esquerda',
    alteraFlags: true,
    descricao: {
      pt: 'Gira o ACC para a esquerda; o bit 7 volta no bit 0.',
      en: 'Rotates ACC left; bit 7 comes back as bit 0.',
    },
  },
  {
    mnemonico: 'ROR',
    codigos: { imediato: 0x8e, direto: 0xce },
    efeito: 'ACC ← ACC girado op vezes à direita',
    alteraFlags: true,
    descricao: {
      pt: 'Gira o ACC para a direita; o bit 0 volta no bit 7.',
      en: 'Rotates ACC right; bit 0 comes back as bit 7.',
    },
  },
  {
    mnemonico: 'STO',
    codigos: { direto: 0xd0 },
    efeito: 'M[end] ← ACC',
    alteraFlags: false,
    descricao: { pt: 'Guarda o ACC na memória.', en: 'Stores ACC in memory.' },
  },
  {
    mnemonico: 'LOD',
    codigos: { imediato: 0x91, direto: 0xd1 },
    efeito: 'ACC ← op',
    alteraFlags: true,
    descricao: { pt: 'Carrega um valor no ACC.', en: 'Loads a value into ACC.' },
  },
  {
    mnemonico: 'CMP',
    codigos: { imediato: 0x94, direto: 0xd4 },
    efeito: 'flags ← ACC − op',
    alteraFlags: true,
    descricao: {
      pt: 'Compara o ACC com o operando (subtrai sem guardar o resultado).',
      en: 'Compares ACC with the operand (subtracts without keeping the result).',
    },
  },
  {
    mnemonico: 'ADD',
    codigos: { imediato: 0x95, direto: 0xd5 },
    efeito: 'ACC ← ACC + op',
    alteraFlags: true,
    descricao: { pt: 'Soma o operando ao ACC.', en: 'Adds the operand to ACC.' },
  },
  {
    mnemonico: 'SUB',
    codigos: { imediato: 0x96, direto: 0xd6 },
    efeito: 'ACC ← ACC − op',
    alteraFlags: true,
    descricao: { pt: 'Subtrai o operando do ACC.', en: 'Subtracts the operand from ACC.' },
  },
  {
    mnemonico: 'AND',
    codigos: { imediato: 0x9a, direto: 0xda },
    efeito: 'ACC ← ACC AND op',
    alteraFlags: true,
    descricao: { pt: 'E lógico bit a bit.', en: 'Bitwise logical AND.' },
  },
  {
    mnemonico: 'XOR',
    codigos: { imediato: 0x9b, direto: 0xdb },
    efeito: 'ACC ← ACC XOR op',
    alteraFlags: true,
    descricao: { pt: 'OU exclusivo bit a bit.', en: 'Bitwise exclusive OR.' },
  },
  {
    mnemonico: 'ORL',
    codigos: { imediato: 0x9c, direto: 0xdc },
    efeito: 'ACC ← ACC OR op',
    alteraFlags: true,
    descricao: { pt: 'OU lógico bit a bit.', en: 'Bitwise logical OR.' },
  },
]

/** Máscara do bit DW (instrução de 2 bytes). */
export const MASCARA_DW = 0x80
/** Máscara do bit ED (endereçamento direto). */
export const MASCARA_ED = 0x40

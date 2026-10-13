/**
 * Estado da CPU-8E: registradores, ULA, memória e unidade de controle.
 *
 * Derivado de CPU8E.pas (registro CPU, CPU_Reset) e CPU8E_Oper.pas (ResetCPU),
 * CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript; o estado deixou de ser
 * uma variável global e passou a ser um objeto criado por `criarCpu`.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Byte, EstadoControle, Mnemonico } from './tipos'

/** Tamanho da memória: 256 bytes, endereços 00h a FFh. */
export const TAMANHO_MEMORIA = 256

export interface Cpu {
  /** Acumulador: guarda o resultado das operações. */
  acc: Byte
  /** Contador de programa: endereço da próxima leitura de instrução. */
  pc: Byte
  /** Registrador de endereço da memória. */
  mar: Byte
  /** Registrador de dados da memória. */
  mdr: Byte
  /** Entradas da ULA. */
  a: Byte
  b: Byte
  /** Ponteiro de pilha: começa em FFh e desce a cada CAL. */
  sp: Byte
  /** Saída e flags da ULA. */
  ula: { valor: Byte; z: boolean; n: boolean; c: boolean }
  /** Registrador de instrução e sua decodificação. */
  ir: Byte
  opcode: Mnemonico
  dw: boolean
  ed: boolean
  memoria: Uint8Array
  /** Quantos bytes do programa estão carregados (LenProg no original). */
  tamanhoPrograma: number
  /** Unidade de controle: em que estado do ciclo de instrução a CPU está. */
  controle: { s: EstadoControle; t: number }
}

/** Cria uma CPU com memória zerada e registradores no estado de reset. */
export function criarCpu(): Cpu {
  const cpu: Cpu = {
    acc: 0,
    pc: 0,
    mar: 0,
    mdr: 0,
    a: 0,
    b: 0,
    sp: 0xff,
    ula: { valor: 0, z: false, n: false, c: false },
    ir: 0,
    opcode: 'HLT',
    dw: false,
    ed: false,
    memoria: new Uint8Array(TAMANHO_MEMORIA),
    tamanhoPrograma: 0,
    controle: { s: 0, t: 0 },
  }
  return cpu
}

/**
 * Reset da CPU: zera os registradores e reinicia a unidade de controle.
 * A memória (e o programa carregado) é preservada, como no original.
 * DW e ED também não são alterados pelo reset original.
 */
export function resetarCpu(cpu: Cpu): void {
  cpu.acc = 0
  cpu.pc = 0
  cpu.mar = 0
  cpu.mdr = 0
  cpu.a = 0
  cpu.b = 0
  cpu.ir = 0
  cpu.sp = 0xff
  cpu.ula = { valor: 0, z: false, n: false, c: false }
  cpu.opcode = 'HLT'
  cpu.controle = { s: 0, t: 0 }
}

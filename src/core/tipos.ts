/**
 * Tipos básicos do núcleo da CPU-8E.
 *
 * Derivado de CPU8E.pas (CPU-8E v2.2.3)
 * Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript para o CPU-8E Web.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SegmentoBarramento } from './barramentos'

/** Um valor de 8 bits (0 a 255). O JavaScript não tem esse tipo; usamos `number` e máscaras `& 0xff`. */
export type Byte = number

/** Mnemônicos das instruções. `XXX` representa um código inválido, como no original. */
export type Mnemonico =
  | 'HLT'
  | 'NOP'
  | 'NOT'
  | 'JMP'
  | 'JEQ'
  | 'JGT'
  | 'JGE'
  | 'STO'
  | 'LOD'
  | 'CMP'
  | 'ADD'
  | 'SUB'
  | 'AND'
  | 'XOR'
  | 'ORL'
  | 'JCY'
  | 'SHL'
  | 'SHR'
  | 'SRA'
  | 'ROL'
  | 'ROR'
  | 'CAL'
  | 'RET'
  | 'XXX'

/**
 * Fases do ciclo de instrução:
 * - busca: lê o código da instrução da memória para o IR;
 * - operando: lê o segundo byte (só instruções de 2 bytes);
 * - execucao: realiza a operação.
 */
export type Fase = 'busca' | 'operando' | 'execucao'

/**
 * Estado da unidade de controle (`UControl.S` no original):
 * 0 = buscar instrução, 1 = buscar operando, 2 = executar, 3 = parada (HALT).
 */
export type EstadoControle = 0 | 1 | 2 | 3

/** Itens do painel que mostram um valor (registradores, flags e o decodificador de instrução). */
export type ItemPainel =
  'ACC' | 'PC' | 'MAR' | 'MDR' | 'IR' | 'SP' | 'A' | 'B' | 'ULA' | 'DI' | 'Z' | 'N' | 'C'

/** Um item realçado num pulso de clock, com o texto que passa a mostrar. */
export interface Destaque {
  item: ItemPainel
  valor: string
}

/**
 * Eventos emitidos pela CPU enquanto executa. A interface os consome para
 * animar o painel; os testes os comparam com o simulador original.
 *
 * Correspondência com o código Pascal original:
 * - `fase`         → SetPhase
 * - `valor`        → SetValue / ShowReg (muda o texto de um item sem realçá-lo)
 * - `foco`         → ShowMem (move a seleção da tabela de memória)
 * - `pulso`        → PulseClock (realça itens e barramentos; no modo passo a passo, espera o usuário)
 * - `fimInstrucao` → Pause(_Cycle) no fim de Execute (no modo ciclo, espera o usuário)
 * - `invalido`     → mensagem "INVALID OpCode!"
 * - `halt`         → a CPU chegou ao estado de parada
 */
export type Evento =
  | { tipo: 'fase'; fase: Fase }
  | { tipo: 'valor'; item: ItemPainel; valor: string }
  | { tipo: 'foco'; endereco: Byte }
  | { tipo: 'pulso'; destaques: Destaque[]; barramentos: readonly SegmentoBarramento[] }
  | { tipo: 'fimInstrucao' }
  | { tipo: 'invalido' }
  | { tipo: 'halt' }

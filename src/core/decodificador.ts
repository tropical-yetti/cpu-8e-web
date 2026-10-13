/**
 * Decodificador de instruções: transforma o byte do IR em uma instrução.
 *
 * Derivado de CPU8E_Control.pas (DecodeOpCode), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript; a tabela de códigos
 * passou a ser montada a partir de opcodes.ts.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { INSTRUCOES, MASCARA_DW, MASCARA_ED } from './opcodes'
import type { Byte, Mnemonico } from './tipos'

export interface InstrucaoDecodificada {
  mnemonico: Mnemonico
  /** Instrução de 2 bytes (tem operando). */
  dw: boolean
  /** Endereçamento direto (o operando é um endereço). */
  ed: boolean
}

/** Código → mnemônico, montado uma vez a partir da tabela de instruções. */
const MNEMONICO_POR_CODIGO = new Map<Byte, Mnemonico>(
  INSTRUCOES.flatMap((instrucao) =>
    Object.values(instrucao.codigos).map((codigo) => [codigo, instrucao.mnemonico] as const),
  ),
)

/**
 * Decodifica um código de instrução.
 *
 * Como no original, códigos desconhecidos resultam em `XXX` com DW e ED
 * falsos; para os conhecidos, DW e ED vêm direto dos bits 7 e 6.
 */
export function decodificar(codigo: Byte): InstrucaoDecodificada {
  const mnemonico = MNEMONICO_POR_CODIGO.get(codigo)
  if (mnemonico === undefined) {
    return { mnemonico: 'XXX', dw: false, ed: false }
  }
  return {
    mnemonico,
    dw: (codigo & MASCARA_DW) !== 0,
    ed: (codigo & MASCARA_ED) !== 0,
  }
}

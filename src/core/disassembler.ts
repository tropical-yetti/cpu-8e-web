/**
 * Disassembler: mostra a memória como instruções em linguagem de montagem.
 *
 * Derivado de CPU8E_Panel.pas (Disassembler, LoadMem), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript como função pura que
 * devolve o texto de cada posição de memória.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TAMANHO_MEMORIA } from './cpu'
import { decodificar } from './decodificador'
import { hex2 } from './formatacao'

/**
 * Devolve, para cada um dos 256 endereços, o texto da coluna "Assembly":
 * o mnemônico no byte da instrução e o operando ("05" ou "[16]") no byte
 * seguinte. Posições fora do programa ficam vazias.
 *
 * Fiel ao original (v1.0): a leitura começa em 00h e trata tudo como código,
 * inclusive áreas de dados. Códigos inválidos aparecem como "XXX".
 */
export function desmontar(memoria: Uint8Array, tamanhoPrograma: number): string[] {
  const linhas = new Array<string>(TAMANHO_MEMORIA).fill('')
  let endereco = 0
  while (endereco < tamanhoPrograma) {
    const instrucao = decodificar(memoria[endereco]!)
    linhas[endereco] = instrucao.mnemonico
    if (instrucao.dw) {
      endereco++
      // Uma instrução de 2 bytes no último endereço não tem operando visível.
      if (endereco >= TAMANHO_MEMORIA) break
      const operando = hex2(memoria[endereco]!)
      linhas[endereco] = instrucao.ed ? `[${operando}]` : operando
    }
    endereco++
  }
  return linhas
}

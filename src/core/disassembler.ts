/**
 * Disassembler: mostra a memória como instruções em linguagem de montagem.
 *
 * Derivado de CPU8E_Panel.pas (Disassembler, LoadMem), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript como função pura que
 * devolve o texto de cada posição de memória.
 * Modificado em 2026-10-17: dados marcados como dados (v1.1, item 8).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TAMANHO_MEMORIA } from './cpu'
import { decodificar } from './decodificador'
import { hex2 } from './formatacao'
import type { Mnemonico } from './tipos'

/** Instruções depois das quais a execução não segue para o byte seguinte. */
const SEM_SEQUENCIA = new Set<Mnemonico | 'XXX'>(['HLT', 'JMP', 'RET', 'XXX'])

/** Instruções que podem desviar para o endereço do operando. */
const DESVIOS = new Set<Mnemonico>(['JMP', 'JEQ', 'JGT', 'JGE', 'JCY', 'CAL'])

/**
 * Devolve, para cada um dos 256 endereços, o texto da coluna "Símbolo":
 * o mnemônico no byte da instrução, o operando ("05" ou "[16]") no byte
 * seguinte e "DB 05" nos bytes de dados. Posições fora do programa ficam
 * vazias. Códigos inválidos aparecem como "XXX".
 *
 * Para separar código de dados, o disassembler segue os caminhos que a
 * execução pode tomar a partir do endereço 00: depois de cada instrução vem
 * a seguinte, e os desvios (JMP, JEQ, JGT, JGE, JCY, CAL) levam também ao
 * endereço do operando. O que nenhum caminho alcança é dado.
 *
 * Limites: um programa que modifica o próprio código, ou que pula para o
 * meio de uma instrução, pode ser mostrado de forma diferente do que executa.
 *
 * CORRIGIDO NA v1.1 (item 8): o original lia toda a memória como código, a
 * partir de 00h. Dados apareciam como instruções, e um byte de dado podia
 * desalinhar as instruções seguintes.
 */
export function desmontar(memoria: Uint8Array, tamanhoPrograma: number): string[] {
  const linhas = new Array<string>(TAMANHO_MEMORIA).fill('')
  const visitado = new Array<boolean>(TAMANHO_MEMORIA).fill(false)
  const pendentes = tamanhoPrograma > 0 ? [0] : []

  while (pendentes.length > 0) {
    const endereco = pendentes.pop()!
    // Só dentro do programa, e sem passar duas vezes pelo mesmo byte.
    if (endereco >= tamanhoPrograma || visitado[endereco]) continue
    visitado[endereco] = true

    const instrucao = decodificar(memoria[endereco]!)
    linhas[endereco] = instrucao.mnemonico
    let seguinte = endereco + 1

    if (instrucao.dw && seguinte < TAMANHO_MEMORIA) {
      // O operando ocupa o byte seguinte, mesmo que passe do fim do programa.
      const operando = memoria[seguinte]!
      linhas[seguinte] = instrucao.ed ? `[${hex2(operando)}]` : hex2(operando)
      visitado[seguinte] = true
      seguinte++
      if (DESVIOS.has(instrucao.mnemonico as Mnemonico)) pendentes.push(operando)
    }
    if (!SEM_SEQUENCIA.has(instrucao.mnemonico)) pendentes.push(seguinte)
  }

  for (let endereco = 0; endereco < tamanhoPrograma; endereco++) {
    if (!visitado[endereco]) linhas[endereco] = `DB ${hex2(memoria[endereco]!)}`
  }
  return linhas
}

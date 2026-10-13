/**
 * Carregar, gravar e editar o conteúdo da memória.
 *
 * Derivado de CPU8E_Oper.pas (LoadFile, SaveFile) e CPU8E_Panel.pas
 * (sgMemoriaSetEditText), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript; arquivos passaram a ser
 * lidos e gravados como bytes no navegador.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TAMANHO_MEMORIA, type Cpu } from './cpu'
import type { Byte } from './tipos'

/**
 * Carrega um programa: zera a memória e copia até 256 bytes do arquivo.
 * Devolve quantos bytes foram carregados.
 */
export function carregarPrograma(cpu: Cpu, bytes: Uint8Array): number {
  cpu.memoria.fill(0)
  const tamanho = Math.min(bytes.length, TAMANHO_MEMORIA)
  cpu.memoria.set(bytes.subarray(0, tamanho))
  cpu.tamanhoPrograma = tamanho
  return tamanho
}

/**
 * Bytes a gravar num arquivo.
 *
 * Fiel ao original (v1.0): grava só os `tamanhoPrograma` primeiros bytes.
 * Dados escritos além desse ponto (por STO ou pela pilha) não são gravados.
 * Este comportamento está listado entre as correções previstas para a v1.1.
 */
export function bytesParaGravar(cpu: Cpu): Uint8Array {
  return cpu.memoria.slice(0, cpu.tamanhoPrograma)
}

/**
 * Converte o texto digitado como `StrToIntDef('$' + texto, 0)` do Free Pascal:
 * hexadecimal válido vira número; qualquer outra coisa vira 0.
 */
function hexadecimalOuZero(texto: string): number {
  if (!/^[0-9a-fA-F]+$/.test(texto)) return 0
  const valor = Number.parseInt(texto, 16)
  // StrToIntDef devolve o padrão quando o número não cabe num inteiro de 32 bits
  return valor > 0xffffffff ? 0 : valor
}

/**
 * Edição de uma célula da tabela de memória.
 *
 * Fiel ao original (v1.0): texto inválido grava 00 sem aviso, e valores
 * acima de FF são truncados para 8 bits. Editar além do fim do programa
 * aumenta o tamanho do programa até aquela posição.
 * Devolve o byte efetivamente gravado.
 */
export function editarMemoria(cpu: Cpu, endereco: Byte, texto: string): Byte {
  const valor = hexadecimalOuZero(texto) & 0xff
  cpu.memoria[endereco] = valor
  if (endereco + 1 > cpu.tamanhoPrograma) {
    cpu.tamanhoPrograma = endereco + 1
  }
  return valor
}

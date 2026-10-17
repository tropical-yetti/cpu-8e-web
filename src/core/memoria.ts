/**
 * Carregar, gravar e editar o conteúdo da memória.
 *
 * Derivado de CPU8E_Oper.pas (LoadFile, SaveFile) e CPU8E_Panel.pas
 * (sgMemoriaSetEditText), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript; arquivos passaram a ser
 * lidos e gravados como bytes no navegador.
 * Modificado em 2026-10-17: edição validada e gravação completa (v1.1).
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
 * Bytes a gravar num arquivo: da posição 00 até o último byte diferente de
 * zero da memória, e nunca menos que o programa carregado (que pode terminar
 * em zeros, como o HLT = 00).
 *
 * CORRIGIDO NA v1.1 (item 4): o original gravava só os `tamanhoPrograma`
 * primeiros bytes, e os dados escritos depois desse ponto (por STO ou pela
 * pilha, perto de FF) ficavam de fora.
 */
export function bytesParaGravar(cpu: Cpu): Uint8Array {
  let fim = cpu.tamanhoPrograma
  for (let endereco = TAMANHO_MEMORIA - 1; endereco >= fim; endereco--) {
    if (cpu.memoria[endereco] !== 0) {
      fim = endereco + 1
      break
    }
  }
  return cpu.memoria.slice(0, fim)
}

/**
 * Lê o texto digitado numa célula: um ou dois dígitos hexadecimais (00 a FF),
 * em maiúsculas ou minúsculas. Qualquer outra coisa devolve null.
 */
function lerByteHexadecimal(texto: string): Byte | null {
  const limpo = texto.trim()
  return /^[0-9a-fA-F]{1,2}$/.test(limpo) ? Number.parseInt(limpo, 16) : null
}

/**
 * Edição de uma célula da tabela de memória. Editar além do fim do programa
 * aumenta o tamanho do programa até aquela posição.
 * Devolve o byte gravado, ou null se o texto não for um valor válido; nesse
 * caso a memória não muda.
 *
 * CORRIGIDO NA v1.1 (item 5): o original aceitava qualquer texto, gravava 00
 * sem avisar quando não era hexadecimal e cortava valores acima de FF.
 */
export function editarMemoria(cpu: Cpu, endereco: Byte, texto: string): Byte | null {
  const valor = lerByteHexadecimal(texto)
  if (valor === null) return null
  cpu.memoria[endereco] = valor
  if (endereco + 1 > cpu.tamanhoPrograma) {
    cpu.tamanhoPrograma = endereco + 1
  }
  return valor
}

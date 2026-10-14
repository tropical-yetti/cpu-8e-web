/**
 * Siglas do painel no idioma da interface.
 *
 * O desenho original usa siglas em português (ULA, UC, BI, BD, BE, DI). Em
 * português elas aparecem exatamente como no original; em inglês, viram as
 * siglas usadas nos livros em inglês. As siglas que já são inglesas no
 * original (ACC, PC, MAR, MDR, IR, SP, RD, WR) não mudam.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const SIGLAS_EM_INGLES: Record<string, string> = {
  ULA: 'ALU', // Unidade Lógica e Aritmética → Arithmetic Logic Unit
  UC: 'CU', // Unidade de Controle → Control Unit
  DI: 'ID', // Decodificador de Instruções → Instruction Decoder
  BI: 'IB', // Barramento Interno → Internal Bus
  BD: 'DB', // Barramento de Dados → Data Bus
  BE: 'AB', // Barramento de Endereços → Address Bus
}

/** Uma sigla do painel ("ULA") no idioma da interface ("ALU" em inglês). */
export function siglaNoIdioma(sigla: string, idioma: string): string {
  if (idioma.startsWith('pt')) return sigla
  return SIGLAS_EM_INGLES[sigla] ?? sigla
}

/**
 * Um texto do painel no idioma da interface: a sigla isolada ("UC") ou a
 * sigla antes de ":" ou "=" ("ULA:05", "ULA=00000101"). O valor não muda.
 */
export function rotuloNoIdioma(texto: string, idioma: string): string {
  const [, sigla = texto, resto = ''] = /^([^:=]+)([:=].*)?$/s.exec(texto) ?? []
  return siglaNoIdioma(sigla, idioma) + resto
}

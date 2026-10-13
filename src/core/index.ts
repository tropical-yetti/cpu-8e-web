/**
 * Núcleo da CPU-8E: tudo o que simula a CPU, sem nenhuma dependência de
 * interface. Pode ser usado pela aplicação Vue, por testes ou por scripts.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export * from './tipos'
export * from './cpu'
export * from './controle'
export * from './decodificador'
export * from './disassembler'
export * from './formatacao'
export * from './memoria'
export * from './opcodes'
export * from './ula'
export { CAMINHOS, type SegmentoBarramento } from './barramentos'

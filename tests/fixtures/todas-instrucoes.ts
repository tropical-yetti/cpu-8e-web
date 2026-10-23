/**
 * Programa "todas as instruções" (ADR 0003): passa pelas 23 instruções e
 * pelos casos de estouro, e grava cada resultado na memória, de 80 a 8F.
 * O teste confere a memória e os registradores no fim.
 *
 * Na versão com o montador, este programa vira um exemplo comentado em
 * assembly para os alunos.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// prettier-ignore
const LINHAS: [endereco: number, bytes: number[], comentario: string][] = [
  [0x00, [0x91, 0x05], 'LOD 05      ; ACC = 05'],
  [0x02, [0x95, 0xfc], 'ADD FC      ; 05 + FC = 101: ACC = 01, C = 1 (estouro de 8 bits)'],
  [0x04, [0xd0, 0x80], 'STO [80]    ; M[80] = 01'],
  [0x06, [0xc8, 0x0a], 'JCY [0A]    ; C = 1: desvia'],
  [0x08, [0x00], 'HLT         ; não é executado'],
  [0x09, [0x01], 'NOP         ; não é executado'],
  [0x0a, [0x91, 0x7f], 'LOD 7F'],
  [0x0c, [0x95, 0x01], 'ADD 01      ; 7F + 01 = 80: N = 1, C = 0 (estouro com sinal)'],
  [0x0e, [0xd0, 0x81], 'STO [81]    ; M[81] = 80'],
  [0x10, [0x96, 0x81], 'SUB 81      ; 80 − 81 = FF: N = 1, C = 0 (empréstimo)'],
  [0x12, [0xd0, 0x82], 'STO [82]    ; M[82] = FF'],
  [0x14, [0x94, 0xff], 'CMP FF      ; ACC = FF: Z = 1'],
  [0x16, [0xc5, 0x1a], 'JEQ [1A]    ; Z = 1: desvia'],
  [0x18, [0x00], 'HLT         ; não é executado'],
  [0x19, [0x01], 'NOP         ; não é executado'],
  [0x1a, [0x02], 'NOT         ; NOT FF = 00, Z = 1'],
  [0x1b, [0xd0, 0x83], 'STO [83]    ; M[83] = 00'],
  [0x1d, [0x91, 0x3c], 'LOD 3C'],
  [0x1f, [0x9a, 0x0f], 'AND 0F      ; 3C AND 0F = 0C'],
  [0x21, [0xd0, 0x84], 'STO [84]    ; M[84] = 0C'],
  [0x23, [0x9b, 0xff], 'XOR FF      ; 0C XOR FF = F3'],
  [0x25, [0xd0, 0x85], 'STO [85]    ; M[85] = F3'],
  [0x27, [0x9c, 0x0f], 'ORL 0F      ; F3 OR 0F = FF'],
  [0x29, [0xd0, 0x86], 'STO [86]    ; M[86] = FF'],
  [0x2b, [0xd1, 0x90], 'LOD [90]    ; ACC = 81'],
  [0x2d, [0x8a, 0x01], 'SHL 01      ; 02, C = 1'],
  [0x2f, [0xd0, 0x87], 'STO [87]'],
  [0x31, [0xd1, 0x90], 'LOD [90]'],
  [0x33, [0x8b, 0x01], 'SHR 01      ; 40, C = 1'],
  [0x35, [0xd0, 0x88], 'STO [88]'],
  [0x37, [0xd1, 0x90], 'LOD [90]'],
  [0x39, [0x8c, 0x01], 'SRA 01      ; C0, C = 1'],
  [0x3b, [0xd0, 0x89], 'STO [89]'],
  [0x3d, [0xd1, 0x90], 'LOD [90]'],
  [0x3f, [0x8d, 0x01], 'ROL 01      ; 03, C = 1'],
  [0x41, [0xd0, 0x8a], 'STO [8A]'],
  [0x43, [0xd1, 0x90], 'LOD [90]'],
  [0x45, [0x8e, 0x01], 'ROR 01      ; C0, C = 1'],
  [0x47, [0xd0, 0x8b], 'STO [8B]'],
  [0x49, [0x8a, 0x00], 'SHL 00      ; contador 0: nada muda'],
  [0x4b, [0xd0, 0x8c], 'STO [8C]    ; M[8C] = C0'],
  [0x4d, [0x91, 0x01], 'LOD 01'],
  [0x4f, [0xca, 0x91], 'SHL [91]    ; 9 vezes: ACC = 00, Z = 1, C = 0'],
  [0x51, [0xd0, 0x8d], 'STO [8D]    ; M[8D] = 00'],
  [0x53, [0xc6, 0x57], 'JGT [57]    ; Z = 1: não desvia'],
  [0x55, [0xc7, 0x59], 'JGE [59]    ; N = 0: desvia'],
  [0x57, [0x00], 'HLT         ; não é executado'],
  [0x58, [0x01], 'NOP         ; não é executado'],
  [0x59, [0xc9, 0x70], 'CAL [70]    ; M[FF] = 5B, SP = FE'],
  [0x5b, [0xd0, 0x8f], 'STO [8F]    ; M[8F] = 42, valor da sub-rotina'],
  [0x5d, [0xc4, 0x60], 'JMP [60]    ; pula o dado em 5F'],
  [0x5f, [0xaa], 'DB AA       ; dado (seria um código inválido)'],
  [0x60, [0x00], 'HLT'],
  [0x70, [0x91, 0x42], 'LOD 42      ; sub-rotina'],
  [0x72, [0xd0, 0x8e], 'STO [8E]    ; M[8E] = 42'],
  [0x74, [0x03], 'RET         ; volta para 5B, SP = FF'],
  [0x90, [0x81], 'DB 81       ; valor dos deslocamentos'],
  [0x91, [0x09], 'DB 09       ; contador maior que 8'],
]

/** Os bytes do programa, de 00 até o último usado. */
export const TODAS_INSTRUCOES: Uint8Array = (() => {
  const memoria = new Uint8Array(256)
  let fim = 0
  for (const [endereco, bytes] of LINHAS) {
    memoria.set(bytes, endereco)
    fim = Math.max(fim, endereco + bytes.length)
  }
  return memoria.slice(0, fim)
})()

/** Os mnemônicos usados, para o teste conferir que nenhuma instrução ficou de fora. */
export const MNEMONICOS_USADOS = LINHAS.map(([, , comentario]) => comentario.split(/\s/)[0]!)

/** Resultados gravados de 80 a 8F. */
export const RESULTADOS_ESPERADOS = [
  0x01, 0x80, 0xff, 0x00, 0x0c, 0xf3, 0xff, 0x02, 0x40, 0xc0, 0x03, 0xc0, 0xc0, 0x00, 0x42, 0x42,
]

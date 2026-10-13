/**
 * Programas de teste. Cada um é executado no simulador original (via
 * tools/referencia/cpu8e_ref.pas) para gerar o gabarito, e no núcleo
 * TypeScript para comparar os dois, evento por evento.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface ProgramaTeste {
  nome: string
  descricao: string
  bytes: Uint8Array
}

/**
 * Monta a memória a partir de trechos. Cada trecho começa pelo endereço
 * inicial, seguido das instruções (cada instrução é uma lista de bytes).
 */
function montar(...trechos: [number, ...number[][]][]): Uint8Array {
  const memoria = new Uint8Array(256)
  let fim = 0
  for (const [inicio, ...instrucoes] of trechos) {
    const bytes = instrucoes.flat()
    memoria.set(bytes, inicio)
    fim = Math.max(fim, inicio + bytes.length)
  }
  return memoria.slice(0, fim)
}

function original(arquivo: string): Uint8Array {
  const caminho = fileURLToPath(new URL(`../../public/programas/${arquivo}`, import.meta.url))
  return new Uint8Array(readFileSync(caminho))
}

// prettier-ignore
export const PROGRAMAS: ProgramaTeste[] = [
  {
    nome: 'teste',
    descricao: 'teste.bin, distribuído com o simulador original',
    bytes: original('teste.bin'),
  },
  {
    nome: 'allopcodes',
    descricao: 'allopcodes.bin, distribuído com o simulador original',
    bytes: original('allopcodes.bin'),
  },
  {
    nome: 'aritmetica',
    descricao: 'Operações da ULA em modo imediato e direto, com carry e negativo',
    bytes: montar([0x00,
      [0x91, 0x05], // LOD  05
      [0x95, 0xfc], // ADD  FC    ; 05 + FC = 101 → ACC = 01, C = 1
      [0xd0, 0x40], // STO  [40]
      [0x96, 0x02], // SUB  02    ; 01 − 02 = FF, N = 1, C = 0
      [0x9a, 0x0f], // AND  0F
      [0x9b, 0xff], // XOR  FF
      [0x9c, 0x80], // ORL  80
      [0x02],       // NOT
      [0x94, 0x00], // CMP  00
      [0xd5, 0x40], // ADD  [40]
      [0xd6, 0x40], // SUB  [40]
      [0xda, 0x40], // AND  [40]
      [0xdb, 0x40], // XOR  [40]
      [0xdc, 0x40], // ORL  [40]
      [0xd4, 0x40], // CMP  [40]
      [0x01],       // NOP
      [0x00],       // HLT
    ]),
  },
  {
    nome: 'desvios',
    descricao: 'Desvios condicionais tomados e não tomados',
    bytes: montar(
      [0x00, [0x91, 0x00], [0xc5, 0x06], [0x00]],  // LOD 00; JEQ [06] (sim); HLT
      [0x06, [0x91, 0x01], [0xc6, 0x0c], [0x00]],  // LOD 01; JGT [0C] (sim); HLT
      [0x0c, [0x94, 0x01], [0xc7, 0x12], [0x00]],  // CMP 01; JGE [12] (sim); HLT
      [0x12, [0x96, 0x02], [0xc8, 0x18], [0xc4, 0x1a]],  // SUB 02; JCY [18] (não); JMP [1A]
      [0x1a, [0x95, 0xff], [0xc5, 0x00], [0xc6, 0x00], [0xc8, 0x24]],  // ADD FF; JEQ, JGT (não); JCY [24] (sim)
      [0x24, [0x00]],                              // HLT
    ),
  },
  {
    nome: 'deslocamentos',
    descricao: 'Shifts e rotates, inclusive o defeito do contador zero',
    bytes: montar(
      [0x00,
        [0x91, 0x81], // LOD  81
        [0x8a, 0x01], // SHL  01
        [0x8d, 0x02], // ROL  02
        [0x8e, 0x03], // ROR  03
        [0x8b, 0x01], // SHR  01
        [0x8c, 0x02], // SRA  02
        [0x91, 0xc3], // LOD  C3
        [0x8c, 0x01], // SRA  01
        [0x95, 0x10], // ADD  10
        [0x94, 0x05], // CMP  05    ; a ULA guarda ACC − 05
        [0x8a, 0x00], // SHL  00    ; defeito do original: ACC recebe ACC − 05
        [0xca, 0x20], // SHL  [20]
        [0xcd, 0x21], // ROL  [21]
        [0x00],       // HLT
      ],
      [0x20, [0x02], [0x00]], // dados: 02, 00
    ),
  },
  {
    nome: 'subrotina',
    descricao: 'CAL e RET com a pilha começando em FFh',
    bytes: montar(
      [0x00, [0x91, 0x00], [0xc9, 0x10], [0xc9, 0x10], [0xd0, 0x30], [0x00]], // LOD 00; CAL [10]; CAL [10]; STO [30]; HLT
      [0x10, [0x95, 0x01], [0x03]],                                           // ADD 01; RET
    ),
  },
  {
    nome: 'laco',
    descricao: 'Contagem regressiva com JGT',
    bytes: montar([0x00, [0x91, 0x03], [0x96, 0x01], [0xc6, 0x02], [0x00]]), // LOD 03; SUB 01; JGT [02]; HLT
  },
  {
    nome: 'invalido',
    descricao: 'Código de instrução inválido para a CPU',
    bytes: montar([0x00, [0x91, 0x05], [0xaa], [0x00]]), // LOD 05; (AA inválido); HLT
  },
  {
    nome: 'vazio',
    descricao: 'Memória zerada: HLT logo no endereço 00h',
    bytes: new Uint8Array([0x00]),
  },
]

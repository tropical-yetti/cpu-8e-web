/**
 * Fios do painel novo (ADR 0005): cada caminho de dados do núcleo acende os
 * fios certos, e nenhum segmento citado no painel novo deixa de existir no
 * núcleo.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { CAMINHOS } from '../../src/core/barramentos'
import { SEGMENTOS_DO_FIO, fiosAcesos, type Fio } from '../../src/painel/fios'

type Caminho = keyof typeof CAMINHOS

const ESPERADO: Record<Caminho, Fio[]> = {
  PC_PARA_MAR: ['pcSai', 'bi', 'marEntra', 'be'],
  MEMORIA_PARA_MDR: ['bdParaCpu', 'rd'],
  MDR_PARA_MEMORIA: ['bdParaMemoria', 'wr'],
  MDR_PARA_IR: ['mdrSai', 'bi', 'irEntra'],
  IR_PARA_UC: ['irParaUc'],
  MDR_PARA_MAR: ['mdrSai', 'bi', 'marEntra', 'be'],
  MAR_PARA_PC: ['marSai', 'bi', 'pcEntra'],
  ACC_PARA_A: ['accSai', 'bi', 'aEntra'],
  ACC_PARA_MDR: ['accSai', 'bi', 'mdrEntra'],
  MDR_PARA_A: ['mdrSai', 'bi', 'aEntra'],
  MDR_PARA_B: ['mdrSai', 'bi', 'bEntra'],
  MDR_PARA_PC: ['mdrSai', 'bi', 'pcEntra'],
  ULA_PARA_ACC: ['ulaSai', 'bi', 'accEntra'],
  ULA_PARA_A: ['ulaSai', 'bi', 'aEntra'],
  PC_PARA_MDR: ['pcSai', 'bi', 'mdrEntra'],
  SP_PARA_MAR: ['spSai', 'bi', 'marEntra'],
  FLAG_Z: ['flags'],
  FLAG_N: ['flags'],
  FLAG_C: ['flags'],
  NENHUM: [],
}

describe('fios do painel novo', () => {
  for (const [caminho, fios] of Object.entries(ESPERADO) as [Caminho, Fio[]][]) {
    it(`${caminho} acende ${fios.join(', ') || 'nada'}`, () => {
      expect([...fiosAcesos(CAMINHOS[caminho])].sort()).toEqual([...fios].sort())
    })
  }

  it('todo caminho do núcleo tem um teste acima', () => {
    expect(Object.keys(ESPERADO).sort()).toEqual(Object.keys(CAMINHOS).sort())
  })

  it('todo segmento citado existe num caminho do núcleo', () => {
    const doNucleo = new Set<string>(Object.values(CAMINHOS).flat())
    for (const segmentos of Object.values(SEGMENTOS_DO_FIO)) {
      for (const segmento of segmentos) expect(doNucleo, segmento).toContain(segmento)
    }
  })

  it('todo fio acende em algum caminho', () => {
    const acesos = new Set(Object.values(CAMINHOS).flatMap((c) => [...fiosAcesos(c)]))
    expect([...acesos].sort()).toEqual(Object.keys(SEGMENTOS_DO_FIO).sort())
  })
})

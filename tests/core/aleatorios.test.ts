/**
 * Teste de fidelidade com programas aleatórios: memórias de 256 bytes
 * sorteadas são executadas no simulador de referência (o Pascal original com
 * as correções da v1.1, compilado com -dCORRIGIDO) e no núcleo TypeScript, e
 * os rastros precisam ser idênticos.
 *
 * Precisa do Free Pascal (fpc) instalado; sem ele, o teste é pulado. O CI
 * instala o fpc, então ele sempre roda lá.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { compilarReferencia, rastroOriginal } from '../../tools/referencia/gerar-gabaritos'
import { rastrear } from './rastro'

function temFpc(): boolean {
  try {
    execFileSync('fpc', ['-iV'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Gerador pseudoaleatório com semente (mulberry32), para resultados repetíveis. */
function sorteador(semente: number): () => number {
  let s = semente >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PROGRAMAS_SORTEADOS = 60
const MAX_EVENTOS = 3000

describe.skipIf(!temFpc())('fidelidade com programas aleatórios', () => {
  const executavel = compilarReferencia({ corrigido: true })

  it(`${PROGRAMAS_SORTEADOS} programas sorteados produzem rastros idênticos`, () => {
    for (let semente = 1; semente <= PROGRAMAS_SORTEADOS; semente++) {
      const aleatorio = sorteador(semente)
      // Metade dos bytes vem só de códigos válidos, para os programas irem longe.
      const validos = [
        0x00, 0x01, 0x02, 0x03, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e,
        0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xd0, 0x91, 0xd1, 0x94, 0xd4, 0x95, 0xd5, 0x96, 0xd6, 0x9a,
        0xda, 0x9b, 0xdb, 0x9c, 0xdc,
      ]
      const bytes = Uint8Array.from({ length: 256 }, () =>
        aleatorio() < 0.5
          ? validos[Math.floor(aleatorio() * validos.length)]!
          : Math.floor(aleatorio() * 256),
      )
      const esperado = rastroOriginal(executavel, bytes, MAX_EVENTOS)
        .trim()
        .split('\n')
        .map((linha) => JSON.parse(linha) as unknown)
      const obtido = rastrear(bytes, MAX_EVENTOS)
      expect(obtido, `programa sorteado com semente ${semente}`).toEqual(esperado)
    }
  }, 120_000)
})

/**
 * Testes de fidelidade: o núcleo TypeScript deve produzir exatamente a mesma
 * sequência de eventos e estados que o simulador original, para cada
 * programa de tests/fixtures/programas.ts.
 *
 * Os gabaritos (tests/fixtures/gabaritos/*.jsonl) são gerados pelo código
 * Pascal original com `npm run gabaritos`, compilado com as correções da v1.1
 * (-dCORRIGIDO; veja tools/referencia/cpu8e_ref.pas).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PROGRAMAS } from '../fixtures/programas'
import { rastrear } from './rastro'

function lerGabarito(nome: string): unknown[] {
  const arquivo = new URL(`../fixtures/gabaritos/${nome}.jsonl`, import.meta.url)
  return readFileSync(arquivo, 'utf8')
    .trim()
    .split('\n')
    .map((linha) => JSON.parse(linha) as unknown)
}

describe('fidelidade ao simulador original', () => {
  for (const programa of PROGRAMAS) {
    it(`${programa.nome}: ${programa.descricao}`, () => {
      const esperado = lerGabarito(programa.nome)
      const obtido = rastrear(programa.bytes)

      // Compara evento a evento para que uma falha aponte o primeiro desvio.
      const total = Math.max(esperado.length, obtido.length)
      for (let i = 0; i < total; i++) {
        expect(obtido[i], `evento ${i + 1} de ${esperado.length}`).toEqual(esperado[i])
      }
    })
  }
})

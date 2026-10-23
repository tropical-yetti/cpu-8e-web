/**
 * Siglas do painel novo: toda sigla tem nome nos dois idiomas, e a sigla
 * mostrada é a mesma do visual clássico (src/painel/rotulos.ts).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { siglaNoIdioma } from '../../src/painel/rotulos'
import { SIGLAS, SIGLA_DO_ITEM } from '../../src/painel/siglas'

type Mensagens = { siglas: Record<string, { sigla: string; nome: string }> }

// Lidas do disco: importadas, passariam pelo plugin do vue-i18n e chegariam compiladas.
function ler(idioma: string): Mensagens {
  return JSON.parse(
    readFileSync(new URL(`../../src/locales/${idioma}.json`, import.meta.url), 'utf8'),
  ) as Mensagens
}
const pt = ler('pt-BR')
const MENSAGENS = { 'pt-BR': pt, en: ler('en') }

describe('siglas do painel', () => {
  for (const [idioma, mensagens] of Object.entries(MENSAGENS)) {
    const { siglas } = mensagens

    it(`${idioma}: toda sigla da lista tem texto, e nenhuma sobra`, () => {
      expect(Object.keys(siglas).sort()).toEqual([...SIGLAS].sort())
      for (const chave of SIGLAS) {
        expect(siglas[chave]!.sigla, chave).not.toBe('')
        expect(siglas[chave]!.nome.length, chave).toBeGreaterThan(10)
      }
    })

    it(`${idioma}: a sigla é a mesma do visual clássico`, () => {
      // No original, as siglas estão em português; em inglês, viram as dos livros em inglês.
      for (const chave of SIGLAS) {
        const emPortugues = pt.siglas[chave]!.sigla
        expect(siglaNoIdioma(emPortugues, idioma), chave).toBe(siglas[chave]!.sigla)
      }
    })
  }

  it('todo item do painel tem uma sigla da lista', () => {
    for (const sigla of Object.values(SIGLA_DO_ITEM)) expect(SIGLAS).toContain(sigla)
  })
})

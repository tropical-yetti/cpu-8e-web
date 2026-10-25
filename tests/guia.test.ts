/**
 * Guia de primeiro acesso: cada passo aponta para uma parte que existe na
 * tela e tem texto nos dois idiomas.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PASSOS } from '../src/guia/guia'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

function arquivosVue(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    if (statSync(caminho).isDirectory()) return arquivosVue(caminho)
    return nome.endsWith('.vue') ? [caminho] : []
  })
}

const alvos = new Set(
  arquivosVue(SRC).flatMap((arquivo) =>
    [...readFileSync(arquivo, 'utf8').matchAll(/data-guia="([a-z-]+)"/g)].map((m) => m[1]!),
  ),
)

// Lidas do disco: importadas, passariam pelo plugin do vue-i18n e chegariam compiladas.
function ler(idioma: string) {
  return JSON.parse(readFileSync(join(SRC, 'locales', `${idioma}.json`), 'utf8')) as {
    guia: { passos: Record<string, { titulo: string; texto: string }> }
  }
}

describe('guia de primeiro acesso', () => {
  it('todo passo com alvo aponta para um data-guia que existe', () => {
    for (const { id, alvo } of PASSOS) if (alvo) expect(alvos, id).toContain(alvo)
  })

  it('todo passo tem título e texto nos dois idiomas, e não sobram textos', () => {
    for (const idioma of ['pt-BR', 'en']) {
      const { passos } = ler(idioma).guia
      expect(Object.keys(passos).sort(), idioma).toEqual(PASSOS.map((p) => p.id).sort())
      for (const { id } of PASSOS) {
        expect(passos[id]!.titulo, `${idioma} ${id}`).not.toBe('')
        expect(passos[id]!.texto.length, `${idioma} ${id}`).toBeGreaterThan(40)
      }
    }
  })

  it('começa sem alvo (no centro) e termina no botão de rever o guia', () => {
    expect(PASSOS[0]!.alvo).toBeUndefined()
    expect(PASSOS.at(-1)!.alvo).toBe('rever-guia')
  })
})

/**
 * Licença: todo arquivo do projeto declara a GPL-3.0-or-later, e todo
 * arquivo derivado do simulador original cita a origem e o copyright
 * original (exigências da GPL-3.0, seções 4 e 5a).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const RAIZ = fileURLToPath(new URL('..', import.meta.url))
const PASTAS = ['src', 'tools', 'tests']
const IGNORAR = /\.(png|bin|gz|lfm)$|layout-original\.json$|sem-guia\.json$|\/locales\//

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

const TODOS = PASTAS.flatMap((p) => arquivos(join(RAIZ, p)))
  .map((caminho) => relative(RAIZ, caminho))
  .filter((caminho) => !IGNORAR.test(caminho))

/** Arquivos que vêm de um arquivo do simulador original. */
const DERIVADOS = [
  'src/core/barramentos.ts',
  'src/core/controle.ts',
  'src/core/cpu.ts',
  'src/core/decodificador.ts',
  'src/core/disassembler.ts',
  'src/core/memoria.ts',
  'src/core/opcodes.ts',
  'src/core/tipos.ts',
  'src/core/ula.ts',
  'src/simulador/controlador.ts',
  'src/components/BarraFerramentas.vue',
  'src/components/DiagramaCpu.vue',
  'src/components/TabelaMemoria.vue',
  'src/docs/pt/simulador.md',
  'src/docs/en/simulador.md',
  'src/docs/pt/cpu.md',
  'src/docs/en/cpu.md',
]

describe('licença', () => {
  it('todo arquivo declara SPDX-License-Identifier: GPL-3.0-or-later', () => {
    const semLicenca = TODOS.filter(
      (arquivo) =>
        !readFileSync(join(RAIZ, arquivo), 'utf8').includes(
          'SPDX-License-Identifier: GPL-3.0-or-later',
        ),
    )
    expect(semLicenca).toEqual([])
  })

  it.each(DERIVADOS)('%s cita a origem e o copyright original', (arquivo) => {
    const texto = readFileSync(join(RAIZ, arquivo), 'utf8')
    expect(texto).toMatch(/Derivado de|DERIVADO do|derivadas de/)
    expect(texto).toMatch(/Copyright 2009\/10 Joel Guilherme da Silva Filho/)
  })

  it('o layout gerado do painel guarda o aviso de origem', () => {
    const layout = JSON.parse(readFileSync(join(RAIZ, 'src/painel/layout-original.json'), 'utf8'))
    expect(layout._aviso).toMatch(
      /CPU8E_Panel\.lfm.*Joel Guilherme da Silva Filho.*GPL-3\.0-or-later/,
    )
  })

  it('toda menção ao Prof. Joel leva ao currículo Lattes dele', () => {
    const LATTES = 'lattes.cnpq.br/7746085908957322'
    const arquivosComNome = [
      ...TODOS.filter((arquivo) => !arquivo.startsWith('tests/')),
      ...readdirSync(RAIZ).filter((nome) => nome.endsWith('.md')),
      'src/locales/pt-BR.json',
      'src/locales/en.json',
      'src/painel/layout-original.json',
    ]
    const semLink = arquivosComNome.flatMap((arquivo) => {
      const texto = readFileSync(join(RAIZ, arquivo), 'utf8')
      return [...texto.matchAll(/Joel Guilherme da Silva Filho/g)]
        .filter((m) => !texto.slice(m.index, m.index + m[0].length + 60).includes(LATTES))
        .map((m) => `${arquivo}:${texto.slice(0, m.index).split('\n').length}`)
    })
    expect(semLink).toEqual([])
  })

  it('o repositório traz LICENSE, NOTICE.md e CHANGELOG.md', () => {
    expect(readFileSync(join(RAIZ, 'LICENSE'), 'utf8')).toMatch(
      /GNU GENERAL PUBLIC LICENSE\s+Version 3/,
    )
    expect(readFileSync(join(RAIZ, 'NOTICE.md'), 'utf8')).toMatch(
      /Copyright 2009\/10 Joel Guilherme/,
    )
    expect(readFileSync(join(RAIZ, 'CHANGELOG.md'), 'utf8')).toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})

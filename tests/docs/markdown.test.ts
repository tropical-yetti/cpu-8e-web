/**
 * Conversão do Markdown da documentação e lista de páginas.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { converter } from '../../src/docs/markdown'
import { PAGINAS, ehPagina, textoDaPagina, tituloDaPagina } from '../../src/docs/paginas'

describe('converter', () => {
  it('separa texto, programas e componentes especiais', () => {
    const blocos = converter(
      '# Título\n\nTexto.\n\n```cpu8e\n00: 00  HLT\n```\n\n{{tabela-instrucoes}}\n\nFim.\n\n{{diagrama}}\n',
    )
    expect(blocos.map((b) => b.tipo)).toEqual([
      'html',
      'programa',
      'componente',
      'html',
      'componente',
    ])
    expect(blocos[1]).toEqual({ tipo: 'programa', codigo: '00: 00  HLT' })
    expect(blocos[2]).toEqual({ tipo: 'componente', nome: 'tabela-instrucoes' })
    expect(blocos[4]).toEqual({ tipo: 'componente', nome: 'diagrama' })
  })

  it('usa a âncora explícita {#id} e a remove do título', () => {
    const [bloco] = converter('## Modos de execução {#modos}\n')
    expect(bloco).toEqual({ tipo: 'html', html: '<h2 id="modos">Modos de execução</h2>\n' })
  })

  it('cria a âncora a partir do texto quando não há {#id}', () => {
    const [bloco] = converter('### Ciclo de instrução\n')
    expect(bloco).toEqual({
      tipo: 'html',
      html: '<h3 id="ciclo-de-instrucao">Ciclo de instrução</h3>\n',
    })
  })

  it('põe tabelas numa caixa rolável e focável', () => {
    const [bloco] = converter('| a | b |\n| - | - |\n| 1 | 2 |\n')
    expect(bloco?.tipo === 'html' && bloco.html).toContain(
      '<div class="tabela-rolavel" tabindex="0"><table>',
    )
  })

  it('não interpreta HTML escrito no Markdown', () => {
    const [bloco] = converter('<script>alert(1)</script>\n')
    expect(bloco?.tipo === 'html' && bloco.html).not.toContain('<script>')
  })
})

describe('páginas', () => {
  it('reconhece só as páginas existentes', () => {
    expect(ehPagina('ciclo')).toBe(true)
    expect(ehPagina('inexistente')).toBe(false)
  })

  it('tem título nos dois idiomas, e inglês para outros idiomas', () => {
    for (const pagina of PAGINAS) {
      expect(tituloDaPagina(pagina, 'pt-BR')).not.toBe(pagina)
      expect(tituloDaPagina(pagina, 'en')).not.toBe(pagina)
    }
    expect(tituloDaPagina('ciclo', 'pt-BR')).toBe('Ciclo de instrução')
    expect(tituloDaPagina('ciclo', 'en')).toBe('Instruction cycle')
    expect(textoDaPagina('ciclo', 'es')).toBe(textoDaPagina('ciclo', 'en'))
  })
})

/**
 * Conversão do Markdown da documentação em blocos para a página: trechos de
 * HTML, programas de exemplo e componentes especiais (tabela de instruções,
 * diagrama da CPU).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import MarkdownIt from 'markdown-it'

export type Bloco =
  | { tipo: 'html'; html: string }
  | { tipo: 'programa'; codigo: string }
  | { tipo: 'componente'; nome: 'tabela-instrucoes' | 'diagrama' }

/** "Ciclo de instrução" → "ciclo-de-instrucao" (usado como âncora dos títulos). */
export function ancora(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const md = new MarkdownIt({ html: false, linkify: false, typographer: false })

// Títulos de nível 2 e 3 ganham âncora, para a ajuda contextual apontar para eles.
// "## Modos {#modos}" define a âncora explicitamente (a mesma nos dois idiomas);
// sem isso, a âncora é tirada do próprio texto do título.
const ANCORA_EXPLICITA = /\s*\{#([a-z0-9-]+)\}\s*$/

md.core.ruler.push('ancoras', (estado) => {
  estado.tokens.forEach((token, i) => {
    if (token.type !== 'heading_open' || (token.tag !== 'h2' && token.tag !== 'h3')) return
    const conteudo = estado.tokens[i + 1]
    if (!conteudo) return
    const explicita = ANCORA_EXPLICITA.exec(conteudo.content)
    if (explicita) {
      conteudo.content = conteudo.content.replace(ANCORA_EXPLICITA, '')
      const ultimo = conteudo.children?.at(-1)
      if (ultimo) ultimo.content = ultimo.content.replace(ANCORA_EXPLICITA, '')
    }
    token.attrSet('id', explicita?.[1] ?? ancora(conteudo.content))
  })
})

// Tabelas largas rolam dentro de uma caixa própria, sem alargar a página.
// tabindex permite rolar a tabela pelo teclado.
md.renderer.rules.table_open = () => '<div class="tabela-rolavel" tabindex="0"><table>\n'
md.renderer.rules.table_close = () => '</table></div>\n'

const COMPONENTES = {
  '{{tabela-instrucoes}}': 'tabela-instrucoes',
  '{{diagrama}}': 'diagrama',
} as const

/** Divide o Markdown em blocos, separando programas e componentes especiais. */
export function converter(texto: string): Bloco[] {
  const blocos: Bloco[] = []
  // Separa os blocos ```cpu8e e as linhas {{componente}}; o resto é Markdown comum.
  const partes = texto.split(/(```cpu8e\n[\s\S]*?```|^\{\{[a-z-]+\}\}$)/m)
  for (const parte of partes) {
    if (parte.startsWith('```cpu8e')) {
      blocos.push({ tipo: 'programa', codigo: parte.replace(/^```cpu8e\n|```$/g, '').trimEnd() })
    } else if (parte in COMPONENTES) {
      blocos.push({ tipo: 'componente', nome: COMPONENTES[parte as keyof typeof COMPONENTES] })
    } else if (parte.trim()) {
      blocos.push({ tipo: 'html', html: md.render(parte) })
    }
  }
  return blocos
}

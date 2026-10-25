/**
 * Os programas de exemplo da documentação precisam funcionar: cada bloco
 * ```cpu8e é executado até o HALT e o resultado é comparado com a linha
 * "; espera:" (ou "; expect:") do próprio exemplo.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { carregarPrograma, criarCpu, executar, type Cpu } from '../../src/core'
import { lerPrograma } from '../../src/docs/programas'
import { PAGINAS } from '../../src/docs/paginas'
import { PASSOS } from '../../src/guia/guia'

const PASTA = fileURLToPath(new URL('../../src/docs/', import.meta.url))
const IDIOMAS = ['pt', 'en']

function valorFinal(cpu: Cpu, nome: string): number {
  const memoria = /^M\[([0-9A-F]{2})\]$/.exec(nome)
  if (memoria) return cpu.memoria[Number.parseInt(memoria[1]!, 16)]!
  const registradores: Record<string, number> = {
    ACC: cpu.acc,
    PC: cpu.pc,
    SP: cpu.sp,
    MAR: cpu.mar,
    MDR: cpu.mdr,
    IR: cpu.ir,
    A: cpu.a,
    B: cpu.b,
    Z: Number(cpu.ula.z),
    N: Number(cpu.ula.n),
    C: Number(cpu.ula.c),
  }
  if (!(nome in registradores)) throw new Error(`Registrador desconhecido no exemplo: ${nome}`)
  return registradores[nome]!
}

describe('documentação', () => {
  for (const idioma of IDIOMAS) {
    it(`tem as mesmas páginas em ${idioma}`, () => {
      const arquivos = readdirSync(`${PASTA}${idioma}`).map((f) => f.replace(/\.md$/, ''))
      expect(arquivos.sort()).toEqual([...PAGINAS].sort())
    })

    for (const pagina of PAGINAS) {
      const texto = readFileSync(`${PASTA}${idioma}/${pagina}.md`, 'utf8')
      const exemplos = [...texto.matchAll(/```cpu8e\n([\s\S]*?)```/g)].map((m) => m[1]!)
      exemplos.forEach((codigo, i) => {
        it(`${idioma}/${pagina}: exemplo ${i + 1} dá o resultado anunciado`, () => {
          const { bytes, esperado } = lerPrograma(codigo)
          expect(Object.keys(esperado).length).toBeGreaterThan(0)
          const cpu = criarCpu()
          carregarPrograma(cpu, bytes)
          const execucao = executar(cpu)
          let eventos = 0
          while (!execucao.next().done) {
            if (++eventos > 100_000) throw new Error('O exemplo não chegou ao HALT')
          }
          for (const [nome, valor] of Object.entries(esperado)) {
            expect(valorFinal(cpu, nome), nome).toBe(valor)
          }
        })
      })
    }
  }

  it('os exemplos são iguais nos dois idiomas', () => {
    for (const pagina of PAGINAS) {
      const programas = IDIOMAS.map((idioma) =>
        [
          ...readFileSync(`${PASTA}${idioma}/${pagina}.md`, 'utf8').matchAll(
            /```cpu8e\n([\s\S]*?)```/g,
          ),
        ].map((m) => lerPrograma(m[1]!)),
      )
      expect(programas[1], pagina).toEqual(programas[0])
    }
  })
})

describe('âncoras da documentação', () => {
  /** Âncoras explícitas ({#id}) de uma página. */
  function ancoras(idioma: string, pagina: string): string[] {
    const texto = readFileSync(`${PASTA}${idioma}/${pagina}.md`, 'utf8')
    return [...texto.matchAll(/^#{2,3} .*\{#([a-z0-9-]+)\}$/gm)].map((m) => m[1]!)
  }

  it('são as mesmas nos dois idiomas', () => {
    for (const pagina of PAGINAS)
      expect(ancoras('en', pagina), pagina).toEqual(ancoras('pt', pagina))
  })

  it('existem para os links "Ler mais" do guia e da ajuda "?"', () => {
    for (const { id, doc } of PASSOS) {
      if (!doc) continue
      const [pagina, secao] = doc.split('#')
      expect(PAGINAS, id).toContain(pagina)
      if (secao) expect(ancoras('pt', pagina!), `${id} → ${doc}`).toContain(secao)
    }
  })

  it('existem para os links internos entre páginas', () => {
    for (const idioma of IDIOMAS) {
      for (const pagina of PAGINAS) {
        const texto = readFileSync(`${PASTA}${idioma}/${pagina}.md`, 'utf8')
        for (const [, destino, secao] of texto.matchAll(
          /\]\(#\/documentacao\/([a-z-]+)(?:#([a-z0-9-]+))?\)/g,
        )) {
          expect(PAGINAS, `${idioma}/${pagina}`).toContain(destino)
          if (secao)
            expect(
              ancoras(idioma, destino!),
              `${idioma}/${pagina} → ${destino}#${secao}`,
            ).toContain(secao)
        }
      }
    }
  })
})

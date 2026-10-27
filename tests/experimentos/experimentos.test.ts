/**
 * Experimentos "e se…?" (ADR 0007): cada programa, executado como o aluno
 * faria, passa por todos os passos e chega ao resultado que o texto explica;
 * entrar e sair devolve o simulador exatamente como estava.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  EXPERIMENTOS,
  bytesDoPrograma,
  useExperimentos,
  valor,
  type Experimento,
} from '../../src/experimentos/experimentos'
import { Controlador } from '../../src/simulador/controlador'
import { useSimuladorStore } from '../../src/stores/simulador'

/**
 * Relógio de teste: não espera o tempo do clock, mas devolve a vez ao laço de
 * eventos. Assim o laço sem fim, em execução contínua, não trava o teste.
 */
const relogioInstantaneo = {
  dormir: () => new Promise<void>((r) => setTimeout(r, 0)),
}

async function esperarAssentar(): Promise<void> {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0))
}

/**
 * Executa o experimento como o aluno: aperta Executar (ou Pausar, no laço
 * sem fim, e OK nas mensagens) até cada passo terminar. Devolve o controlador
 * no fim.
 */
async function percorrer(e: Experimento): Promise<Controlador> {
  const c = new Controlador(undefined, relogioInstantaneo)
  c.preparar(bytesDoPrograma(e), e.id, e.modo, e.clock)
  for (const passo of e.passos) {
    for (let i = 0; i < 400 && !passo.concluido!(c.painel); i++) {
      if (c.painel.mensagem && passo.id === 'mensagem') c.fecharMensagem()
      else if (passo.id === 'parar') c.pausar()
      else if (!c.painel.mensagem) void c.executar()
      await esperarAssentar()
    }
    expect(passo.concluido!(c.painel), `${e.id}: passo ${passo.id}`).toBe(true)
  }
  return c
}

const experimento = (id: string) => EXPERIMENTOS.find((e) => e.id === id)!

describe('experimentos "e se…?"', { timeout: 30_000 }, () => {
  it('estouro: 7F + 01 dá 80 com N; FF + 01 dá 00 com Z e C', async () => {
    const c = await percorrer(experimento('estouro'))
    expect(c.cpu.memoria[0x20]).toBe(0x80)
  })

  it('comparação: FE com 02 acende N e C; o JGT não desvia, o JCY desvia', async () => {
    const c = await percorrer(experimento('comparacao'))
    expect(c.cpu.acc).toBe(0x02)
    expect(c.cpu.pc).toBe(0x11)
  })

  it('pilha: a sub-rotina recursiva desce a pilha até o programa', async () => {
    const c = await percorrer(experimento('pilha'))
    expect(c.cpu.sp).toBeLessThan(0x12)
  })

  it('código inválido: o desvio para AA para a CPU com a mensagem', async () => {
    const c = await percorrer(experimento('invalido'))
    expect(c.painel.textos.DI).toBe('DI:XXX')
    expect(c.cpu.controle.s).toBe(3)
  })

  it('laço sem fim: o ACC conta até o aluno pausar', async () => {
    const c = await percorrer(experimento('lacoSemFim'))
    expect(c.painel.status).toBe('pausa')
    c.resetar()
  })

  it('programa que se modifica: ADD 01 vira ADD 07, e o ACC termina em 0E', async () => {
    const c = await percorrer(experimento('automodificacao'))
    expect(c.cpu.memoria[0x05]).toBe(0x07)
  })

  it('salto para o meio dos dados: o operando 02 é executado como NOT', async () => {
    const c = await percorrer(experimento('saltoDados'))
    expect(c.cpu.acc).toBe(0xff)
  })

  it('o primeiro passo não começa concluído (o aluno sempre precisa agir)', () => {
    for (const e of EXPERIMENTOS) {
      const c = new Controlador(undefined, relogioInstantaneo)
      c.preparar(bytesDoPrograma(e), e.id, e.modo, e.clock)
      expect(e.passos[0]!.concluido!(c.painel), e.id).toBe(false)
    }
  })

  it('valor() lê o número de um item do painel', () => {
    const c = new Controlador(undefined, relogioInstantaneo)
    expect(valor(c.painel, 'SP')).toBe(0xff)
    expect(valor(c.painel, 'Z')).toBe(0)
  })
})

describe('textos dos experimentos', () => {
  // Lidas do disco: importadas, passariam pelo plugin do vue-i18n e chegariam compiladas.
  type Item = {
    titulo: string
    resumo: string
    pergunta: string
    passos: Record<string, string>
    resultado: string
    importancia: string
  }
  for (const idioma of ['pt-BR', 'en']) {
    it(`${idioma}: todo experimento tem todos os textos, e todo passo também`, () => {
      const { experimentos } = JSON.parse(
        readFileSync(new URL(`../../src/locales/${idioma}.json`, import.meta.url), 'utf8'),
      ) as { experimentos: { itens: Record<string, Item> } }
      expect(Object.keys(experimentos.itens).sort()).toEqual(EXPERIMENTOS.map((e) => e.id).sort())
      for (const e of EXPERIMENTOS) {
        const item = experimentos.itens[e.id]!
        for (const campo of ['titulo', 'resumo', 'pergunta', 'resultado', 'importancia'] as const)
          expect(item[campo].length, `${e.id}.${campo}`).toBeGreaterThan(10)
        expect(Object.keys(item.passos).sort(), e.id).toEqual(e.passos.map((p) => p.id).sort())
      }
    })
  }
})

describe('entrar e sair de um experimento', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('sair devolve a memória, os registradores, o programa, o modo e o clock', () => {
    const simulador = useSimuladorStore()
    const programa = new Uint8Array(
      readFileSync(new URL('../../src/assets/programas/teste.bin', import.meta.url)),
    )
    simulador.carregar(programa, 'teste.bin')
    simulador.fecharMensagem()
    simulador.mudarModo('continuo')
    simulador.editarMemoria(0x40, '7E')
    const antes = JSON.stringify(simulador.fotografar())
    const painelAntes = { nome: simulador.painel.nomePrograma, modo: simulador.painel.modo }

    const experimentos = useExperimentos()
    experimentos.iniciar('estouro')
    expect(simulador.painel.nomePrograma).toBe('experimento-estouro.bin')
    expect(simulador.painel.modo).toBe('ciclo')
    expect(simulador.memoria[0]!.valor).toBe('91')
    expect(experimentos.momento.value).toEqual({ tipo: 'pergunta' })

    // Trocar de experimento no meio não perde a fotografia do começo.
    experimentos.iniciar('saltoDados')
    experimentos.sair()

    expect(JSON.stringify(simulador.fotografar())).toBe(antes)
    expect({ nome: simulador.painel.nomePrograma, modo: simulador.painel.modo }).toEqual(
      painelAntes,
    )
    expect(simulador.memoria[0x40]!.valor).toBe('7E')
    expect(experimentos.ativo.value).toBe(false)
  })

  it('os momentos: pergunta, passos, resultado e por que isso importa', () => {
    const experimentos = useExperimentos()
    experimentos.iniciar('estouro')
    experimentos.proximo()
    expect(experimentos.momento.value).toMatchObject({ tipo: 'acao', numero: 1 })
    // O passo espera o aluno: "Próximo" não pula.
    experimentos.proximo()
    expect(experimentos.momento.value).toMatchObject({ tipo: 'acao', numero: 1 })
    experimentos.posicao.value = 3
    expect(experimentos.momento.value).toEqual({ tipo: 'resultado' })
    experimentos.proximo()
    expect(experimentos.momento.value).toEqual({ tipo: 'importancia' })
    expect(experimentos.alvo.value).toBeUndefined()
    experimentos.sair()
  })
})

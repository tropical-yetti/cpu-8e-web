/**
 * Testes do controlador: botões, modos de execução e mensagens, com o
 * comportamento do simulador original.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Controlador, emBinario } from '../../src/simulador/controlador'

/** Relógio de teste: não espera nada. */
const relogioInstantaneo = { dormir: () => Promise.resolve() }

/** Deixa as promessas pendentes andarem até a execução parar ou pausar. */
async function esperarAssentar(): Promise<void> {
  for (let i = 0; i < 50; i++) await new Promise((r) => setTimeout(r, 0))
}

const testeBin = new Uint8Array(
  readFileSync(new URL('../../src/assets/programas/teste.bin', import.meta.url)),
)

function novoComPrograma(bytes = testeBin): Controlador {
  const c = new Controlador(undefined, relogioInstantaneo)
  c.carregar(bytes, 'teste.bin')
  c.fecharMensagem()
  return c
}

describe('carregar', () => {
  it('mostra quantos bytes foram lidos e habilita os botões', () => {
    const c = new Controlador(undefined, relogioInstantaneo)
    expect(c.painel.habilitados.executar).toBe(false)
    c.carregar(testeBin, 'teste.bin')
    expect(c.painel.mensagem).toEqual({ chave: 'lidos', bytes: 25 })
    expect(c.painel.habilitados).toEqual({
      executar: true,
      pausar: true,
      parar: true,
      resetar: true,
    })
    expect(c.painel.simbolos.slice(0, 4)).toEqual(['LOD', '[16]', 'CMP', '07'])
    expect(c.painel.textos.DI).toBe('DI:HLT')
  })
})

describe('execução contínua', () => {
  it('roda teste.bin até o HALT e acende o vermelho', async () => {
    const c = novoComPrograma()
    c.mudarModo('continuo')
    await c.mudarClock(100)
    await c.executar()
    expect(c.painel.status).toBe('parada')
    expect(c.cpu.acc).toBe(0xff)
    expect(c.painel.textos.ACC).toBe('ACC:FF')
    expect(c.painel.textos.DI).toBe('DI:HLT')
    expect(c.painel.realcados).toEqual([])
    expect(c.executando).toBe(false)
  })
})

describe('passo a passo', () => {
  it('para em cada pulso de clock com o realce aceso', async () => {
    const c = novoComPrograma()
    void c.executar()
    await esperarAssentar()
    expect(c.painel.status).toBe('pausa')
    expect(c.painel.fase).toBe('busca')
    expect(c.painel.realcados).toEqual(['MAR'])
    expect(c.painel.barramentos).toContain('shPCOut1')

    void c.executar()
    await esperarAssentar()
    expect(c.painel.realcados).toEqual(['MDR'])
    expect(c.painel.textos.MDR).toBe('MDR:D1')
    expect(c.painel.textos.PC).toBe('PC:01')
  })
})

describe('ciclo a ciclo', () => {
  it('executa uma instrução por vez', async () => {
    const c = novoComPrograma()
    c.mudarModo('ciclo')
    void c.executar()
    await esperarAssentar()
    expect(c.painel.status).toBe('pausa')
    expect(c.painel.textos.ACC).toBe('ACC:05') // LOD [16]
    expect(c.painel.realcados).toEqual([])

    void c.executar()
    await esperarAssentar()
    expect(c.painel.textos.DI).toBe('DI:CMP 07')
    expect(c.painel.textos.N).toBe('N:1')
  })
})

describe('parar e reset', () => {
  it('Parar interrompe e só o Reset permite executar de novo', async () => {
    const c = novoComPrograma()
    c.mudarModo('ciclo')
    void c.executar()
    await esperarAssentar()
    c.parar()
    await esperarAssentar()
    expect(c.executando).toBe(false)
    expect(c.painel.status).toBe('parada')
    expect(c.painel.fase).toBeNull()
    expect(c.painel.habilitados.executar).toBe(false)

    c.resetar()
    expect(c.painel.habilitados.executar).toBe(true)
    expect(c.cpu.acc).toBe(0)
    expect(c.painel.textos.ACC).toBe('ACC:00')
    expect(c.cpu.memoria[0]).toBe(0xd1) // a memória continua carregada
  })
})

describe('particularidades do original', () => {
  it('Pausar com a CPU parada faz o próximo Executar não iniciar a execução', async () => {
    const c = novoComPrograma()
    c.mudarModo('continuo')
    await c.mudarClock(100)
    c.pausar()
    await c.executar()
    expect(c.cpu.pc).toBe(0)
    await c.executar()
    expect(c.cpu.acc).toBe(0xff)
  })

  it('Executar sem programa mostra o aviso e deixa o semáforo verde', async () => {
    const c = new Controlador(undefined, relogioInstantaneo)
    await c.executar()
    expect(c.painel.mensagem).toEqual({ chave: 'semPrograma' })
    expect(c.painel.status).toBe('execucao')
  })

  it('código inválido mostra a mensagem e para depois do OK', async () => {
    const c = novoComPrograma(new Uint8Array([0x91, 0x05, 0xaa, 0x00]))
    c.mudarModo('continuo')
    await c.mudarClock(100)
    const execucao = c.executar()
    await esperarAssentar()
    expect(c.painel.mensagem).toEqual({ chave: 'invalido' })
    expect(c.executando).toBe(true)
    c.fecharMensagem()
    await execucao
    expect(c.cpu.controle.s).toBe(3)
    expect(c.painel.status).toBe('parada')
  })
})

describe('edição e utilidades', () => {
  it('editar a memória atualiza o disassembly e habilita os botões', () => {
    const c = new Controlador(undefined, relogioInstantaneo)
    c.editarMemoria(0, '91')
    c.editarMemoria(1, '07')
    expect(c.painel.simbolos.slice(0, 2)).toEqual(['LOD', '07'])
    expect(c.painel.habilitados.executar).toBe(true)
  })

  it('gravar devolve os bytes do programa e confirma', () => {
    const c = novoComPrograma()
    expect(c.gravar()).toHaveLength(25)
    expect(c.painel.mensagem).toEqual({ chave: 'gravados', bytes: 25 })
  })

  it('usa a fórmula de tempo do original', () => {
    expect(Controlador.milissegundosPorPulso(50)).toBe(253)
    expect(Controlador.milissegundosPorPulso(10)).toBe(459)
    expect(Controlador.milissegundosPorPulso(100)).toBe(0)
  })

  it('mostra registradores em binário', () => {
    expect(emBinario(5)).toBe('00000101')
  })
})

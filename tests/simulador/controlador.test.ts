/**
 * Testes do controlador: botões, modos de execução e mensagens, com o
 * comportamento do simulador original e as correções da v1.1.
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

describe('reset', () => {
  it('Reset durante uma pausa interrompe e zera a CPU, mantendo a memória', async () => {
    const c = novoComPrograma()
    c.mudarModo('ciclo')
    void c.executar()
    await esperarAssentar()
    expect(c.painel.status).toBe('pausa')
    c.resetar()
    await esperarAssentar()
    expect(c.executando).toBe(false)
    expect(c.painel.status).toBe('parada')
    expect(c.painel.fase).toBeNull()
    expect(c.painel.habilitados.executar).toBe(true)
    expect(c.cpu.acc).toBe(0)
    expect(c.painel.textos.ACC).toBe('ACC:00')
    expect(c.cpu.memoria[0]).toBe(0xd1) // a memória continua carregada
  })
})

describe('correções da v1.1 no controlador', () => {
  it('item 10: o decodificador começa com DI:NOP', () => {
    expect(new Controlador(undefined, relogioInstantaneo).painel.textos.DI).toBe('DI:NOP')
  })

  it('item 11: Pausar com a CPU parada não tem efeito', async () => {
    const c = novoComPrograma()
    c.mudarModo('continuo')
    await c.mudarClock(100)
    c.pausar()
    expect(c.painel.status).toBe('parada')
    await c.executar()
    expect(c.cpu.acc).toBe(0xff)
    expect(c.painel.status).toBe('parada')
  })

  it('item 12: Executar sem programa mostra o aviso e deixa o semáforo vermelho', async () => {
    const c = new Controlador(undefined, relogioInstantaneo)
    await c.executar()
    expect(c.painel.mensagem).toEqual({ chave: 'semPrograma' })
    expect(c.painel.status).toBe('parada')
  })

  /** Programa que nunca termina (LOD 05; JMP [00]), num relógio que cede a vez ao navegador. */
  function emLacoInfinito(): Controlador {
    const c = new Controlador(undefined, { dormir: () => new Promise((r) => setTimeout(r, 0)) })
    c.carregar(new Uint8Array([0x91, 0x05, 0xc4, 0x00]), 'laco.bin')
    c.fecharMensagem()
    c.mudarModo('continuo')
    return c
  }

  it('item 13: Reset interrompe a execução contínua', async () => {
    const c = emLacoInfinito()
    await c.mudarClock(50)
    const execucao = c.executar()
    await esperarAssentar()
    expect(c.executando).toBe(true)
    c.resetar()
    await execucao
    expect(c.executando).toBe(false)
    expect(c.painel.status).toBe('parada')
    expect(c.cpu.pc).toBe(0)
    expect(c.cpu.acc).toBe(0)
  })

  it('item 13: Carregar interrompe a execução contínua e não roda o programa novo', async () => {
    const c = emLacoInfinito()
    await c.mudarClock(50)
    const execucao = c.executar()
    await esperarAssentar()
    expect(c.executando).toBe(true)
    c.carregar(new Uint8Array([0x91, 0x07, 0x00]), 'outro.bin')
    c.fecharMensagem()
    await execucao
    expect(c.executando).toBe(false)
    expect(c.cpu.pc).toBe(0)
    expect(c.cpu.acc).toBe(0)
    expect(c.painel.nomePrograma).toBe('outro.bin')
  })

  it('item 7: pausa com mensagem quando a pilha alcança o programa', async () => {
    // Recursão sem fim: CAL [00] chama a si mesmo e a pilha desce de FF até
    // chegar ao programa. O programa ocupa 00–FD (o resto é preenchido com NOP).
    const programa = new Uint8Array(0xfe).fill(0x01)
    programa.set([0xc9, 0x00])
    const c = novoComPrograma(programa)
    c.mudarModo('continuo')
    await c.mudarClock(100)
    const execucao = c.executar()
    await esperarAssentar()
    expect(c.painel.mensagem).toEqual({ chave: 'colisaoPilha', endereco: 0xfd })
    c.fecharMensagem()
    await esperarAssentar()
    expect(c.painel.status).toBe('pausa')
    expect(c.executando).toBe(true)
    c.resetar()
    await execucao
  })

  it('item 7: uma chamada normal não dispara o aviso da pilha', async () => {
    // CAL [04]; HLT; NOP; RET
    const c = novoComPrograma(new Uint8Array([0xc9, 0x04, 0x00, 0x01, 0x03]))
    c.mudarModo('continuo')
    await c.mudarClock(100)
    await c.executar()
    expect(c.painel.mensagem).toBeNull()
    expect(c.painel.status).toBe('parada')
  })

  it('item 15: não existe mais o botão Parar', () => {
    const c = new Controlador(undefined, relogioInstantaneo)
    expect('parar' in c).toBe(false)
    expect(Object.keys(c.painel.habilitados)).toEqual(['executar', 'pausar', 'resetar'])
  })
})

describe('particularidades do original', () => {
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
    expect(c.editarMemoria(0, '91')).toBe(true)
    expect(c.editarMemoria(1, '07')).toBe(true)
    expect(c.editarMemoria(2, 'xyz')).toBe(false) // v1.1: recusado, nada muda
    expect(c.cpu.tamanhoPrograma).toBe(2)
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

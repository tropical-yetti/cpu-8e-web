/**
 * Testes do decodificador, do disassembler, da memória e do reset.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import {
  INSTRUCOES,
  bytesParaGravar,
  carregarPrograma,
  criarCpu,
  decodificar,
  desmontar,
  editarMemoria,
  executar,
  resetarCpu,
  type Cpu,
} from '../../src/core'

/** Executa a CPU até ela parar, ignorando os eventos. */
function executarAteParar(cpu: Cpu): void {
  const execucao = executar(cpu)
  while (!execucao.next().done) {
    // nada a fazer com cada evento
  }
}

describe('decodificador', () => {
  it('reconhece os 35 códigos válidos da tabela', () => {
    const validos = Array.from({ length: 256 }, (_, codigo) => codigo).filter(
      (codigo) => decodificar(codigo).mnemonico !== 'XXX',
    )
    const daTabela = INSTRUCOES.flatMap((i) => Object.values(i.codigos))
    expect(validos.sort((x, y) => x - y)).toEqual(daTabela.sort((x, y) => x - y))
    expect(validos).toHaveLength(35)
  })

  it('tira DW e ED dos bits 7 e 6', () => {
    expect(decodificar(0x02)).toEqual({ mnemonico: 'NOT', dw: false, ed: false })
    expect(decodificar(0x91)).toEqual({ mnemonico: 'LOD', dw: true, ed: false })
    expect(decodificar(0xd1)).toEqual({ mnemonico: 'LOD', dw: true, ed: true })
  })

  it('marca códigos desconhecidos como XXX, sem operando', () => {
    expect(decodificar(0xaa)).toEqual({ mnemonico: 'XXX', dw: false, ed: false })
  })
})

describe('disassembler', () => {
  it('mostra mnemônicos e operandos como a tabela do original', () => {
    const memoria = new Uint8Array(256)
    memoria.set([0xd1, 0x16, 0x94, 0x07, 0x02, 0x00])
    const linhas = desmontar(memoria, 6)
    expect(linhas.slice(0, 7)).toEqual(['LOD', '[16]', 'CMP', '07', 'NOT', 'HLT', ''])
  })

  it('não mostra nada além do tamanho do programa', () => {
    expect(desmontar(new Uint8Array(256), 0).every((linha) => linha === '')).toBe(true)
  })

  it('item 8 (v1.1): bytes que a execução não alcança aparecem como dados (DB)', () => {
    // LOD [06]; ADD [07]; HLT; (sobra) ; 05 ; 07
    const memoria = new Uint8Array(256)
    memoria.set([0xd1, 0x06, 0xd5, 0x07, 0x00, 0x00, 0x05, 0xaa])
    expect(desmontar(memoria, 8).slice(0, 8)).toEqual([
      'LOD',
      '[06]',
      'ADD',
      '[07]',
      'HLT',
      'DB 00',
      'DB 05',
      'DB AA', // no original, AA aparecia como XXX
    ])
  })

  it('item 8 (v1.1): segue os desvios e não desalinha o código depois dos dados', () => {
    // JMP [04]; dado 91 (pareceria um LOD de 2 bytes); dado 00; LOD 07; HLT
    const memoria = new Uint8Array(256)
    memoria.set([0xc4, 0x04, 0x91, 0x00, 0x91, 0x07, 0x00])
    expect(desmontar(memoria, 7).slice(0, 7)).toEqual([
      'JMP',
      '[04]',
      'DB 91',
      'DB 00',
      'LOD',
      '07',
      'HLT',
    ])
  })

  it('item 8 (v1.1): desvios condicionais e CAL seguem os dois caminhos', () => {
    // JEQ [05]; HLT; dado; dado; CAL [08]; HLT; ... ; RET em 08
    const memoria = new Uint8Array(256)
    memoria.set([0xc5, 0x05, 0x00, 0x33, 0x44, 0xc9, 0x08, 0x00, 0x03])
    expect(desmontar(memoria, 9).slice(0, 9)).toEqual([
      'JEQ',
      '[05]',
      'HLT',
      'DB 33',
      'DB 44',
      'CAL',
      '[08]',
      'HLT',
      'RET',
    ])
  })
})

describe('memória', () => {
  it('carregar zera a memória e registra o tamanho', () => {
    const cpu = criarCpu()
    cpu.memoria.fill(0xee)
    expect(carregarPrograma(cpu, new Uint8Array([1, 2, 3]))).toBe(3)
    expect(Array.from(cpu.memoria.slice(0, 4))).toEqual([1, 2, 3, 0])
    expect(cpu.tamanhoPrograma).toBe(3)
  })

  it('carregar ignora o que passar de 256 bytes', () => {
    const cpu = criarCpu()
    expect(carregarPrograma(cpu, new Uint8Array(300).fill(7))).toBe(256)
  })

  it('item 4 (v1.1): gravar salva até o último byte não nulo, inclusive dados do STO', () => {
    const cpu = criarCpu()
    carregarPrograma(cpu, new Uint8Array([0x91, 0x05, 0xd0, 0x80, 0x00]))
    executarAteParar(cpu) // o STO grava em 80h, fora do programa
    expect(cpu.memoria[0x80]).toBe(0x05)
    const bytes = bytesParaGravar(cpu)
    expect(bytes).toHaveLength(0x81)
    expect(bytes[0x80]).toBe(0x05)
  })

  it('item 4 (v1.1): gravar nunca corta o programa, mesmo se ele termina em zeros', () => {
    const cpu = criarCpu()
    carregarPrograma(cpu, new Uint8Array([0x91, 0x05, 0x00, 0x00]))
    expect(bytesParaGravar(cpu)).toHaveLength(4)
  })

  it('item 4 (v1.1): a pilha perto de FF também é gravada', () => {
    const cpu = criarCpu()
    // CAL [04]; HLT; 00; RET  →  o retorno (02) é empilhado em FF
    carregarPrograma(cpu, new Uint8Array([0xc9, 0x04, 0x00, 0x00, 0x03]))
    executarAteParar(cpu)
    expect(cpu.memoria[0xff]).toBe(0x02)
    expect(bytesParaGravar(cpu)).toHaveLength(256)
  })

  it('item 5 (v1.1): edição aceita só hexadecimal de 00 a FF e recusa o resto', () => {
    const cpu = criarCpu()
    expect(editarMemoria(cpu, 0x12, 'a5')).toBe(0xa5)
    expect(editarMemoria(cpu, 0x13, ' 7 ')).toBe(0x07)
    for (const invalido of ['zz', '1ff', '', '-1', '0x5', 'g']) {
      expect(editarMemoria(cpu, 0x10, invalido)).toBeNull()
    }
    expect(cpu.memoria[0x10]).toBe(0)
    expect(cpu.tamanhoPrograma).toBe(0x14)
  })
})

describe('reset', () => {
  it('zera registradores, mantém a memória e põe SP em FFh', () => {
    const cpu = criarCpu()
    carregarPrograma(cpu, new Uint8Array([0x91, 0x07, 0x00]))
    executarAteParar(cpu)
    expect(cpu.acc).toBe(7)
    resetarCpu(cpu)
    expect(cpu).toMatchObject({ acc: 0, pc: 0, sp: 0xff, controle: { s: 0, t: 0 } })
    expect(cpu.memoria[1]).toBe(0x07)
  })
})

describe('correções da v1.1 no núcleo', () => {
  /** Carrega um programa, executa até parar e devolve a CPU e os eventos. */
  function rodar(bytes: number[]) {
    const cpu = criarCpu()
    carregarPrograma(cpu, Uint8Array.from(bytes))
    const eventos = [...executar(cpu)]
    return { cpu, eventos }
  }

  /** Pulsos de clock da fase de execução da instrução de número `instrucao` (a partir de 0). */
  function pulsosDaExecucao(bytes: number[], instrucao: number) {
    const { eventos } = rodar(bytes)
    const fimDe = eventos.flatMap((e, i) => (e.tipo === 'fimInstrucao' ? [i] : []))
    const inicio = instrucao === 0 ? 0 : fimDe[instrucao - 1]! + 1
    const trecho = eventos.slice(inicio, fimDe[instrucao])
    const execucao = trecho.findIndex((e) => e.tipo === 'fase' && e.fase === 'execucao')
    return trecho.slice(execucao).filter((e) => e.tipo === 'pulso')
  }

  it('item 1: deslocamento com contador 00 mantém ACC e flags', () => {
    // LOD 05; CMP 07 (ULA = FE, N = 1, C = 0); SHL 00; HLT
    const { cpu } = rodar([0x91, 0x05, 0x94, 0x07, 0x8a, 0x00, 0x00])
    expect(cpu.acc).toBe(0x05)
    expect(cpu.ula).toMatchObject({ valor: 0xfe, n: true, c: false })
  })

  it('item 3: STO escreve na memória uma única vez (2 pulsos na execução)', () => {
    const pulsos = pulsosDaExecucao([0x91, 0x2a, 0xd0, 0x20, 0x00], 1)
    expect(pulsos).toHaveLength(2)
    expect(
      pulsos.filter((p) => p.tipo === 'pulso' && p.barramentos.includes('shWR1')),
    ).toHaveLength(1)
  })

  it('item 14: no NOT, ACC → A aparece antes do cálculo da ULA', () => {
    const pulsos = pulsosDaExecucao([0x91, 0x0f, 0x02, 0x00], 1)
    const itens = pulsos.map((p) => (p.tipo === 'pulso' ? p.destaques.map((d) => d.item) : []))
    expect(itens[0]).toEqual(['A'])
    expect(itens[1]).toContain('ULA')
    expect(itens[2]).toEqual(['ACC'])
  })
})

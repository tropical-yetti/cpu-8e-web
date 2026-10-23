/**
 * Testes por instrução (ADR 0003): cada caso parte de um estado conhecido,
 * executa uma única instrução e confere o estado depois — memória inteira,
 * ACC, PC, SP, flags e a saída da ULA. Juntos, os casos passam pelos 35
 * códigos válidos (23 instruções) e pelos casos de borda.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { INSTRUCOES, carregarPrograma, criarCpu, executar, type Cpu } from '../../src/core'
import {
  MNEMONICOS_USADOS,
  RESULTADOS_ESPERADOS,
  TODAS_INSTRUCOES,
} from '../fixtures/todas-instrucoes'

/** O que um caso prepara antes de executar. */
interface Antes {
  acc?: number
  sp?: number
  z?: boolean
  n?: boolean
  c?: boolean
  /** Bytes extras na memória, além do programa: endereço → valor. */
  memoria?: Record<number, number>
}

/** O que se espera depois. Campos omitidos não podem ter mudado. */
interface Depois {
  acc?: number
  pc?: number
  sp?: number
  z?: boolean
  n?: boolean
  c?: boolean
  /** Saída da ULA (só para instruções que passam por ela). */
  ula?: number
  /** Bytes que mudaram na memória: endereço → valor. */
  memoria?: Record<number, number>
  /** A CPU parou (HLT ou código inválido). */
  parada?: boolean
}

interface Caso {
  nome: string
  programa: number[]
  antes?: Antes
  depois: Depois
}

/** Prepara a CPU, executa uma instrução e devolve a CPU e os eventos. */
function executarUma(caso: Caso): { cpu: Cpu; eventos: string[] } {
  const cpu = criarCpu()
  carregarPrograma(cpu, Uint8Array.from(caso.programa))
  const antes = caso.antes ?? {}
  for (const [endereco, valor] of Object.entries(antes.memoria ?? {})) {
    cpu.memoria[Number(endereco)] = valor
  }
  cpu.acc = antes.acc ?? 0
  cpu.sp = antes.sp ?? 0xff
  cpu.ula.z = antes.z ?? false
  cpu.ula.n = antes.n ?? false
  cpu.ula.c = antes.c ?? false

  const eventos: string[] = []
  for (const evento of executar(cpu)) {
    eventos.push(evento.tipo)
    if (evento.tipo === 'fimInstrucao' || evento.tipo === 'halt') break
  }
  return { cpu, eventos }
}

/** Confere o estado depois, inclusive o que não deveria ter mudado. */
function conferir(caso: Caso): void {
  const antes = caso.antes ?? {}
  const memoriaAntes = new Uint8Array(256)
  memoriaAntes.set(caso.programa)
  for (const [endereco, valor] of Object.entries(antes.memoria ?? {})) {
    memoriaAntes[Number(endereco)] = valor
  }

  const { cpu } = executarUma(caso)
  const d = caso.depois
  const comprimento =
    INSTRUCOES.some((i) => i.codigos.imediato === caso.programa[0]) ||
    INSTRUCOES.some((i) => i.codigos.direto === caso.programa[0])
      ? 2
      : 1

  expect(cpu.acc, 'ACC').toBe(d.acc ?? antes.acc ?? 0)
  expect(cpu.pc, 'PC').toBe(d.pc ?? comprimento)
  expect(cpu.sp, 'SP').toBe(d.sp ?? antes.sp ?? 0xff)
  expect(cpu.ula.z, 'Z').toBe(d.z ?? antes.z ?? false)
  expect(cpu.ula.n, 'N').toBe(d.n ?? antes.n ?? false)
  expect(cpu.ula.c, 'C').toBe(d.c ?? antes.c ?? false)
  if (d.ula !== undefined) expect(cpu.ula.valor, 'saída da ULA').toBe(d.ula)
  expect(cpu.controle.s === 3, 'CPU parada').toBe(d.parada ?? false)

  const memoriaDepois = memoriaAntes.slice()
  for (const [endereco, valor] of Object.entries(d.memoria ?? {})) {
    memoriaDepois[Number(endereco)] = valor
  }
  expect(Array.from(cpu.memoria), 'memória').toEqual(Array.from(memoriaDepois))
}

// Dados que os casos em modo direto leem do endereço 20.
const EM_20 = (valor: number) => ({ memoria: { 0x20: valor } })

// prettier-ignore
const CASOS: Caso[] = [
  // --- controle -----------------------------------------------------------
  { nome: 'HLT para a CPU', programa: [0x00], depois: { parada: true } },
  { nome: 'NOP não muda nada', programa: [0x01], depois: {} },
  { nome: 'código inválido para a CPU', programa: [0xaa], depois: { parada: true } },

  // --- desvios -------------------------------------------------------------
  { nome: 'JMP desvia sempre', programa: [0xc4, 0x20], depois: { pc: 0x20 } },
  { nome: 'JEQ desvia com Z = 1', programa: [0xc5, 0x20], antes: { z: true }, depois: { pc: 0x20 } },
  { nome: 'JEQ segue com Z = 0', programa: [0xc5, 0x20], depois: {} },
  { nome: 'JGT desvia com Z = 0 e N = 0', programa: [0xc6, 0x20], depois: { pc: 0x20 } },
  { nome: 'JGT segue com N = 1', programa: [0xc6, 0x20], antes: { n: true }, depois: {} },
  { nome: 'JGT segue com Z = 1', programa: [0xc6, 0x20], antes: { z: true }, depois: {} },
  { nome: 'JGE desvia com N = 0', programa: [0xc7, 0x20], antes: { z: true }, depois: { pc: 0x20 } },
  { nome: 'JGE segue com N = 1', programa: [0xc7, 0x20], antes: { n: true }, depois: {} },
  { nome: 'JCY desvia com C = 1', programa: [0xc8, 0x20], antes: { c: true }, depois: { pc: 0x20 } },
  { nome: 'JCY segue com C = 0', programa: [0xc8, 0x20], depois: {} },

  // --- pilha ---------------------------------------------------------------
  {
    nome: 'CAL empilha o retorno em M[SP], desce o SP e desvia',
    programa: [0xc9, 0x20],
    depois: { pc: 0x20, sp: 0xfe, memoria: { 0xff: 0x02 } },
  },
  {
    nome: 'RET sobe o SP e volta ao endereço empilhado',
    programa: [0x03],
    antes: { sp: 0xfe, memoria: { 0xff: 0x10 } },
    depois: { pc: 0x10, sp: 0xff },
  },
  {
    nome: 'CAL com a pilha dentro do programa sobrescreve o código (sem proteção na CPU)',
    programa: [0xc9, 0x20, 0x01, 0x01],
    antes: { sp: 0x03 },
    depois: { pc: 0x20, sp: 0x02, memoria: { 0x03: 0x02 } },
  },

  // --- memória -------------------------------------------------------------
  {
    nome: 'STO grava o ACC no endereço e não mexe nas flags',
    programa: [0xd0, 0x20],
    antes: { acc: 0x5a, z: true, c: true },
    depois: { memoria: { 0x20: 0x5a } },
  },
  { nome: 'LOD imediato', programa: [0x91, 0x05], antes: { c: true }, depois: { acc: 0x05, c: false, ula: 0x05 } },
  { nome: 'LOD de 00 liga Z', programa: [0x91, 0x00], antes: { acc: 0x33 }, depois: { acc: 0x00, z: true, ula: 0x00 } },
  { nome: 'LOD de 80 liga N', programa: [0x91, 0x80], depois: { acc: 0x80, n: true, ula: 0x80 } },
  { nome: 'LOD direto', programa: [0xd1, 0x20], antes: EM_20(0x7f), depois: { acc: 0x7f, ula: 0x7f } },

  // --- aritmética ----------------------------------------------------------
  { nome: 'ADD imediato', programa: [0x95, 0x02], antes: { acc: 0x05 }, depois: { acc: 0x07, ula: 0x07 } },
  { nome: 'ADD com estouro de 8 bits liga C', programa: [0x95, 0xfc], antes: { acc: 0x05 }, depois: { acc: 0x01, c: true, ula: 0x01 } },
  { nome: 'ADD com estouro com sinal (7F + 01) liga N, não C', programa: [0x95, 0x01], antes: { acc: 0x7f }, depois: { acc: 0x80, n: true, ula: 0x80 } },
  { nome: 'ADD que dá 00 com estouro liga Z e C', programa: [0x95, 0x01], antes: { acc: 0xff }, depois: { acc: 0x00, z: true, c: true, ula: 0x00 } },
  { nome: 'ADD direto', programa: [0xd5, 0x20], antes: { acc: 0x10, ...EM_20(0x22) }, depois: { acc: 0x32, ula: 0x32 } },
  { nome: 'SUB sem empréstimo liga C', programa: [0x96, 0x01], antes: { acc: 0x05 }, depois: { acc: 0x04, c: true, ula: 0x04 } },
  { nome: 'SUB com empréstimo: C = 0 e N = 1', programa: [0x96, 0x02], antes: { acc: 0x01 }, depois: { acc: 0xff, n: true, ula: 0xff } },
  { nome: 'SUB de 00 sempre tem C = 1', programa: [0x96, 0x00], antes: { acc: 0x00 }, depois: { acc: 0x00, z: true, c: true, ula: 0x00 } },
  { nome: 'SUB direto', programa: [0xd6, 0x20], antes: { acc: 0x30, ...EM_20(0x10) }, depois: { acc: 0x20, c: true, ula: 0x20 } },
  { nome: 'CMP menor: N = 1, C = 0, ACC não muda', programa: [0x94, 0x07], antes: { acc: 0x05 }, depois: { n: true, ula: 0xfe } },
  { nome: 'CMP igual: Z = 1, C = 1', programa: [0x94, 0x05], antes: { acc: 0x05 }, depois: { z: true, c: true, ula: 0x00 } },
  { nome: 'CMP direto, maior: C = 1', programa: [0xd4, 0x20], antes: { acc: 0x09, ...EM_20(0x03) }, depois: { c: true, ula: 0x06 } },

  // --- lógica --------------------------------------------------------------
  { nome: 'NOT', programa: [0x02], antes: { acc: 0x0f }, depois: { acc: 0xf0, n: true, ula: 0xf0 } },
  { nome: 'NOT de FF liga Z', programa: [0x02], antes: { acc: 0xff }, depois: { acc: 0x00, z: true, ula: 0x00 } },
  { nome: 'AND imediato', programa: [0x9a, 0x0f], antes: { acc: 0x3c, c: true }, depois: { acc: 0x0c, c: false, ula: 0x0c } },
  { nome: 'AND direto', programa: [0xda, 0x20], antes: { acc: 0xf0, ...EM_20(0x0f) }, depois: { acc: 0x00, z: true, ula: 0x00 } },
  { nome: 'XOR imediato', programa: [0x9b, 0xff], antes: { acc: 0x3c }, depois: { acc: 0xc3, n: true, ula: 0xc3 } },
  { nome: 'XOR direto consigo mesmo dá 00', programa: [0xdb, 0x20], antes: { acc: 0x5a, ...EM_20(0x5a) }, depois: { acc: 0x00, z: true, ula: 0x00 } },
  { nome: 'ORL imediato', programa: [0x9c, 0x0f], antes: { acc: 0x30 }, depois: { acc: 0x3f, ula: 0x3f } },
  { nome: 'ORL direto', programa: [0xdc, 0x20], antes: { acc: 0x80, ...EM_20(0x01) }, depois: { acc: 0x81, n: true, ula: 0x81 } },

  // --- deslocamentos e rotações (o operando é o número de repetições) -----
  { nome: 'SHL 1: o bit 7 vai para o C', programa: [0x8a, 0x01], antes: { acc: 0x81 }, depois: { acc: 0x02, c: true, ula: 0x02 } },
  { nome: 'SHR 1: o bit 0 vai para o C', programa: [0x8b, 0x01], antes: { acc: 0x81 }, depois: { acc: 0x40, c: true, ula: 0x40 } },
  { nome: 'SRA 1 repete o bit de sinal', programa: [0x8c, 0x01], antes: { acc: 0x81 }, depois: { acc: 0xc0, n: true, c: true, ula: 0xc0 } },
  { nome: 'ROL 1: o bit 7 volta no bit 0 e vai para o C', programa: [0x8d, 0x01], antes: { acc: 0x81 }, depois: { acc: 0x03, c: true, ula: 0x03 } },
  { nome: 'ROR 1: o bit 0 volta no bit 7 e vai para o C', programa: [0x8e, 0x01], antes: { acc: 0x81 }, depois: { acc: 0xc0, n: true, c: true, ula: 0xc0 } },
  { nome: 'SHL 3', programa: [0x8a, 0x03], antes: { acc: 0x11 }, depois: { acc: 0x88, n: true, ula: 0x88 } },
  { nome: 'SHL 9 (mais que 8) zera o ACC; o último bit que sai é 0', programa: [0x8a, 0x09], antes: { acc: 0xff }, depois: { acc: 0x00, z: true, ula: 0x00 } },
  { nome: 'ROL 8 dá a volta completa', programa: [0x8d, 0x08], antes: { acc: 0x81 }, depois: { acc: 0x81, n: true, c: true, ula: 0x81 } },
  { nome: 'SHL 00 não muda o ACC nem as flags', programa: [0x8a, 0x00], antes: { acc: 0x81, z: true, c: true }, depois: {} },
  { nome: 'ROR 00 não muda o ACC nem as flags', programa: [0x8e, 0x00], antes: { acc: 0x81, n: true }, depois: {} },
  { nome: 'SHL direto', programa: [0xca, 0x20], antes: { acc: 0x01, ...EM_20(0x02) }, depois: { acc: 0x04, ula: 0x04 } },
  { nome: 'SHR direto', programa: [0xcb, 0x20], antes: { acc: 0x80, ...EM_20(0x07) }, depois: { acc: 0x01, ula: 0x01 } },
  { nome: 'SRA direto', programa: [0xcc, 0x20], antes: { acc: 0x80, ...EM_20(0x07) }, depois: { acc: 0xff, n: true, ula: 0xff } },
  { nome: 'ROL direto', programa: [0xcd, 0x20], antes: { acc: 0x80, ...EM_20(0x01) }, depois: { acc: 0x01, c: true, ula: 0x01 } },
  { nome: 'ROR direto', programa: [0xce, 0x20], antes: { acc: 0x01, ...EM_20(0x01) }, depois: { acc: 0x80, n: true, c: true, ula: 0x80 } },
]

describe('instruções, estado antes e depois', () => {
  it.each(CASOS.map((caso) => [caso.nome, caso] as const))('%s', (_nome, caso) => {
    conferir(caso)
  })

  it('os casos passam pelos 35 códigos válidos', () => {
    const testados = new Set(CASOS.map((caso) => caso.programa[0]))
    const validos = INSTRUCOES.flatMap((i) => Object.values(i.codigos))
    expect(validos).toHaveLength(35)
    expect(validos.filter((codigo) => !testados.has(codigo))).toEqual([])
  })

  it('código inválido avisa e para', () => {
    const { eventos } = executarUma({ nome: '', programa: [0xaa], depois: {} })
    expect(eventos).toContain('invalido')
  })
})

describe('programa "todas as instruções"', () => {
  it('passa pelas 23 instruções', () => {
    const usadas = new Set(MNEMONICOS_USADOS)
    expect(INSTRUCOES.map((i) => i.mnemonico).filter((m) => !usadas.has(m))).toEqual([])
  })

  it('termina no HLT com os resultados certos na memória e nos registradores', () => {
    const cpu = criarCpu()
    carregarPrograma(cpu, TODAS_INSTRUCOES)
    let pulsos = 0
    for (const evento of executar(cpu)) {
      if (evento.tipo === 'invalido') throw new Error('código inválido executado')
      if (evento.tipo === 'pulso' && ++pulsos > 2000) throw new Error('não terminou')
    }
    expect(Array.from(cpu.memoria.slice(0x80, 0x90))).toEqual(RESULTADOS_ESPERADOS)
    expect(cpu.memoria[0xff], 'retorno empilhado pelo CAL').toBe(0x5b)
    expect(cpu.acc).toBe(0x42)
    expect(cpu.pc).toBe(0x61)
    expect(cpu.sp).toBe(0xff)
    expect(cpu.ula).toMatchObject({ z: false, n: false, c: false })
    expect(cpu.controle.s).toBe(3)
  })
})

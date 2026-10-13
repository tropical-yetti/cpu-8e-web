/**
 * Converte a execução do núcleo TypeScript no mesmo formato de rastro (JSON
 * por linha) produzido por tools/referencia/cpu8e_ref.pas, para que os dois
 * possam ser comparados linha a linha.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { carregarPrograma, criarCpu, executar, hex2, type Cpu } from '../../src/core'

/** Hash FNV-1a de 32 bits da memória (o mesmo do gerador em Pascal). */
function hashMemoria(memoria: Uint8Array): number {
  let h = 2166136261
  for (const byte of memoria) {
    h ^= byte
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function estado(cpu: Cpu, completo: boolean) {
  return {
    acc: cpu.acc,
    pc: cpu.pc,
    mar: cpu.mar,
    mdr: cpu.mdr,
    a: cpu.a,
    b: cpu.b,
    sp: cpu.sp,
    ula: cpu.ula.valor,
    z: Number(cpu.ula.z),
    n: Number(cpu.ula.n),
    c: Number(cpu.ula.c),
    ir: cpu.ir,
    s: cpu.controle.s,
    memHash: hashMemoria(cpu.memoria),
    mem: completo ? Array.from(cpu.memoria, hex2).join('') : '',
  }
}

/**
 * Executa um programa e devolve o rastro como lista de objetos.
 * `maxEventos` deve ser o mesmo usado ao gerar o gabarito.
 */
export function rastrear(bytes: Uint8Array, maxEventos = 5000): unknown[] {
  const cpu = criarCpu()
  carregarPrograma(cpu, bytes)
  const linhas: unknown[] = []
  const emitir = (linha: unknown): boolean => {
    linhas.push(linha)
    return linhas.length >= maxEventos
  }

  for (const evento of executar(cpu)) {
    let limite = false
    switch (evento.tipo) {
      case 'fase':
        limite = emitir({ t: 'fase', fase: evento.fase })
        break
      case 'valor':
        limite = emitir({ t: 'valor', item: evento.item, v: evento.valor })
        break
      case 'foco':
        limite = emitir({ t: 'mem', foco: evento.endereco })
        break
      case 'pulso':
        limite = emitir({
          t: 'pulso',
          itens: evento.destaques.map((d) => [d.item, d.valor]),
          bus: [...evento.barramentos],
          est: estado(cpu, false),
        })
        break
      case 'fimInstrucao':
        limite = emitir({ t: 'fimInstrucao' })
        break
      case 'invalido':
        limite = emitir({ t: 'invalido' })
        break
      case 'halt':
        emitir({ t: 'halt', est: estado(cpu, true) })
        return linhas
    }
    if (limite) {
      linhas.push({ t: 'limite', est: estado(cpu, true) })
      return linhas
    }
  }
  return linhas
}

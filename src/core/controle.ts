/**
 * Unidade de controle da CPU-8E.
 *
 * Executa o ciclo de instrução — busca, operando, execução — como uma
 * sequência de micro-operações. Cada micro-operação que corresponde a um
 * pulso de clock é EMITIDA como evento (`yield`) para quem estiver
 * executando a CPU: a interface (que anima o painel e controla a
 * velocidade) ou os testes (que comparam com o simulador original).
 *
 * Por que geradores (`function*`)? O original pausava a CPU no meio de uma
 * instrução com um laço de espera (Sleep + ProcessMessages). Um gerador pode
 * ser "congelado" em qualquer `yield` e retomado depois, sem travar a página
 * e sem perder o ponto em que estava.
 *
 * A ordem das operações e dos eventos segue CPU8E_Control.pas linha a linha,
 * INCLUSIVE os defeitos conhecidos (fidelidade total na v1.0). Esses
 * defeitos estão marcados com "FIEL AO ORIGINAL".
 *
 * Derivado de CPU8E_Control.pas, CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript; PulseClock, SetValue,
 * SetPhase e ShowMem passaram a emitir eventos em vez de desenhar na tela.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CAMINHOS, type SegmentoBarramento } from './barramentos'
import type { Cpu } from './cpu'
import { decodificar } from './decodificador'
import { hex2, textoDoItem } from './formatacao'
import { operarUla, type OperacaoUla } from './ula'
import type { Byte, Destaque, Evento, Fase, ItemPainel } from './tipos'

/** Gerador de eventos da CPU. */
export type Execucao = Generator<Evento, void, void>

// ---------------------------------------------------------------------------
// Eventos (equivalentes às rotinas de tela do original)
// ---------------------------------------------------------------------------

/** Um item realçado num pulso, com o valor formatado como no painel. */
function destaque(item: ItemPainel, valor: Byte): Destaque {
  return { item, valor: textoDoItem(item, valor) }
}

/**
 * Pulso de clock (PulseClock no original): realça itens e barramentos.
 * Realçar o PC também move a seleção da memória para o PC (Flash no original).
 */
function* pulso(
  cpu: Cpu,
  destaques: Destaque[],
  barramentos: readonly SegmentoBarramento[],
): Execucao {
  if (destaques.some((d) => d.item === 'PC')) {
    yield { tipo: 'foco', endereco: cpu.pc }
  }
  yield { tipo: 'pulso', destaques, barramentos }
  cpu.controle.t++
}

/** Atualiza o texto de um item sem realçá-lo (SetValue no original). */
function valor(item: ItemPainel, v: Byte): Evento {
  return { tipo: 'valor', item, valor: textoDoItem(item, v) }
}

/** Move a seleção da tabela de memória (ShowMem no original). */
function foco(endereco: Byte): Evento {
  return { tipo: 'foco', endereco }
}

function fase(f: Fase): Evento {
  return { tipo: 'fase', fase: f }
}

// ---------------------------------------------------------------------------
// Micro-operações reutilizadas
// ---------------------------------------------------------------------------

/** PC → MAR: o endereço da próxima leitura vai para a memória. */
function* pcParaMar(cpu: Cpu): Execucao {
  cpu.mar = cpu.pc
  yield* pulso(cpu, [destaque('MAR', cpu.mar)], CAMINHOS.PC_PARA_MAR)
}

/** M[MAR] → MDR: leitura da memória. */
function* memoriaParaMdr(cpu: Cpu): Execucao {
  cpu.mdr = cpu.memoria[cpu.mar]!
  yield* pulso(cpu, [destaque('MDR', cpu.mdr)], CAMINHOS.MEMORIA_PARA_MDR)
}

/** MDR → M[MAR]: escrita na memória. */
function* mdrParaMemoria(cpu: Cpu): Execucao {
  cpu.memoria[cpu.mar] = cpu.mdr
  yield* pulso(cpu, [], CAMINHOS.MDR_PARA_MEMORIA)
  yield foco(cpu.mar)
}

/** MAR → PC: desvio para o endereço do operando. */
function* marParaPc(cpu: Cpu): Execucao {
  cpu.pc = cpu.mar
  yield* pulso(cpu, [destaque('PC', cpu.pc)], CAMINHOS.MAR_PARA_PC)
}

/** ACC → A (entrada da ULA). */
function* accParaA(cpu: Cpu): Execucao {
  cpu.a = cpu.acc
  yield* pulso(cpu, [destaque('A', cpu.a)], CAMINHOS.ACC_PARA_A)
}

/** MDR → B (entrada da ULA). */
function* mdrParaB(cpu: Cpu): Execucao {
  cpu.b = cpu.mdr
  yield* pulso(cpu, [destaque('B', cpu.b)], CAMINHOS.MDR_PARA_B)
}

/** Saída da ULA → ACC. */
function* ulaParaAcc(cpu: Cpu): Execucao {
  cpu.acc = cpu.ula.valor
  yield* pulso(cpu, [destaque('ACC', cpu.acc)], CAMINHOS.ULA_PARA_ACC)
}

/**
 * A ULA calcula o resultado de A e B; as flags são atualizadas e o
 * resultado aparece na saída da ULA (ProcessULA no original).
 */
function* processarUla(cpu: Cpu, operacao: OperacaoUla): Execucao {
  cpu.ula = operarUla(operacao, cpu.a, cpu.b)
  const { z, n, c } = cpu.ula
  yield valor('Z', Number(z))
  yield valor('N', Number(n))
  yield valor('C', Number(c))
  yield* pulso(
    cpu,
    [
      destaque('Z', Number(z)),
      destaque('N', Number(n)),
      destaque('C', Number(c)),
      destaque('ULA', cpu.ula.valor),
    ],
    [...CAMINHOS.FLAG_Z, ...CAMINHOS.FLAG_N, ...CAMINHOS.FLAG_C],
  )
}

// ---------------------------------------------------------------------------
// Fase 1: busca da instrução
// ---------------------------------------------------------------------------

function* buscarInstrucao(cpu: Cpu): Execucao {
  yield fase('busca')
  yield* pcParaMar(cpu)
  cpu.pc = (cpu.pc + 1) & 0xff
  yield valor('PC', cpu.pc)
  yield* memoriaParaMdr(cpu)

  cpu.ir = cpu.mdr
  yield* pulso(cpu, [destaque('IR', cpu.ir)], CAMINHOS.MDR_PARA_IR)

  const instrucao = decodificar(cpu.ir)
  cpu.opcode = instrucao.mnemonico
  cpu.dw = instrucao.dw
  cpu.ed = instrucao.ed

  // O decodificador (DI) mostra a instrução; nas de 2 bytes, já espia o operando.
  const textoDi = cpu.opcode + textoDoOperando(cpu)
  yield { tipo: 'valor', item: 'DI', valor: textoDi }
  yield* pulso(cpu, [{ item: 'DI', valor: textoDi }], CAMINHOS.IR_PARA_UC)

  cpu.controle.s = cpu.dw ? 1 : 2
  cpu.controle.t = 0

  if (cpu.opcode === 'XXX') {
    yield { tipo: 'invalido' }
    cpu.opcode = 'HLT'
    cpu.controle.s = 3
  }
}

/** "[16]" para endereço direto, " 05" para imediato, "" sem operando. */
function textoDoOperando(cpu: Cpu): string {
  if (!cpu.dw) return ''
  const operando = hex2(cpu.memoria[cpu.pc]!)
  return cpu.ed ? `[${operando}]` : ` ${operando}`
}

// ---------------------------------------------------------------------------
// Fase 2: busca do operando (só instruções de 2 bytes)
// ---------------------------------------------------------------------------

function* buscarOperando(cpu: Cpu): Execucao {
  yield fase('operando')
  if (cpu.dw) {
    // O PC aponta para o segundo byte da instrução.
    yield* pcParaMar(cpu)
    cpu.pc = (cpu.pc + 1) & 0xff
    yield valor('PC', cpu.pc)
    if (cpu.ed) {
      // Endereçamento direto: o byte lido é o endereço do dado.
      yield* memoriaParaMdr(cpu)
      cpu.mar = cpu.mdr
      yield* pulso(cpu, [destaque('MAR', cpu.mar)], CAMINHOS.MDR_PARA_MAR)
    }
    // Imediato: o MAR fica apontando para o próprio operando.
  }
  cpu.controle.s = 2
  cpu.controle.t = 0
}

// ---------------------------------------------------------------------------
// Fase 3: execução
// ---------------------------------------------------------------------------

function* executarInstrucao(cpu: Cpu): Execucao {
  yield fase('execucao')

  switch (cpu.opcode) {
    case 'HLT':
      cpu.controle.s = 3
      yield* pulso(cpu, [], CAMINHOS.NENHUM)
      break

    case 'NOP':
      yield* pulso(cpu, [], CAMINHOS.NENHUM)
      break

    case 'NOT':
      cpu.a = cpu.acc
      // FIEL AO ORIGINAL: a ULA calcula antes de o pulso mostrar ACC → A.
      yield* processarUla(cpu, 'NOT')
      yield* pulso(cpu, [destaque('A', cpu.a)], CAMINHOS.ACC_PARA_A)
      yield* ulaParaAcc(cpu)
      break

    case 'JMP':
      yield* marParaPc(cpu)
      break
    case 'JEQ':
      if (cpu.ula.z) yield* marParaPc(cpu)
      break
    case 'JGT':
      if (!(cpu.ula.z || cpu.ula.n)) yield* marParaPc(cpu)
      break
    case 'JGE':
      if (!cpu.ula.n) yield* marParaPc(cpu)
      break
    case 'JCY':
      if (cpu.ula.c) yield* marParaPc(cpu)
      break

    case 'STO':
      cpu.mdr = cpu.acc
      yield* pulso(cpu, [destaque('MDR', cpu.mdr)], CAMINHOS.ACC_PARA_MDR)
      yield* mdrParaMemoria(cpu)
      yield foco(cpu.mar)
      // FIEL AO ORIGINAL: a escrita na memória é animada uma segunda vez.
      yield* pulso(cpu, [], CAMINHOS.MDR_PARA_MEMORIA)
      yield foco(cpu.pc)
      break

    case 'LOD':
      yield* memoriaParaMdr(cpu)
      cpu.a = cpu.mdr
      yield* pulso(cpu, [destaque('A', cpu.a)], CAMINHOS.MDR_PARA_A)
      yield* processarUla(cpu, 'LOD')
      // O valor vai para o ACC a partir de A (que é igual à saída da ULA).
      cpu.acc = cpu.a
      yield* pulso(cpu, [destaque('ACC', cpu.acc)], CAMINHOS.ULA_PARA_ACC)
      break

    case 'CMP':
      yield* memoriaParaMdr(cpu)
      yield* accParaA(cpu)
      yield* mdrParaB(cpu)
      // Só as flags interessam; o ACC não muda.
      yield* processarUla(cpu, 'CMP')
      break

    case 'ADD':
    case 'SUB':
    case 'AND':
    case 'XOR':
    case 'ORL':
      yield* memoriaParaMdr(cpu)
      yield* accParaA(cpu)
      yield* mdrParaB(cpu)
      yield* processarUla(cpu, cpu.opcode)
      yield* ulaParaAcc(cpu)
      break

    case 'CAL':
      // Guarda o endereço de retorno, desvia e empilha o retorno.
      cpu.mdr = cpu.pc
      yield* pulso(cpu, [destaque('MDR', cpu.mdr)], CAMINHOS.PC_PARA_MDR)
      cpu.pc = cpu.mar
      yield* pulso(cpu, [destaque('PC', cpu.pc)], CAMINHOS.MAR_PARA_PC)
      cpu.mar = cpu.sp
      yield* pulso(cpu, [destaque('MAR', cpu.mar)], CAMINHOS.SP_PARA_MAR)
      yield* mdrParaMemoria(cpu)
      // FIEL AO ORIGINAL: a pilha não tem proteção; pode sobrescrever o programa.
      cpu.sp = (cpu.sp - 1) & 0xff
      yield valor('SP', cpu.sp)
      break

    case 'RET':
      cpu.sp = (cpu.sp + 1) & 0xff
      yield valor('SP', cpu.sp)
      cpu.mar = cpu.sp
      yield* pulso(cpu, [destaque('MAR', cpu.mar)], CAMINHOS.SP_PARA_MAR)
      yield* memoriaParaMdr(cpu)
      cpu.pc = cpu.mdr
      yield* pulso(cpu, [destaque('PC', cpu.pc)], CAMINHOS.MDR_PARA_PC)
      break

    case 'SHL':
    case 'SHR':
    case 'SRA':
    case 'ROL':
    case 'ROR':
      yield* deslocar(cpu, cpu.opcode)
      break

    case 'XXX':
      // Nunca chega aqui: códigos inválidos param a CPU na busca.
      break
  }

  if (cpu.controle.s < 3) cpu.controle.s = 0
  cpu.controle.t = 0
  yield foco(cpu.pc)
  yield { tipo: 'fimInstrucao' }
}

/** Deslocamentos e rotações: B conta quantas vezes a operação é repetida. */
function* deslocar(cpu: Cpu, operacao: 'SHL' | 'SHR' | 'SRA' | 'ROL' | 'ROR'): Execucao {
  yield* memoriaParaMdr(cpu)
  yield* mdrParaB(cpu)
  yield* accParaA(cpu)
  while (cpu.b > 0) {
    yield* processarUla(cpu, operacao)
    cpu.a = cpu.ula.valor
    cpu.b = (cpu.b - 1) & 0xff
    yield valor('B', cpu.b)
    yield* pulso(cpu, [destaque('A', cpu.a)], CAMINHOS.ULA_PARA_A)
  }
  // FIEL AO ORIGINAL: com contador 0 o laço não roda e o ACC recebe a saída
  // anterior da ULA (de outra instrução). Correção prevista para a v1.1.
  yield* ulaParaAcc(cpu)
}

// ---------------------------------------------------------------------------
// Laço principal
// ---------------------------------------------------------------------------

/**
 * Um passo da unidade de controle (RunStep no original): executa a fase
 * indicada por `cpu.controle.s` — busca, operando ou execução — e para.
 * No estado 3 (parada), só emite `halt`.
 */
export function* passo(cpu: Cpu): Execucao {
  switch (cpu.controle.s) {
    case 0:
      yield foco(cpu.pc)
      yield* buscarInstrucao(cpu)
      break
    case 1:
      yield* buscarOperando(cpu)
      break
    case 2:
      yield* executarInstrucao(cpu)
      break
    case 3:
      yield { tipo: 'halt' }
      break
  }
}

/**
 * Executa a CPU a partir do estado atual até parar (HALT ou código inválido).
 *
 * Cada chamada a `next()` avança até o próximo evento. Para pausar, basta
 * parar de chamar `next()`; para continuar, chamar de novo. Para recomeçar,
 * resetar a CPU e criar outra execução.
 */
export function* executar(cpu: Cpu): Execucao {
  for (;;) {
    const parada = cpu.controle.s === 3
    yield* passo(cpu)
    if (parada) return
  }
}

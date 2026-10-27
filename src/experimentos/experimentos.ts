/**
 * Experimentos "e se…?" guiados (ADR 0007).
 *
 * Cada experimento é descrito como dados: um programa curto, o modo e o
 * clock, e os passos. Os textos ficam nas mensagens, em
 * `experimentos.itens.<id>`. Todo experimento segue quatro momentos:
 *
 * 1. a **pergunta** (o que você acha que vai acontecer?);
 * 2. os passos de **ação**, cada um com uma parte da tela em destaque; um
 *    passo termina sozinho quando `concluido` fica verdadeiro;
 * 3. o **resultado**, com a explicação;
 * 4. **por que isso importa**: o risco de segurança daquele comportamento
 *    num computador de verdade e como as CPUs e os sistemas de hoje se
 *    protegem dele.
 *
 * Antes de preparar, o simulador é fotografado; sair do experimento devolve
 * tudo como estava.
 *
 * Copiado do MEM-8E Web (src/experimentos/experimentos.ts) em 2026-10-26 (ADR 0004).
 * Modificado: os experimentos são programas da CPU-8E, os passos olham o
 * painel, e há o momento "por que isso importa".
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { computed, ref, shallowRef } from 'vue'
import type { ItemPainel } from '@/core'
import type { Fotografia, Modo, Painel } from '@/simulador/controlador'
import { useSimuladorStore } from '@/stores/simulador'

export type IdExperimento =
  'estouro' | 'comparacao' | 'pilha' | 'invalido' | 'lacoSemFim' | 'automodificacao' | 'saltoDados'

export interface PassoExperimento {
  /** Chave do texto: `experimentos.itens.<experimento>.passos.<id>`. */
  id: string
  /** Valor do `data-guia` da parte da tela em destaque. */
  alvo?: string
  /** O passo termina sozinho quando isto fica verdadeiro. Sem isto, avança pelo botão. */
  concluido?: (painel: Painel) => boolean
}

export interface Experimento {
  id: IdExperimento
  /** O programa: endereço e bytes de cada trecho (o resto da memória fica em 00). */
  programa: readonly (readonly [endereco: number, bytes: readonly number[]])[]
  modo: Modo
  clock: number
  /** Os passos de ação, entre a pergunta e o resultado. */
  passos: readonly PassoExperimento[]
  /** Parte da tela em destaque no resultado. */
  alvoResultado?: string
}

/** Valor de um item do painel: "ACC:7F" → 0x7F; "N:1" → 1. */
export function valor(painel: Painel, item: ItemPainel): number {
  return Number.parseInt(painel.textos[item].split(':')[1] ?? '', 16)
}

/**
 * A CPU executou o HLT (o decodificador mostra HLT e o PC já passou dele). O
 * DI também mostra HLT logo depois de carregar, mas aí o PC está em 00.
 */
const executouHlt = (p: Painel) => p.textos.DI === 'DI:HLT' && valor(p, 'PC') !== 0

export const EXPERIMENTOS: readonly Experimento[] = [
  {
    id: 'estouro',
    // 7F + 01 = 80 (N acende: o "positivo" virou negativo); FF + 01 = 00 (Z e C).
    programa: [
      [0x00, [0x91, 0x7f]], // LOD 7F
      [0x02, [0x95, 0x01]], // ADD 01
      [0x04, [0xd0, 0x20]], // STO [20]
      [0x06, [0x91, 0xff]], // LOD FF
      [0x08, [0x95, 0x01]], // ADD 01
      [0x0a, [0xd0, 0x21]], // STO [21]
      [0x0c, [0x00]], // HLT
    ],
    modo: 'ciclo',
    clock: 60,
    passos: [
      {
        id: 'primeiraSoma',
        alvo: 'ula',
        concluido: (p) => valor(p, 'ACC') === 0x80 && valor(p, 'N') === 1,
      },
      {
        id: 'segundaSoma',
        alvo: 'ula',
        concluido: (p) => valor(p, 'ACC') === 0x00 && valor(p, 'Z') === 1 && valor(p, 'C') === 1,
      },
    ],
    alvoResultado: 'ula',
  },
  {
    id: 'comparacao',
    // FE − 02 = FC: N = 1 (com sinal, −2 < 2) e C = 1 (sem sinal, 254 ≥ 2).
    programa: [
      [0x00, [0x91, 0xfe]], // LOD FE
      [0x02, [0x94, 0x02]], // CMP 02
      [0x04, [0xc6, 0x0a]], // JGT [0A]
      [0x06, [0xc8, 0x0e]], // JCY [0E]
      [0x08, [0x00]], // HLT
      [0x0a, [0x91, 0x01]], // LOD 01 (se o JGT desviasse)
      [0x0c, [0x00]], // HLT
      [0x0e, [0x91, 0x02]], // LOD 02 (o JCY desvia)
      [0x10, [0x00]], // HLT
    ],
    modo: 'ciclo',
    clock: 60,
    passos: [
      {
        id: 'comparar',
        alvo: 'ula',
        concluido: (p) => valor(p, 'PC') === 0x04 && valor(p, 'C') === 1,
      },
      {
        id: 'desvios',
        alvo: 'memoria',
        concluido: (p) => executouHlt(p) && valor(p, 'ACC') === 0x02,
      },
    ],
    alvoResultado: 'memoria',
  },
  {
    id: 'pilha',
    // Uma sub-rotina que chama a si mesma: cada CAL desce a pilha, até ela chegar ao código.
    programa: [
      [0x00, [0xc9, 0x10]], // CAL [10]
      [0x02, [0x00]], // HLT
      [0x10, [0xc9, 0x10]], // CAL [10]
    ],
    modo: 'continuo',
    clock: 100,
    passos: [
      { id: 'executar', alvo: 'memoria', concluido: (p) => p.mensagem?.chave === 'colisaoPilha' },
      { id: 'mensagem', alvo: 'memoria', concluido: (p) => p.mensagem === null },
    ],
    alvoResultado: 'memoria',
  },
  {
    id: 'invalido',
    // O JMP desvia para AA, que não é uma instrução da CPU-8E.
    programa: [
      [0x00, [0x91, 0x05]], // LOD 05
      [0x02, [0xc4, 0x06]], // JMP [06]
      [0x04, [0x00]], // HLT
      [0x06, [0xaa]], // dado AA
    ],
    modo: 'ciclo',
    clock: 60,
    passos: [
      { id: 'executar', alvo: 'painel', concluido: (p) => p.mensagem?.chave === 'invalido' },
      {
        id: 'mensagem',
        alvo: 'status',
        concluido: (p) => p.mensagem === null && p.textos.DI === 'DI:XXX',
      },
    ],
    alvoResultado: 'status',
  },
  {
    id: 'lacoSemFim',
    // O JMP volta sempre para o ADD: o ACC conta sem parar.
    programa: [
      [0x00, [0x91, 0x01]], // LOD 01
      [0x02, [0x95, 0x01]], // ADD 01
      [0x04, [0xc4, 0x02]], // JMP [02]
    ],
    modo: 'continuo',
    clock: 90,
    passos: [
      { id: 'executar', alvo: 'painel', concluido: (p) => valor(p, 'ACC') >= 0x08 },
      {
        id: 'parar',
        alvo: 'barra',
        concluido: (p) => p.status === 'pausa' || (p.status === 'parada' && valor(p, 'ACC') === 0),
      },
    ],
    alvoResultado: 'barra',
  },
  {
    id: 'automodificacao',
    // O STO grava 07 em 05, o operando do ADD: ADD 01 vira ADD 07 antes de ser executado.
    programa: [
      [0x00, [0x91, 0x07]], // LOD 07
      [0x02, [0xd0, 0x05]], // STO [05]
      [0x04, [0x95, 0x01]], // ADD 01
      [0x06, [0x00]], // HLT
    ],
    modo: 'ciclo',
    clock: 60,
    passos: [
      {
        id: 'gravar',
        alvo: 'memoria',
        concluido: (p) => valor(p, 'PC') === 0x04 && valor(p, 'MDR') === 0x07,
      },
      {
        id: 'somar',
        alvo: 'painel',
        concluido: (p) => executouHlt(p) && valor(p, 'ACC') === 0x0e,
      },
    ],
    alvoResultado: 'memoria',
  },
  {
    id: 'saltoDados',
    // O JMP cai em 03, o operando do LOD: o byte 02 é executado como NOT.
    programa: [
      [0x00, [0xc4, 0x03]], // JMP [03]
      [0x02, [0x91, 0x02]], // LOD 02
      [0x04, [0x00]], // HLT
    ],
    modo: 'ciclo',
    clock: 60,
    passos: [
      { id: 'saltar', alvo: 'memoria', concluido: (p) => valor(p, 'PC') === 0x03 },
      {
        id: 'executar',
        alvo: 'painel',
        concluido: (p) => executouHlt(p) && valor(p, 'ACC') === 0xff,
      },
    ],
    alvoResultado: 'memoria',
  },
]

/** Os bytes do programa de um experimento, de 00 até o último usado. */
export function bytesDoPrograma(experimento: Experimento): Uint8Array {
  const memoria = new Uint8Array(256)
  let fim = 0
  for (const [endereco, bytes] of experimento.programa) {
    memoria.set(bytes, endereco)
    fim = Math.max(fim, endereco + bytes.length)
  }
  return memoria.slice(0, fim)
}

/** Um momento do experimento: a pergunta, um passo de ação, o resultado ou a conclusão. */
export type Momento =
  | { tipo: 'pergunta' }
  | { tipo: 'acao'; passo: PassoExperimento; numero: number }
  | { tipo: 'resultado' }
  | { tipo: 'importancia' }

const atual = shallowRef<Experimento | null>(null)
/** 0 é a pergunta; de 1 a n, os passos; n + 1, o resultado; n + 2, por que isso importa. */
const posicao = ref(0)
let foto: Fotografia | null = null
/** Elemento que tinha o foco quando o experimento começou. */
let focoAnterior: HTMLElement | null = null

export function useExperimentos() {
  const simulador = useSimuladorStore()

  const momento = computed<Momento | null>(() => {
    const e = atual.value
    if (!e) return null
    if (posicao.value === 0) return { tipo: 'pergunta' }
    if (posicao.value === e.passos.length + 1) return { tipo: 'resultado' }
    if (posicao.value > e.passos.length + 1) return { tipo: 'importancia' }
    return { tipo: 'acao', passo: e.passos[posicao.value - 1]!, numero: posicao.value }
  })

  const alvo = computed(() => {
    const m = momento.value
    if (!m || m.tipo === 'pergunta' || m.tipo === 'importancia') return undefined
    return m.tipo === 'acao' ? m.passo.alvo : atual.value?.alvoResultado
  })

  /** O passo atual só termina quando o usuário fizer o que ele pede. */
  const esperandoAcao = computed(() => {
    const m = momento.value
    return m?.tipo === 'acao' && m.passo.concluido !== undefined
  })

  /** Avança quando o painel chega ao que o passo pede. O balão chama isto a cada mudança. */
  function conferir() {
    const m = momento.value
    if (m?.tipo === 'acao' && m.passo.concluido?.(simulador.painel)) {
      posicao.value++
      conferir()
    }
  }

  function iniciar(id: IdExperimento) {
    const experimento = EXPERIMENTOS.find((e) => e.id === id)!
    if (!atual.value) {
      foto = simulador.fotografar()
      // Sem navegador (nos testes), não há foco a devolver.
      focoAnterior =
        typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    }
    simulador.preparar(
      bytesDoPrograma(experimento),
      `experimento-${experimento.id}.bin`,
      experimento.modo,
      experimento.clock,
    )
    atual.value = experimento
    posicao.value = 0
  }

  /** Começa de novo o mesmo experimento, da pergunta. */
  function repetir() {
    if (atual.value) iniciar(atual.value.id)
  }

  function proximo() {
    const e = atual.value
    if (!e || posicao.value > e.passos.length + 1 || esperandoAcao.value) return
    posicao.value++
    conferir()
  }

  /** Sai do experimento e devolve o simulador ao estado de antes. */
  function sair() {
    if (!atual.value) return
    if (foto) simulador.restaurar(foto)
    foto = null
    atual.value = null
    posicao.value = 0
    focoAnterior?.focus()
    focoAnterior = null
  }

  return {
    atual,
    ativo: computed(() => atual.value !== null),
    momento,
    alvo,
    posicao,
    esperandoAcao,
    iniciar,
    repetir,
    proximo,
    sair,
    conferir,
  }
}

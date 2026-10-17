/**
 * Store do simulador: expõe o painel (reativo) e os comandos para os
 * componentes Vue. Toda a lógica fica no Controlador; esta store só faz a
 * ponte com a reatividade do Vue.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { defineStore } from 'pinia'
import { computed, markRaw, reactive } from 'vue'
import { hex2, type Byte, type ItemPainel } from '@/core'
import { Controlador, criarPainel, emBinario, type Modo } from '@/simulador/controlador'

/** Registradores que mostram o valor em binário quando pressionados. */
const VALOR_DO_REGISTRADOR: Partial<Record<ItemPainel, (c: Controlador) => Byte>> = {
  ACC: (c) => c.cpu.acc,
  A: (c) => c.cpu.a,
  B: (c) => c.cpu.b,
  IR: (c) => c.cpu.ir,
  MAR: (c) => c.cpu.mar,
  MDR: (c) => c.cpu.mdr,
  PC: (c) => c.cpu.pc,
  SP: (c) => c.cpu.sp,
  ULA: (c) => c.cpu.ula.valor,
}

export const useSimuladorStore = defineStore('simulador', () => {
  const painel = reactive(criarPainel())
  // O controlador e a CPU não precisam ser reativos: quem a interface observa é o painel.
  const controlador = markRaw(new Controlador(painel))

  /** Linhas da tabela de memória; recalculadas quando a memória muda. */
  const memoria = computed(() => {
    void painel.versaoMemoria
    return Array.from(controlador.cpu.memoria, (valor, endereco) => ({
      endereco: hex2(endereco),
      valor: hex2(valor),
      simbolo: painel.simbolos[endereco] ?? '',
    }))
  })

  /** Texto "ACC=00000101" ao pressionar um registrador, ou null se não se aplica. */
  function valorBinario(item: ItemPainel): string | null {
    const ler = VALOR_DO_REGISTRADOR[item]
    return ler ? `${item}=${emBinario(ler(controlador))}` : null
  }

  return {
    painel,
    memoria,
    valorBinario,
    executar: () => controlador.executar(),
    pausar: () => controlador.pausar(),
    resetar: () => controlador.resetar(),
    carregar: (bytes: Uint8Array, nome: string) => controlador.carregar(bytes, nome),
    gravar: () => controlador.gravar(),
    editarMemoria: (endereco: Byte, texto: string) => controlador.editarMemoria(endereco, texto),
    mudarModo: (modo: Modo) => controlador.mudarModo(modo),
    mudarClock: (valor: number) => controlador.mudarClock(valor),
    fecharMensagem: () => controlador.fecharMensagem(),
  }
})

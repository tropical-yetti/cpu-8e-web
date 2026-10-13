/**
 * Caminhos de dados (barramentos) da CPU-8E.
 *
 * Cada caminho é a lista de segmentos desenhados no painel que acendem quando
 * um dado passa de um componente para outro. Os nomes dos segmentos são os
 * mesmos dos componentes `TShape` do formulário original (CPU8E_Panel.lfm),
 * o que permite reaproveitar as coordenadas do desenho.
 *
 * Derivado de CPU8E_Control.pas (CPU-8E v2.2.3)
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: listas de segmentos agrupadas em caminhos nomeados.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Barramento interno (BI): liga registradores e ULA. */
const BI = ['shBI1', 'shBI2', 'shBI3'] as const

/** Barramento de endereços externo (BE): leva o endereço do MAR à memória. */
const BE = ['shMAROut3', 'shMAROut4', 'shBE1', 'shBE2'] as const

/** Barramento de dados externo (BD): liga o MDR à memória. */
const BD = ['shBD1', 'shBD2'] as const

export const CAMINHOS = {
  /** Endereço da próxima instrução vai para o MAR (e para a memória). */
  PC_PARA_MAR: ['shPCOut1', 'shPCOut2', ...BI, 'shMARIn1', 'shMARIn2', ...BE],
  /** Leitura: o byte endereçado pelo MAR é copiado para o MDR. */
  MEMORIA_PARA_MDR: ['shRD1', 'shRD2', 'shMDRIn3', 'shMDRIn4', ...BD],
  /** Escrita: o MDR é gravado na posição endereçada pelo MAR. */
  MDR_PARA_MEMORIA: ['shMDROut3', 'shMDROut4', ...BD, 'shWR1', 'shWR2'],
  MDR_PARA_IR: ['shMDROut1', 'shMDROut2', ...BI, 'shIRIn1', 'shIRIn2'],
  /** O código no IR é enviado ao decodificador e à unidade de controle. */
  IR_PARA_UC: [
    'shIROut1',
    'shIROut2',
    'shIROut3',
    'shIROut4',
    'shIROut5',
    'shIROut6',
    'shIROut7',
    'shIROut8',
    'shIROut9',
    'shIROut10',
    'shIROut11',
    'shIROut12',
    'shIROut13',
    'shIROut14',
    'shIROut15',
    'shIROut16',
    'shUCIn1',
    'shUCIn2',
    'shUCIn3',
    'shUCIn4',
    'shUCIn5',
    'shUCIn6',
  ],
  /** Endereçamento direto: o operando lido vira o novo endereço no MAR. */
  MDR_PARA_MAR: ['shMDROut1', 'shMDROut2', ...BI, 'shMARIn1', 'shMARIn2', ...BE],
  /** Desvio: o endereço de destino (no MAR) vai para o PC. */
  MAR_PARA_PC: ['shMAROut1', 'shMAROut2', ...BI, 'shPCIn1', 'shPCIn2'],
  ACC_PARA_A: ['shACCOut1', 'shACCOut2', ...BI, 'shAIn1', 'shAIn2'],
  ACC_PARA_MDR: ['shACCOut1', 'shACCOut2', ...BI, 'shMDRIn1', 'shMDRIn2'],
  MDR_PARA_A: ['shMDROut1', 'shMDROut2', ...BI, 'shAIn1', 'shAIn2'],
  MDR_PARA_B: ['shMDROut1', 'shMDROut2', ...BI, 'shBIn1', 'shBIn2'],
  MDR_PARA_PC: ['shMDROut1', 'shMDROut2', ...BI, 'shPCIn1', 'shPCIn2'],
  ULA_PARA_ACC: ['shULAOut1', 'shULAOut2', ...BI, 'shACCIn1', 'shACCIn2'],
  ULA_PARA_A: ['shULAOut1', 'shULAOut2', ...BI, 'shAIn1', 'shAIn2'],
  /** CAL: o endereço de retorno (PC) é guardado no MDR. */
  PC_PARA_MDR: ['shPCOut1', 'shPCOut2', ...BI, 'shMDRIn1', 'shMDRIn2'],
  /** CAL/RET: o topo da pilha (SP) é usado como endereço. */
  SP_PARA_MAR: ['shSPOut1', 'shSPOut2', ...BI, 'shMARIn1', 'shMARIn2'],
  /** Saídas das flags da ULA. */
  FLAG_Z: ['shZOut1', 'shZOut2', 'shZOut3', 'shZOut4', 'shZOut5', 'shZOut6'],
  FLAG_N: ['shNOut1', 'shNOut2', 'shNOut3', 'shNOut4'],
  FLAG_C: ['shCOut1', 'shCOut2', 'shCOut3', 'shCOut4'],
  NENHUM: [],
} as const

/** Nome de qualquer segmento de barramento desenhado no painel. */
export type SegmentoBarramento = (typeof CAMINHOS)[keyof typeof CAMINHOS][number]

/**
 * Traduções para o inglês das dicas (hints) do painel original. As dicas em
 * português vêm do próprio formulário original (layout-original.json).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const DICAS_EM_INGLES: Record<string, string> = {
  'Unidade Lógica e Aritmética': 'Arithmetic Logic Unit',
  'Barramento de Controle': 'Control bus',
  'Barramento Interno': 'Internal bus',
  'Sinal de Leitura': 'Read signal',
  'Sinal de Escrita': 'Write signal',
  'Barramento de Endereços': 'Address bus',
  'Barramento de Dados': 'Data bus',
  'Unidade de Controle': 'Control unit',
  'Program Counter\nContém o endereço da próxima instrução':
    'Program Counter\nHolds the address of the next instruction',
  'Memory Data Register\nRegistrador de Dados a serem lidos ou escritos na memória':
    'Memory Data Register\nHolds the data read from or written to memory',
  'Memory Address Register\nRegistrador de Endereçamento de Memória':
    'Memory Address Register\nHolds the memory address being accessed',
  'Instruction Register: Registrador de Instruções\nArmazena o OpCode da instrução em execução':
    'Instruction Register\nHolds the opcode of the instruction being executed',
  'Bit de status "Z"\nIndica que a última operação deu resultado zero':
    'Status bit "Z"\nThe last operation resulted in zero',
  'Bit de status "N"\nIndica que a última operação deu resultado negativo':
    'Status bit "N"\nThe last operation resulted in a negative number',
  'Bit de status "C"\nIndica que ocorreu um carry (vai-um)\ndo bit mais significativo':
    'Status bit "C"\nA carry out of the most significant bit occurred',
  'Velocidade do Clock': 'Clock speed',
  'Stack Pointer\nPonteiro De Pilha': 'Stack Pointer',
  'Registrador temporário para \no 2o. operando da ULA':
    'Temporary register for\nthe 2nd ALU operand',
  'Registrador temporário para \no 1o. operando da ULA,\ncorresponde ao ACC':
    'Temporary register for\nthe 1st ALU operand,\nmatches ACC',
  'Memória principal com 256 bytes': 'Main memory with 256 bytes',
  'Instruction Decoder: Decodificador de Instruções': 'Instruction Decoder',
  'Decodificador de Instruções': 'Instruction Decoder',
  'Clock\nGerador da temporização \nprimária da UC':
    'Clock\nPrimary timing generator\nof the control unit',
  Acumulador: 'Accumulator',
}

/** Dica no idioma pedido (as originais estão em português). */
export function traduzirDica(dica: string | undefined, idioma: string): string | undefined {
  if (dica === undefined || idioma.startsWith('pt')) return dica
  return DICAS_EM_INGLES[dica] ?? DICAS_EM_INGLES[dica.trim()] ?? dica
}

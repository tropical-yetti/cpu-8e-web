# A CPU-8E

A CPU-8E segue o modelo de von Neumann: programa e dados ficam na mesma memória, e a CPU busca uma instrução de cada vez, a decodifica e a executa. Tudo trabalha com 8 bits: cada registrador e cada posição de memória guarda um valor de `00` a `FF` (0 a 255).

Este é o mesmo painel do simulador. Os nomes abaixo seguem o desenho; passe o mouse sobre uma sigla, ou toque nela, para ver o que ela quer dizer. A lista completa está em [Siglas](#/documentacao/siglas).

{{diagrama}}

## Memória {#memoria}

São 256 bytes, endereços `00` a `FF`. A CPU nunca lê a memória diretamente: ela coloca o endereço no **MAR** e recebe (ou envia) o dado pelo **MDR**.

- **BE** (barramento de endereços) leva o endereço do MAR até a memória.
- **BD** (barramento de dados) leva o dado entre a memória e o MDR.
- **RD** e **WR** são os sinais de controle de leitura e escrita, enviados pela unidade de controle.

Dentro da memória, o endereço é dividido em dois: o primeiro dígito hexadecimal escolhe uma de 16 linhas, e o segundo, uma de 16 colunas. A vista **Por dentro** do simulador mostra essa grade e os dois decodificadores ([Memória por dentro](#/documentacao/simulador#memoria-por-dentro)).

## Registradores {#registradores}

| Registrador   | Nome                    | Para que serve                                                                          |
| ------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| **PC**        | Program Counter         | Endereço do próximo byte do programa. Avança 1 a cada leitura de instrução ou operando. |
| **MAR**       | Memory Address Register | Endereço da posição de memória que vai ser lida ou escrita.                             |
| **MDR**       | Memory Data Register    | Dado lido da memória ou que vai ser escrito nela.                                       |
| **IR**        | Instruction Register    | Código da instrução que está sendo executada.                                           |
| **ACC**       | Acumulador              | Recebe o resultado das operações e é a origem do `STO`.                                 |
| **A** e **B** | Entradas da ULA         | Guardam os dois operandos enquanto a ULA calcula.                                       |
| **SP**        | Stack Pointer           | Topo da pilha usada por `CAL` e `RET`. Começa em `FF` e desce a cada chamada.           |

O **BI** (barramento interno) é a via que liga os registradores entre si e à ULA. Cada transferência de um registrador para outro passa por ele.

## ULA {#ula}

A Unidade Lógica e Aritmética faz as contas: soma, subtração, operações lógicas (AND, OR, XOR, NOT), deslocamentos e rotações. Ela recebe os operandos em **A** e **B** e mostra o resultado na **Saída** (no visual clássico, o campo **ULA**). A cada operação, atualiza três flags:

| Flag                    | Fica em 1 quando…                                                              |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Z** (zero)            | o resultado de 8 bits é `00`.                                                  |
| **N** (negativo)        | o bit 7 do resultado é 1. Em complemento de 2, isso indica um número negativo. |
| **C** (carry, "vai-um") | o cálculo passou de 8 bits, ou um bit saiu num deslocamento.                   |

Na subtração (`SUB` e `CMP`), a ULA soma A com o complemento de 2 de B. Por isso **C = 1 quando não há empréstimo** (A ≥ B) e C = 0 quando A < B. Os desvios `JEQ`, `JGT`, `JGE` e `JCY` decidem pelo valor dessas flags.

As flags ficam no **Status Register** e vão para a UC, que as usa para decidir os desvios. No visual clássico, elas aparecem duas vezes: perto da ULA e embaixo da UC.

## Unidade de controle e decodificador {#controle}

O **DI** (decodificador de instruções) recebe o código do IR e mostra qual instrução ele representa, como `LOD 05` ou `JMP[0E]`.

A **UC** (unidade de controle) comanda tudo: a cada pulso do **clock**, ela escolhe a próxima micro-operação (copiar um registrador para outro, ler ou escrever na memória, mandar a ULA calcular) e acende o caminho correspondente. A sequência de micro-operações de cada instrução está em [Ciclo de instrução](#/documentacao/ciclo).

## Formato das instruções {#formato}

Cada instrução ocupa 1 ou 2 bytes. O primeiro é o código; os bits mais altos dizem como ler o resto:

| Bit 7 (DW) | Bit 6 (ED) | Significado                                                                                                            |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0          | 0          | Instrução de 1 byte, sem operando (ex.: `NOT`, `HLT`).                                                                 |
| 1          | 0          | **Imediato**: o segundo byte é o próprio valor (ex.: `LOD 05` carrega 05).                                             |
| 1          | 1          | **Direto**: o segundo byte é um endereço; o valor está na memória (ex.: `LOD [05]` carrega o conteúdo do endereço 05). |

No simulador, o operando imediato aparece como `05` e o endereço direto como `[05]`. A lista completa está em [Conjunto de instruções](#/documentacao/instrucoes).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'
[//]: # 'Partes derivadas de CPU8E_Sim.txt, CPU-8E v2.2, Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores; veja NOTICE.md.'

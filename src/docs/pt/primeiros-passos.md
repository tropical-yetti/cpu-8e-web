# Primeiros passos

O CPU-8E é uma CPU de 8 bits criada para ensinar como um processador funciona por dentro. O simulador mostra cada registrador, a ULA, os barramentos e a memória, e deixa você acompanhar a execução de um programa pulso a pulso do clock.

Esta página leva uns cinco minutos e mostra o caminho básico: carregar um programa, executá-lo devagar e ver o resultado.

## 1. Carregue um programa

1. Na página **Simulador**, toque em **Carregar**.
2. Escolha **teste.bin**, um dos programas que acompanham o simulador original.
3. Uma mensagem confirma quantos bytes foram lidos. Toque em **OK**.

A tabela da direita (ou de baixo, no celular) mostra a memória: o **Endereço**, o conteúdo em hexadecimal (**Memória**) e a instrução correspondente (**Símbolo**). O programa começa no endereço `00` com `LOD [16]`.

## 2. Execute passo a passo

O modo inicial é **Passo a passo**. Cada toque em **Executar** avança um pulso de clock:

- os registradores que mudaram ficam **realçados**;
- os fios por onde o dado passou **acendem**, com uma seta para onde ele vai;
- a lâmpada de **Fase** mostra se a CPU está buscando a instrução, buscando o operando ou executando;
- o semáforo de **Status** fica amarelo enquanto a CPU espera você.

Toque em **Executar** algumas vezes e observe o primeiro ciclo: o PC vai para o MAR, a memória entrega o código da instrução ao MDR, o MDR passa para o IR e o decodificador (DI) mostra `LOD[16]`.

## 3. Veja o programa inteiro

Troque o **Modo** para **Execução contínua** e escolha o clock **100** (o mais rápido). Toque em **Executar**: a CPU roda até a instrução `HLT` e o semáforo fica vermelho. No fim, o ACC vale `FF`.

## 4. Recomece

**Reset** zera os registradores e volta o PC para `00`, mantendo o programa na memória. Assim você pode repetir a execução quantas vezes quiser, em qualquer modo.

> **Dica:** toque num registrador para trocar a base do valor: de hexadecimal (`0xFF`) para decimal (`255`) e binário (`0b11111111`).

## Próximos passos

- [A CPU-8E](#/documentacao/cpu) explica cada parte do diagrama.
- [Ciclo de instrução](#/documentacao/ciclo) detalha o que acontece em cada pulso.
- [Escrevendo programas](#/documentacao/programas) mostra como criar seus próprios programas.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

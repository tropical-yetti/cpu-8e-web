# Usando o simulador

## Barra de ferramentas {#barra}

| Botão        | Atalho | O que faz                                                                                                                                                 |
| ------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Carregar** | Ctrl+L | Carrega um programa `.bin`: um arquivo do seu dispositivo ou um dos programas do simulador original. A memória é zerada antes e a CPU passa por um Reset. |
| **Gravar**   | Ctrl+S | Baixa o programa da memória como arquivo `.bin`.                                                                                                          |
| **Executar** | Ctrl+G | Começa a execução ou avança, conforme o modo.                                                                                                             |
| **Pausar**   | Ctrl+P | Pausa a execução no próximo pulso de clock. **Executar** continua de onde parou.                                                                          |
| **Parar**    | Ctrl+H | Interrompe a execução. Depois disso, **Executar** e **Pausar** ficam desabilitados até um **Reset**.                                                      |
| **Reset**    | Ctrl+R | Zera os registradores, coloca o SP em `FF` e o PC em `00`. A memória não é apagada.                                                                       |
| **Ajuda**    | F1     | Abre esta documentação.                                                                                                                                   |

Executar, Pausar, Parar e Reset começam desabilitados e são liberados quando um programa é carregado ou digitado na memória.

## Modos {#modos}

| Modo                        | Onde a CPU para e espera você apertar Executar                        |
| --------------------------- | --------------------------------------------------------------------- |
| **Passo a passo**           | Depois de cada pulso de clock, com o realce aceso.                    |
| **Instrução por instrução** | No fim de cada instrução.                                             |
| **Execução contínua**       | Só no `HLT`, num código inválido, ou se você apertar Pausar ou Parar. |

O modo pode ser trocado a qualquer momento; vale a partir do próximo ponto de parada.

## Fase e status {#fase-status}

As lâmpadas de **Fase** mostram em que parte do [ciclo de instrução](#/documentacao/ciclo) a CPU está: **Busca** (azul), **Operando** (amarelo) ou **Execução** (verde). Depois de um Reset ou de Parar, ficam todas apagadas.

O semáforo de **Status** mostra o estado da execução:

- **vermelho**: parada (depois de um Reset, de Parar ou do `HLT`);
- **amarelo**: pausada, esperando você apertar Executar;
- **verde**: executando.

## Clock {#clock}

O seletor **Clock**, embaixo do diagrama, define o tempo entre dois pulsos. O valor vai de 10 (mais lento) a 100 (sem espera). O tempo segue a fórmula do simulador original: `510 − 5,144 × clock` milissegundos, sem casas decimais.

| Clock        | 10  | 20  | 30  | 40  | 50  | 60  | 70  | 80  | 90  | 100 |
| ------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms por pulso | 459 | 408 | 356 | 305 | 253 | 202 | 150 | 99  | 48  | 0   |

O padrão é 50. No modo passo a passo, esse tempo também passa depois de cada toque em Executar, antes de o realce apagar.

## Diagrama {#diagrama}

Durante a execução, cada pulso de clock pinta de vermelho o texto dos registradores que receberam um valor e os trechos de barramento por onde o dado passou. Passe o mouse sobre uma parte do diagrama, ou toque nela no celular, para ver uma dica sobre ela.

**Valor em binário:** mantenha pressionado o ACC, A, B, IR, MAR, MDR, PC, SP ou a saída da ULA para ver o valor em binário, como `ACC=00000101`. Ao soltar, a indicação some. Pelo teclado, use **Tab** até o registrador e aperte **Enter**.

**Acessibilidade:** leitores de tela encontram uma tabela com o estado de todos os registradores e ouvem, a cada parada, o que mudou no último pulso de clock (por exemplo, "Busca: MAR:00").

## Memória {#memoria}

A tabela mostra os 256 endereços:

- **Endereço**: de `00` a `FF`;
- **Memória**: o conteúdo em hexadecimal;
- **Símbolo**: a instrução que o conteúdo representa (disassembly).

A linha destacada acompanha a execução: em geral é o endereço da instrução atual ou da última escrita.

### Editar a memória {#editar-memoria}

Toque numa célula da coluna **Memória**, digite o valor em hexadecimal (`00` a `FF`) e aperte **Enter**: o valor é gravado e a edição passa para a linha de baixo, para você digitar o programa em sequência. **Esc** cancela a edição.

- O que não for hexadecimal válido é gravado como `00`, sem aviso.
- Valores acima de `FF` ficam só com os dois últimos dígitos (`1FF` vira `FF`).
- Editar além do fim do programa aumenta o tamanho do programa até aquela posição.

A coluna **Símbolo** é atualizada depois de cada edição e de cada carregamento. Ela lê a memória a partir de `00` como se tudo fosse código, então áreas de dados também aparecem como instruções (às vezes `XXX`).

### Gravar {#gravar}

**Gravar** salva os bytes de `00` até o fim do programa (o tamanho do arquivo carregado, ou a última posição editada). Dados que o programa escreveu depois desse ponto, com `STO` ou pela pilha, não entram no arquivo.

## Idioma {#idioma}

Use o seletor no canto superior direito para trocar entre português e inglês. A escolha fica guardada neste navegador.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'
[//]: # 'Partes derivadas de CPU8E_Sim.txt, CPU-8E v2.2, Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores; veja NOTICE.md.'

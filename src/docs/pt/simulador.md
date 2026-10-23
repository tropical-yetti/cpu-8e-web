# Usando o simulador

## Barra de ferramentas {#barra}

| Botão        | Atalho | O que faz                                                                                                                                                                                                  |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Carregar** | Ctrl+L | Carrega um programa `.bin`: um arquivo do seu dispositivo ou um dos programas do simulador original. A memória é zerada antes e a CPU passa por um Reset, que também interrompe uma execução em andamento. |
| **Gravar**   | Ctrl+S | Baixa o conteúdo da memória como arquivo `.bin` (veja [Gravar](#gravar)).                                                                                                                                  |
| **Executar** | Ctrl+G | Começa a execução ou avança, conforme o modo.                                                                                                                                                              |
| **Pausar**   | Ctrl+P | Pausa a execução no próximo pulso de clock. **Executar** continua de onde parou. Sem nada em execução, não faz nada.                                                                                       |
| **Reset**    | Ctrl+R | Interrompe a execução, se houver uma, zera os registradores e coloca o SP em `FF` e o PC em `00`. A memória não é apagada.                                                                                 |
| **Ajuda**    | F1     | Abre esta documentação.                                                                                                                                                                                    |

Executar, Pausar e Reset começam desabilitados e são liberados quando um programa é carregado ou digitado na memória.

## Modos {#modos}

| Modo                        | Onde a CPU para e espera você apertar Executar                                              |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| **Passo a passo**           | Depois de cada pulso de clock, com o realce aceso.                                          |
| **Instrução por instrução** | No fim de cada instrução.                                                                   |
| **Execução contínua**       | Só no `HLT`, num código inválido, se a pilha alcançar o programa ou se você apertar Pausar. |

O modo pode ser trocado a qualquer momento; vale a partir do próximo ponto de parada.

## Fase e status {#fase-status}

As lâmpadas de **Fase** mostram em que parte do [ciclo de instrução](#/documentacao/ciclo) a CPU está: **Busca** (azul), **Operando** (amarelo) ou **Execução** (verde). Depois de um Reset, ficam todas apagadas.

O semáforo de **Status** mostra o estado da execução:

- **vermelho**: parada (depois de um Reset, do `HLT` ou de Executar sem programa);
- **amarelo**: pausada, esperando você apertar Executar;
- **verde**: executando.

## Clock {#clock}

O seletor **Clock**, na unidade de controle (UC) do painel, define o tempo entre dois pulsos. O valor vai de 10 (mais lento) a 100 (sem espera). O tempo segue a fórmula do simulador original: `510 − 5,144 × clock` milissegundos, sem casas decimais.

| Clock        | 10  | 20  | 30  | 40  | 50  | 60  | 70  | 80  | 90  | 100 |
| ------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms por pulso | 459 | 408 | 356 | 305 | 253 | 202 | 150 | 99  | 48  | 0   |

O padrão é 50. No modo passo a passo, esse tempo também passa depois de cada toque em Executar, antes de o realce apagar.

## Painel {#diagrama}

O painel mostra a CPU com o barramento interno (**BI**) no meio. À esquerda ficam o PC, o SP, o ACC e a ULA, com os registradores A e B e as flags; à direita, o MAR, o MDR, o IR e a unidade de controle (UC), com o decodificador (DI) e o clock. Do lado da memória saem o barramento de endereços (**BE**), o de dados (**BD**) e os sinais **RD** e **WR**.

Durante a execução, cada pulso de clock realça os registradores que receberam um valor e acende os fios por onde o dado passou, com uma seta para onde ele vai. As cores são as do painel original: BI azul, BE verde, BD ciano e sinais de controle amarelos. Passe o mouse sobre uma sigla, foque nela pelo teclado ou toque nela no celular para ver o que ela quer dizer; a lista completa está em [Siglas](#/documentacao/siglas).

**Valor em binário:** toque no ACC, A, B, IR, MAR, MDR, PC, SP ou na saída da ULA para ver o valor em binário, como `00000101`. Toque de novo para voltar ao hexadecimal. Pelo teclado, use **Tab** até o registrador e aperte **Enter**.

**Visual clássico:** o seletor **Visual do painel**, acima do painel, troca para o desenho do simulador original, com as mesmas posições, cores e dicas. Nele, os registradores que mudaram ficam com o texto em vermelho, e o valor em binário aparece enquanto o registrador fica pressionado. A escolha fica guardada no navegador.

**Acessibilidade:** leitores de tela encontram uma tabela com o estado de todos os registradores e ouvem, a cada parada, o que mudou no último pulso de clock (por exemplo, "Busca: MAR:00").

## Memória {#memoria}

A tabela mostra os 256 endereços:

- **Endereço**: de `00` a `FF`;
- **Memória**: o conteúdo em hexadecimal;
- **Símbolo**: a instrução que o conteúdo representa (disassembly), ou `DB` seguido do valor quando o byte é um dado.

A linha destacada acompanha a execução: em geral é o endereço da instrução atual ou da última escrita.

As posições ocupadas pela [pilha](#pilha) aparecem com outra cor de fundo, e a coluna **Símbolo** mostra a palavra "pilha" onde não há instrução.

### Editar a memória {#editar-memoria}

Toque numa célula da coluna **Memória**, digite o valor em hexadecimal (`00` a `FF`) e aperte **Enter**: o valor é gravado e a edição passa para a linha de baixo, para você digitar o programa em sequência. **Esc** cancela a edição.

- Só são aceitos valores hexadecimais de um ou dois dígitos, de `00` a `FF`, em maiúsculas ou minúsculas. Outro valor é recusado: aparece um aviso acima da tabela, o campo continua aberto e a memória não muda.
- Editar além do fim do programa aumenta o tamanho do programa até aquela posição.

A coluna **Símbolo** é atualizada depois de cada edição e de cada carregamento. Para separar código de dados, ela segue os caminhos que a execução pode tomar a partir de `00`: depois de cada instrução vem a seguinte, e os desvios (`JMP`, `JEQ`, `JGT`, `JGE`, `JCY` e `CAL`) levam também ao endereço do operando. O que nenhum caminho alcança aparece como dado, por exemplo `DB 05`. Um programa que modifica o próprio código pode aparecer de forma diferente do que executa.

### Gravar {#gravar}

**Gravar** salva os bytes de `00` até o último byte diferente de zero da memória, e nunca menos que o programa carregado ou editado. Assim, os dados que o programa escreveu com `STO`, e os endereços de retorno guardados na pilha, também entram no arquivo.

### Pilha {#pilha}

A pilha começa em `FF` e desce a cada `CAL` (veja [Sub-rotinas e pilha](#/documentacao/instrucoes)). As posições acima do SP, que guardam endereços de retorno, ficam destacadas na tabela. Se um `CAL` gravar o endereço de retorno dentro do programa, a execução pausa com uma mensagem: a pilha chegou ao código. Apertar **Executar** continua mesmo assim, como numa CPU real, que não tem essa proteção.

## Idioma {#idioma}

Use o seletor no canto superior direito para trocar entre português e inglês. A escolha fica guardada neste navegador.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'
[//]: # 'Partes derivadas de CPU8E_Sim.txt, CPU-8E v2.2, Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores; veja NOTICE.md.'

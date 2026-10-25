# Diferenças do original

A versão 1.0 reproduziu o simulador CPU-8E v2.2.3 (IESB, 2010) com **fidelidade total**: a mesma aritmética, a mesma sequência de micro-operações e os mesmos comportamentos dos botões, inclusive os defeitos conhecidos. A **versão 1.1** corrigiu esses defeitos; até ela, testes automáticos comparavam esta versão, pulso a pulso, com o código Pascal original, ao qual foram aplicadas as mesmas correções.

A **série 2.x** muda a tela, não a CPU: as instruções, os pulsos de clock e as flags são os mesmos da 1.1. Desde a 2.0, cada instrução é conferida por testes que comparam a memória, os registradores e as flags antes e depois dela.

## Corrigido na versão 1.1 {#corrigido}

| O que mudou                                   | No original (e na versão 1.0)                                                                                                                      | Agora                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Deslocamento com contador `00`                | `SHL`, `SHR`, `SRA`, `ROL` e `ROR` com operando `00` copiavam para o ACC a saída que a ULA guardava da instrução anterior.                         | O ACC e as flags ficam como estavam.                                                                                             |
| Escrita do `STO`                              | A escrita na memória era animada duas vezes: 3 pulsos de clock na execução.                                                                        | Uma única escrita: 2 pulsos.                                                                                                     |
| Ordem do `NOT`                                | A ULA mostrava o resultado antes de o pulso animar ACC → A.                                                                                        | Primeiro ACC → A, depois a ULA calcula. O resultado é o mesmo.                                                                   |
| Botão Parar                                   | Encerrava a execução sem deixar continuar; só servia para interromper antes do Reset.                                                              | Removido, junto com o atalho Ctrl+H. Para interromper, use **Pausar** ou **Reset**.                                              |
| Reset ou Carregar durante a execução contínua | A execução não parava: a CPU seguia a partir do estado zerado e recomeçava o programa (o novo, no caso de Carregar).                               | A execução é interrompida.                                                                                                       |
| Pausar com a CPU parada                       | O próximo **Executar** não iniciava a execução; era preciso apertar de novo.                                                                       | Sem nada em execução, Pausar não faz nada.                                                                                       |
| Executar sem programa                         | Aparecia o aviso, mas o semáforo ficava verde.                                                                                                     | O semáforo volta ao vermelho.                                                                                                    |
| Texto inicial do decodificador                | Antes do primeiro Reset ou carregamento, o decodificador mostrava `ID:NOP` (sigla em inglês) e depois passava a `DI:…`.                            | Começa com `DI:NOP`.                                                                                                             |
| Edição da memória                             | Texto que não era hexadecimal virava `00` sem aviso, e valores acima de `FF` eram cortados.                                                        | Só valores de `00` a `FF` são aceitos; outro valor é recusado com um aviso, e a memória não muda.                                |
| Gravar                                        | Salvava só até o fim do programa carregado ou editado; dados escritos depois, com `STO` ou pela pilha, ficavam de fora.                            | Salva até o último byte diferente de zero da memória, e nunca menos que o programa.                                              |
| Coluna Símbolo                                | Tratava toda a memória como código, a partir de `00`. Dados apareciam como instruções, e um byte de dado podia desalinhar as instruções seguintes. | Segue os caminhos que a execução pode tomar, inclusive os desvios, e mostra como `DB 05` o que nenhum caminho alcança.           |
| Pilha                                         | Descia a partir de `FF` e podia sobrescrever o programa sem aviso.                                                                                 | As posições ocupadas pela pilha aparecem destacadas, e a execução pausa com uma mensagem quando um `CAL` grava sobre o programa. |

A tag `v1.0.0` do [repositório do projeto](https://github.com/tropical-yetti/cpu-8e-web) guarda a versão com o comportamento original.

## Novidades da série 2.x {#serie-2}

- **Painel novo**, com os fios coloridos por barramento e setas para onde o dado vai, as siglas explicadas por legendas e o bloco da ULA com as entradas ligadas à saída e o Status Register. O desenho original continua no visual **Clássico**.
- **Memória por dentro**: a grade de 16 × 16 com os decodificadores de linha e de coluna, acompanhando o MAR. A tabela do original continua no seletor **Tabela**.
- Os registradores mostram o valor em hexadecimal, decimal ou binário; no original, só em binário, enquanto o registrador ficava pressionado.
- Um **guia de primeiro acesso** e botões **?** com balões que explicam cada parte da tela.
- Numa escrita, o valor novo aparece na memória já no pulso do WR, e não só no pulso seguinte.

## Diferenças por causa da plataforma {#plataforma}

Algumas coisas não têm como funcionar igual num navegador:

- **Ajuda** abre esta documentação; o original abria um arquivo de texto no editor `gedit`, o que só funcionava no Linux.
- Não há botão **Sair**: basta fechar a aba.
- **Carregar** também oferece `teste.bin` e `allopcodes.bin`, que no original vinham na pasta do programa.
- **Gravar** baixa o arquivo pelo navegador, em vez de abrir uma janela para escolher a pasta.
- Apertar **Executar** durante uma execução contínua não faz nada. No original, isso iniciava uma segunda execução dentro da primeira e embaralhava o estado da CPU.
- A interface também está em inglês, com as dicas do painel traduzidas e as siglas do desenho em inglês (ALU, CU, ID, IB, DB, AB).
- No visual clássico, no celular, o diagrama rola para os lados quando a tela é estreita.

Se você encontrar outra diferença em relação ao original, ela é um erro desta versão; [avise no repositório do projeto](https://github.com/tropical-yetti/cpu-8e-web).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

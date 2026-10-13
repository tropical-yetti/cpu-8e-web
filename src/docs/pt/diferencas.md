# Diferenças do original

Esta versão reproduz o simulador CPU-8E v2.2.3 (IESB, 2010) com **fidelidade total**: a mesma aritmética, a mesma sequência de micro-operações e os mesmos comportamentos dos botões, inclusive os defeitos conhecidos. A fidelidade é conferida por testes automáticos que comparam esta versão com o código Pascal original, pulso a pulso.

As correções dos defeitos estão previstas para a versão 1.1.

## Diferenças por causa da plataforma

Algumas coisas não têm como funcionar igual num navegador:

- **Ajuda** abre esta documentação; o original abria um arquivo de texto no editor `gedit`, o que só funcionava no Linux.
- Não há botão **Sair**: basta fechar a aba.
- **Carregar** também oferece `teste.bin` e `allopcodes.bin`, que no original vinham na pasta do programa.
- **Gravar** baixa o arquivo pelo navegador, em vez de abrir uma janela para escolher a pasta.
- Apertar **Executar** durante uma execução contínua não faz nada. No original, isso iniciava uma segunda execução dentro da primeira e embaralhava o estado da CPU.
- A interface também está em inglês, com as dicas do painel traduzidas.
- No celular, o diagrama rola para os lados quando a tela é estreita.

## Comportamentos herdados do original

Estes comportamentos são do simulador original e foram mantidos de propósito na versão 1.0.

| Comportamento                                 | O que acontece                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deslocamento com contador `00`                | `SHL`, `SHR`, `SRA`, `ROL` e `ROR` com operando `00` deveriam manter o ACC, mas copiam para ele a saída que a ULA guardava da instrução anterior.                   |
| Escrita do `STO` repetida                     | A escrita na memória é animada duas vezes, um pulso de clock a mais. O resultado não muda.                                                                          |
| Gravar incompleto                             | **Gravar** salva só até o fim do programa carregado ou editado. Dados escritos depois desse ponto, com `STO` ou pela pilha, ficam de fora.                          |
| Edição sem validação                          | Na tabela de memória, texto que não é hexadecimal vira `00` sem aviso, e valores acima de `FF` são cortados.                                                        |
| Pilha sem proteção                            | A pilha desce a partir de `FF` e pode sobrescrever o programa se houver chamadas demais.                                                                            |
| Disassembly linear                            | A coluna **Símbolo** trata toda a memória como código, a partir de `00`. Dados aparecem como instruções, e um byte de dado pode desalinhar as instruções seguintes. |
| Pausar com a CPU parada                       | Se você aperta **Pausar** sem nada em execução, o próximo **Executar** não inicia a execução; é preciso apertar Executar de novo.                                   |
| Executar sem programa                         | Aparece o aviso, mas o semáforo fica verde.                                                                                                                         |
| Reset ou Carregar durante a execução contínua | A execução não para: a CPU segue a partir do estado zerado, ou seja, recomeça o programa (o novo, no caso de Carregar). Use **Parar** antes.                        |
| Texto inicial do decodificador                | Antes do primeiro Reset ou carregamento, o decodificador mostra `ID:NOP`, texto que vinha no formulário original.                                                   |

Se você encontrar outra diferença em relação ao original, ela é um erro desta versão; [avise no repositório do projeto](https://github.com/tropical-yetti/cpu-8e-web).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

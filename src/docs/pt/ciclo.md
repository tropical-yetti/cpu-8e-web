# Ciclo de instrução

Toda instrução passa por até três fases. A lâmpada **Fase** do simulador mostra qual delas está em andamento:

1. **Busca**: ler o código da instrução e decodificá-lo.
2. **Operando**: ler o segundo byte, só nas instruções de 2 bytes.
3. **Execução**: fazer o que a instrução manda.

Cada fase é uma sequência de **micro-operações**. A maioria corresponde a um pulso de clock: no modo **Passo a passo**, o simulador para em cada uma, com o caminho do dado aceso. Algumas, como somar 1 ao PC, acontecem entre dois pulsos e só mudam o valor mostrado.

## Busca {#busca}

| Pulso | Micro-operação | O que acontece                                                                                       |
| ----- | -------------- | ---------------------------------------------------------------------------------------------------- |
| 1     | PC → MAR       | O endereço da instrução vai para o MAR e, pelo BE, para a memória. Logo depois, o PC avança 1.       |
| 2     | M[MAR] → MDR   | A memória entrega o código da instrução pelo BD.                                                     |
| 3     | MDR → IR       | O código é copiado para o registrador de instrução.                                                  |
| 4     | IR → DI, UC    | O decodificador identifica a instrução. Nas de 2 bytes, já mostra o operando (o PC aponta para ele). |

Se o código não corresponde a nenhuma instrução, aparece a mensagem **INVALID OpCode!** e a CPU para.

## Operando {#operando}

Só acontece nas instruções de 2 bytes (bit 7 do código igual a 1).

| Pulso | Micro-operação | O que acontece                                                             |
| ----- | -------------- | -------------------------------------------------------------------------- |
| 1     | PC → MAR       | O MAR aponta para o segundo byte da instrução. Logo depois, o PC avança 1. |
| 2     | M[MAR] → MDR   | Só no endereçamento **direto**: lê o endereço escrito na instrução.        |
| 3     | MDR → MAR      | Só no endereçamento **direto**: o MAR passa a apontar para o dado.         |

Repare no truque: ao fim desta fase, o MAR sempre aponta para onde está o valor. No modo **imediato**, ele aponta para o próprio segundo byte da instrução; no **direto**, para o endereço indicado. Por isso a fase de execução é igual nos dois modos: ela simplesmente lê `M[MAR]`.

## Execução {#execucao}

A tabela mostra as micro-operações de cada instrução e quantos pulsos de clock a execução leva.

| Instrução                         | Micro-operações                                                                                                        | Pulsos                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `HLT`                             | Para a CPU.                                                                                                            | 1                                        |
| `NOP`                             | Nada.                                                                                                                  | 1                                        |
| `NOT`                             | ACC → A; ULA calcula NOT A; ULA → ACC                                                                                  | 3                                        |
| `JMP`                             | MAR → PC                                                                                                               | 1                                        |
| `JEQ`, `JGT`, `JGE`, `JCY`        | Se a condição vale: MAR → PC. Se não vale, nada acontece.                                                              | 1 ou 0                                   |
| `STO`                             | ACC → MDR; MDR → M[MAR] (sinal WR)                                                                                     | 2                                        |
| `LOD`                             | M[MAR] → MDR; MDR → A; ULA repassa A e atualiza as flags; → ACC                                                        | 4                                        |
| `CMP`                             | M[MAR] → MDR; ACC → A; MDR → B; ULA calcula A − B (só as flags mudam)                                                  | 4                                        |
| `ADD`, `SUB`, `AND`, `XOR`, `ORL` | M[MAR] → MDR; ACC → A; MDR → B; ULA calcula; ULA → ACC                                                                 | 5                                        |
| `CAL`                             | PC → MDR (endereço de retorno); MAR → PC; SP → MAR; MDR → M[MAR]; SP diminui 1                                         | 4                                        |
| `RET`                             | SP aumenta 1; SP → MAR; M[MAR] → MDR; MDR → PC                                                                         | 3                                        |
| `SHL`, `SHR`, `SRA`, `ROL`, `ROR` | M[MAR] → MDR; MDR → B (contador); ACC → A; repete enquanto B > 0: ULA calcula, ULA → A, B diminui 1; por fim ULA → ACC | 4 + 2 por repetição; 3 com contador `00` |

Com contador `00`, o deslocamento termina depois de ACC → A, sem mudar o ACC nem as flags. No simulador original, o `STO` levava 3 pulsos, porque animava a escrita duas vezes; as duas particularidades foram corrigidas na versão 1.1 (veja [Diferenças do original](#/documentacao/diferencas)).

### Exemplo: quantos pulsos leva `LOD [16]`?

Busca (4) + operando direto (3) + execução (4) = **11 pulsos**. Já `LOD 05`, imediato, leva 4 + 1 + 4 = **9 pulsos**: a fase de operando só precisa apontar o MAR para o segundo byte.

## Os modos de execução e o ciclo {#modos}

- **Passo a passo**: para depois de cada pulso de clock.
- **Instrução por instrução**: para no fim de cada execução, antes da próxima busca.
- **Execução contínua**: só para no `HLT`, num código inválido, quando a pilha alcança o programa ou quando você aperta **Pausar**.

Em qualquer modo, o tempo entre dois pulsos é definido pelo **Clock** (veja [Usando o simulador](#/documentacao/simulador#clock)).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

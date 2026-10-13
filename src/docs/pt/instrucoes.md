# Conjunto de instruções

A CPU-8E tem 23 instruções e 35 códigos válidos (algumas instruções existem nos modos imediato e direto). Na tabela, **op** é o operando: o próprio valor no modo imediato, ou o conteúdo da memória no endereço dado, no modo direto. **end** é o endereço escrito na instrução.

{{tabela-instrucoes}}

Qualquer outro código é inválido: a CPU mostra **INVALID OpCode!** e para.

## Transferência de dados

- `LOD` carrega um valor no ACC. Ele passa pela ULA, por isso **atualiza as flags**: Z = 1 se o valor é `00`, N = bit 7 do valor, C = 0.
- `STO` grava o ACC na memória. Só existe no modo direto, e não muda as flags.

## Aritmética

- `ADD` soma o operando ao ACC. Se a soma passa de `FF`, sobra só o byte de baixo e **C = 1**. Exemplo: `05 + FC = 101` → ACC = `01`, C = 1.
- `SUB` subtrai o operando do ACC, somando o complemento de 2. Por isso **C = 1 quando não há empréstimo** (ACC ≥ op) e C = 0 quando há. Exemplo: `01 − 02` → ACC = `FF`, N = 1, C = 0.
- `CMP` faz a mesma conta que `SUB`, mas só atualiza as flags; o ACC não muda. É usado antes de um desvio condicional.

A CPU-8E não tem flag de overflow: N mostra só o bit 7 do resultado.

## Lógica

`AND`, `ORL` e `XOR` operam bit a bit entre o ACC e o operando; `NOT` inverte todos os bits do ACC. Z e N seguem o resultado, e C fica em 0.

## Deslocamentos e rotações

O operando diz **quantas vezes** a operação se repete. Cada repetição passa pela ULA e atualiza as flags; C guarda o último bit que "saiu".

| Instrução | Entra no bit que ficou livre           | Vai para o C |
| --------- | -------------------------------------- | ------------ |
| `SHL`     | 0 (à direita)                          | o bit 7      |
| `SHR`     | 0 (à esquerda)                         | o bit 0      |
| `SRA`     | uma cópia do bit 7 (o sinal se mantém) | o bit 0      |
| `ROL`     | o bit 7 (volta pela direita)           | o bit 7      |
| `ROR`     | o bit 0 (volta pela esquerda)          | o bit 0      |

> **Atenção:** com contador `00`, o simulador original copia para o ACC a saída que a ULA guardava da instrução anterior, em vez de manter o ACC. Esta versão reproduz esse comportamento; veja [Diferenças do original](#/documentacao/diferencas).

## Desvios

Todos usam endereçamento direto: o operando é o endereço de destino.

| Instrução | Desvia quando | Leitura comum, depois de `CMP x`       |
| --------- | ------------- | -------------------------------------- |
| `JMP`     | sempre        | —                                      |
| `JEQ`     | Z = 1         | ACC = x                                |
| `JGT`     | Z = 0 e N = 0 | resultado positivo e diferente de zero |
| `JGE`     | N = 0         | resultado positivo ou zero             |
| `JCY`     | C = 1         | ACC ≥ x (sem sinal)                    |

`JGT` e `JGE` olham o bit 7 do resultado, isto é, tratam o resultado como número com sinal. Para comparar valores sem sinal, use `JCY` depois de `CMP`.

## Sub-rotinas e pilha

- `CAL end` guarda na pilha o endereço da instrução seguinte (o valor do PC), diminui o SP e desvia para `end`.
- `RET` aumenta o SP, lê o endereço guardado e volta para ele.

A pilha começa em `FF` e cresce para baixo (`FF`, `FE`, `FD`…). Não há proteção: chamadas demais podem sobrescrever o programa.

## Controle

- `HLT` para a CPU. Para executar de novo, use **Reset**.
- `NOP` não faz nada; ocupa 1 byte e um pulso de execução.

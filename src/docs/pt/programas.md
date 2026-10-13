# Escrevendo programas

Os programas da CPU-8E são escritos direto em código de máquina: você escolhe as instruções, consulta o código de cada uma no [Conjunto de instruções](#/documentacao/instrucoes) e digita os bytes na memória.

## Do papel para a memória

Escreva primeiro o programa em linguagem de montagem, um endereço por linha. Cada instrução ocupa 1 byte (sem operando) ou 2 bytes (com operando), então o endereço da próxima instrução depende do tamanho da anterior.

Para somar dois números guardados nos endereços `20` e `21` e guardar o resultado em `22`:

| Endereço | Assembly   | Bytes   | Por quê           |
| -------- | ---------- | ------- | ----------------- |
| `00`     | `LOD [20]` | `D1 20` | LOD direto = `D1` |
| `02`     | `ADD [21]` | `D5 21` | ADD direto = `D5` |
| `04`     | `STO [22]` | `D0 22` | STO direto = `D0` |
| `06`     | `HLT`      | `00`    |                   |
| `20`     | dado       | `05`    | primeiro número   |
| `21`     | dado       | `07`    | segundo número    |

Para digitar no simulador, toque na célula **Memória** do endereço `00`, digite `D1`, **Enter**, `20`, **Enter**, e assim por diante. Depois toque em **Executar**.

Cada exemplo desta página tem o botão **Carregar no simulador**, que coloca o programa na memória de uma vez. A última linha de cada exemplo diz o resultado esperado depois do `HLT`.

```cpu8e
00: D1 20     LOD [20]    ; ACC ← M[20]
02: D5 21     ADD [21]    ; ACC ← ACC + M[21]
04: D0 22     STO [22]    ; M[22] ← ACC
06: 00        HLT
20: 05                    ; primeiro número
21: 07                    ; segundo número
; espera: ACC=0C M[22]=0C
```

## Laços

Um laço volta para um endereço anterior enquanto uma condição vale. Este conta de 5 até 0:

```cpu8e
00: 91 05     LOD 05      ; ACC ← 5
02: 96 01     SUB 01      ; ACC ← ACC − 1
04: C6 02     JGT [02]    ; repete enquanto ACC > 0
06: 00        HLT
; espera: ACC=00 Z=1
```

## Multiplicação por somas

A CPU-8E não tem multiplicação. Para calcular 3 × 4, some 3 quatro vezes, usando a memória para guardar o contador e o resultado:

```cpu8e
00: 91 00     LOD 00
02: D0 22     STO [22]    ; resultado ← 0
04: D1 22     LOD [22]    ; início do laço
06: D5 20     ADD [20]    ; resultado + 3
08: D0 22     STO [22]
0A: D1 21     LOD [21]
0C: 96 01     SUB 01      ; contador − 1
0E: D0 21     STO [21]
10: C6 04     JGT [04]    ; repete enquanto o contador > 0
12: 00        HLT
20: 03                    ; multiplicando
21: 04                    ; contador (multiplicador)
; espera: M[22]=0C M[21]=00
```

Como a CPU só tem o ACC, cada valor intermediário vai e volta da memória. Acompanhar este programa no modo **Instrução por instrução** mostra bem esse vaivém.

## Sub-rotinas

`CAL` desvia para uma sub-rotina e guarda o endereço de retorno na pilha; `RET` volta. Aqui, a sub-rotina em `10` dobra o ACC com um deslocamento à esquerda, e é chamada duas vezes:

```cpu8e
00: 91 05     LOD 05
02: C9 10     CAL [10]    ; ACC ← 0A
04: C9 10     CAL [10]    ; ACC ← 14
06: D0 20     STO [20]
08: 00        HLT
10: 8A 01     SHL 01      ; sub-rotina: dobra o ACC
12: 03        RET
; espera: ACC=14 M[20]=14 SP=FF
```

Observe a pilha no modo passo a passo: no `CAL`, o endereço de retorno (`04` na primeira chamada) é gravado em `FF` e o SP desce para `FE`; no `RET`, o SP volta a `FF` e o PC recebe `04`.

## Dicas

- Guarde os dados longe do código (por exemplo, a partir de `20`), para não confundir instruções com dados.
- Antes de um desvio condicional, faça uma operação que deixe as flags como você precisa; `CMP` serve para isso sem mudar o ACC.
- Use **Gravar** para salvar o programa num arquivo `.bin` e **Carregar** para abri-lo depois.

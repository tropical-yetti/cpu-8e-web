# Writing programs

CPU-8E programs are written directly in machine code: you choose the instructions, look up each code in the [Instruction set](#/documentacao/instrucoes) and type the bytes into memory.

## From paper to memory

First write the program in assembly language, one address per line. Each instruction takes 1 byte (no operand) or 2 bytes (with operand), so the address of the next instruction depends on the size of the previous one.

To add two numbers stored at addresses `20` and `21` and store the result at `22`:

| Address | Assembly   | Bytes   | Why               |
| ------- | ---------- | ------- | ----------------- |
| `00`    | `LOD [20]` | `D1 20` | direct LOD = `D1` |
| `02`    | `ADD [21]` | `D5 21` | direct ADD = `D5` |
| `04`    | `STO [22]` | `D0 22` | direct STO = `D0` |
| `06`    | `HLT`      | `00`    |                   |
| `20`    | data       | `05`    | first number      |
| `21`    | data       | `07`    | second number     |

To type it into the simulator, tap the **Memory** cell of address `00`, type `D1`, **Enter**, `20`, **Enter**, and so on. Then press **Go**.

Each example on this page has a **Load in the simulator** button that puts the program in memory in one go. The last line of each example shows the expected result after `HLT`.

```cpu8e
00: D1 20     LOD [20]    ; ACC ← M[20]
02: D5 21     ADD [21]    ; ACC ← ACC + M[21]
04: D0 22     STO [22]    ; M[22] ← ACC
06: 00        HLT
20: 05                    ; first number
21: 07                    ; second number
; expect: ACC=0C M[22]=0C
```

## Loops

A loop jumps back to an earlier address while a condition holds. This one counts from 5 down to 0:

```cpu8e
00: 91 05     LOD 05      ; ACC ← 5
02: 96 01     SUB 01      ; ACC ← ACC − 1
04: C6 02     JGT [02]    ; repeat while ACC > 0
06: 00        HLT
; expect: ACC=00 Z=1
```

## Multiplication by repeated addition

The CPU-8E has no multiply instruction. To compute 3 × 4, add 3 four times, using memory to keep the counter and the result:

```cpu8e
00: 91 00     LOD 00
02: D0 22     STO [22]    ; result ← 0
04: D1 22     LOD [22]    ; loop start
06: D5 20     ADD [20]    ; result + 3
08: D0 22     STO [22]
0A: D1 21     LOD [21]
0C: 96 01     SUB 01      ; counter − 1
0E: D0 21     STO [21]
10: C6 04     JGT [04]    ; repeat while counter > 0
12: 00        HLT
20: 03                    ; multiplicand
21: 04                    ; counter (multiplier)
; expect: M[22]=0C M[21]=00
```

Since the CPU only has ACC, every intermediate value goes back and forth to memory. Following this program in **Single Cycle** mode shows that well.

## Subroutines

`CAL` jumps to a subroutine and saves the return address on the stack; `RET` comes back. Here, the subroutine at `10` doubles ACC with a left shift, and is called twice:

```cpu8e
00: 91 05     LOD 05
02: C9 10     CAL [10]    ; ACC ← 0A
04: C9 10     CAL [10]    ; ACC ← 14
06: D0 20     STO [20]
08: 00        HLT
10: 8A 01     SHL 01      ; subroutine: doubles ACC
12: 03        RET
; expect: ACC=14 M[20]=14 SP=FF
```

Watch the stack in Single Step mode: on `CAL`, the return address (`04` on the first call) is written at `FF` and SP goes down to `FE`; on `RET`, SP goes back to `FF` and PC gets `04`.

## Tips

- Keep data away from code (for example, from `20` on), so instructions and data do not get mixed up.
- Before a conditional jump, run an operation that leaves the flags as you need them; `CMP` does that without changing ACC.
- Use **Save** to store the program in a `.bin` file and **Load** to open it later.

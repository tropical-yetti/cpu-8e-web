# The CPU-8E

The CPU-8E follows the von Neumann model: program and data share the same memory, and the CPU fetches one instruction at a time, decodes it and executes it. Everything is 8 bits wide: each register and each memory location holds a value from `00` to `FF` (0 to 255).

This is the same panel as in the simulator. The names below follow the drawing. Labels such as ULA (ALU), DI (instruction decoder), UC (control unit), BI, BE and BD come from the original Portuguese design.

{{diagrama}}

## Memory {#memoria}

There are 256 bytes, addresses `00` to `FF`. The CPU never reads memory directly: it places the address in **MAR** and receives (or sends) the data through **MDR**.

- **BE** (address bus) carries the address from MAR to memory.
- **BD** (data bus) carries data between memory and MDR.
- **RD** and **WR** are the read and write control signals, sent by the control unit.

## Registers {#registradores}

| Register        | Name                    | What it is for                                                                          |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| **PC**          | Program Counter         | Address of the next program byte. Goes up by 1 after each instruction or operand fetch. |
| **MAR**         | Memory Address Register | Address of the memory location to be read or written.                                   |
| **MDR**         | Memory Data Register    | Data read from memory or about to be written to it.                                     |
| **IR**          | Instruction Register    | Code of the instruction being executed.                                                 |
| **ACC**         | Accumulator             | Receives the result of operations and is the source for `STO`.                          |
| **A** and **B** | ALU inputs              | Hold the two operands while the ALU computes.                                           |
| **SP**          | Stack Pointer           | Top of the stack used by `CAL` and `RET`. Starts at `FF` and goes down on each call.    |

**BI** (internal bus) connects the registers to each other and to the ALU. Every transfer between registers goes through it.

## ALU (ULA) {#ula}

The Arithmetic Logic Unit does the math: addition, subtraction, logic operations (AND, OR, XOR, NOT), shifts and rotations. It takes its operands in **A** and **B** and shows the result at the **ULA** output. Each operation updates three flags:

| Flag             | Set to 1 when…                                                               |
| ---------------- | ---------------------------------------------------------------------------- |
| **Z** (zero)     | the 8-bit result is `00`.                                                    |
| **N** (negative) | bit 7 of the result is 1. In two's complement, this means a negative number. |
| **C** (carry)    | the computation went past 8 bits, or a bit was shifted out.                  |

For subtraction (`SUB` and `CMP`), the ALU adds A to the two's complement of B. That is why **C = 1 when there is no borrow** (A ≥ B) and C = 0 when A < B. The jumps `JEQ`, `JGT`, `JGE` and `JCY` decide based on these flags.

The flags appear twice on the panel: next to the ALU, where they are computed, and below the control unit (UC), which uses them to decide jumps.

## Control unit and decoder {#controle}

The **DI** (instruction decoder) receives the code from IR and shows which instruction it stands for, such as `LOD 05` or `JMP[0E]`.

The **UC** (control unit) drives everything: on each **clock** pulse it picks the next micro-operation (copy one register to another, read or write memory, tell the ALU to compute) and lights up the matching path. The micro-operations of each instruction are listed in [Instruction cycle](#/documentacao/ciclo).

## Instruction format {#formato}

Each instruction takes 1 or 2 bytes. The first one is the code; its high bits say how to read the rest:

| Bit 7 (DW) | Bit 6 (ED) | Meaning                                                                                                               |
| ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 0          | 0          | 1-byte instruction, no operand (e.g. `NOT`, `HLT`).                                                                   |
| 1          | 0          | **Immediate**: the second byte is the value itself (e.g. `LOD 05` loads 05).                                          |
| 1          | 1          | **Direct**: the second byte is an address; the value is in memory (e.g. `LOD [05]` loads the contents of address 05). |

In the simulator, an immediate operand appears as `05` and a direct address as `[05]`. The full list is in [Instruction set](#/documentacao/instrucoes).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'
[//]: # 'Partes derivadas de CPU8E_Sim.txt, CPU-8E v2.2, Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores; veja NOTICE.md.'

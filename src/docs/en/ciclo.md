# Instruction cycle

Every instruction goes through up to three phases. The simulator's **Phase** lamps show which one is running:

1. **Fetch**: read the instruction code and decode it.
2. **Operand**: read the second byte, only for 2-byte instructions.
3. **Execute**: do what the instruction says.

Each phase is a sequence of **micro-operations**. Most of them take one clock pulse: in **Single Step** mode, the simulator stops at each one, with the data path lit in red. A few, such as adding 1 to PC, happen between two pulses and only change the value shown.

## Fetch {#busca}

| Pulse | Micro-operation | What happens                                                                                                    |
| ----- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| 1     | PC → MAR        | The instruction address goes to MAR and, through AB, to memory. Right after, PC goes up by 1.                   |
| 2     | M[MAR] → MDR    | Memory delivers the instruction code through DB.                                                                |
| 3     | MDR → IR        | The code is copied to the instruction register.                                                                 |
| 4     | IR → ID, CU     | The decoder identifies the instruction. For 2-byte instructions it already shows the operand (PC points to it). |

If the code does not match any instruction, the message **INVALID OpCode!** appears and the CPU stops.

## Operand {#operando}

Only for 2-byte instructions (bit 7 of the code set to 1).

| Pulse | Micro-operation | What happens                                                                    |
| ----- | --------------- | ------------------------------------------------------------------------------- |
| 1     | PC → MAR        | MAR points to the second byte of the instruction. Right after, PC goes up by 1. |
| 2     | M[MAR] → MDR    | **Direct** addressing only: reads the address written in the instruction.       |
| 3     | MDR → MAR       | **Direct** addressing only: MAR now points to the data.                         |

Notice the trick: at the end of this phase, MAR always points to where the value is. In **immediate** mode it points to the second byte of the instruction itself; in **direct** mode, to the given address. That is why the execute phase is the same for both modes: it simply reads `M[MAR]`.

## Execute {#execucao}

The table lists the micro-operations of each instruction and how many clock pulses the execute phase takes.

| Instruction                       | Micro-operations                                                                                                  | Pulses                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `HLT`                             | Stops the CPU.                                                                                                    | 1                                         |
| `NOP`                             | Nothing.                                                                                                          | 1                                         |
| `NOT`                             | ACC → A; ALU computes NOT A; ALU → ACC                                                                            | 3                                         |
| `JMP`                             | MAR → PC                                                                                                          | 1                                         |
| `JEQ`, `JGT`, `JGE`, `JCY`        | If the condition holds: MAR → PC. Otherwise nothing happens.                                                      | 1 or 0                                    |
| `STO`                             | ACC → MDR; MDR → M[MAR] (WR signal)                                                                               | 2                                         |
| `LOD`                             | M[MAR] → MDR; MDR → A; ALU passes A through and updates the flags; → ACC                                          | 4                                         |
| `CMP`                             | M[MAR] → MDR; ACC → A; MDR → B; ALU computes A − B (only the flags change)                                        | 4                                         |
| `ADD`, `SUB`, `AND`, `XOR`, `ORL` | M[MAR] → MDR; ACC → A; MDR → B; ALU computes; ALU → ACC                                                           | 5                                         |
| `CAL`                             | PC → MDR (return address); MAR → PC; SP → MAR; MDR → M[MAR]; SP goes down by 1                                    | 4                                         |
| `RET`                             | SP goes up by 1; SP → MAR; M[MAR] → MDR; MDR → PC                                                                 | 3                                         |
| `SHL`, `SHR`, `SRA`, `ROL`, `ROR` | M[MAR] → MDR; MDR → B (counter); ACC → A; while B > 0: ALU computes, ALU → A, B goes down by 1; finally ALU → ACC | 4 + 2 per repetition; 3 with counter `00` |

With counter `00`, the shift ends after ACC → A, without changing ACC or the flags. In the original simulator, `STO` took 3 pulses because it animated the write twice; both quirks were fixed in version 1.1 (see [Differences from the original](#/documentacao/diferencas)).

### Example: how many pulses does `LOD [16]` take?

Fetch (4) + direct operand (3) + execute (4) = **11 pulses**. `LOD 05`, which is immediate, takes 4 + 1 + 4 = **9 pulses**: the operand phase only needs to point MAR at the second byte.

## Execution modes and the cycle {#modos}

- **Single Step**: stops after each clock pulse.
- **Single Cycle**: stops at the end of each execute phase, before the next fetch.
- **Full Run**: stops only at `HLT`, at an invalid code, when the stack reaches the program, or when you press **Pause**.

In every mode, the time between two pulses is set by the **Clock** (see [Using the simulator](#/documentacao/simulador#clock)).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

# Instruction set

The CPU-8E has 23 instructions and 35 valid codes (some instructions exist in both immediate and direct mode). In the table, **op** is the operand: the value itself in immediate mode, or the memory contents at the given address in direct mode. **addr** is the address written in the instruction.

{{tabela-instrucoes}}

Any other code is invalid: the CPU shows **INVALID OpCode!** and stops.

## Data transfer

- `LOD` loads a value into ACC. It goes through the ALU, so it **updates the flags**: Z = 1 if the value is `00`, N = bit 7 of the value, C = 0.
- `STO` writes ACC to memory. It exists only in direct mode and does not change the flags.

## Arithmetic

- `ADD` adds the operand to ACC. If the sum goes past `FF`, only the low byte is kept and **C = 1**. Example: `05 + FC = 101` → ACC = `01`, C = 1.
- `SUB` subtracts the operand from ACC by adding its two's complement. That is why **C = 1 when there is no borrow** (ACC ≥ op) and C = 0 when there is one. Example: `01 − 02` → ACC = `FF`, N = 1, C = 0.
- `CMP` does the same computation as `SUB` but only updates the flags; ACC does not change. It is used before a conditional jump.

The CPU-8E has no overflow flag: N only reflects bit 7 of the result.

## Logic

`AND`, `ORL` and `XOR` work bit by bit between ACC and the operand; `NOT` inverts every bit of ACC. Z and N follow the result, and C is 0.

## Shifts and rotations

The operand says **how many times** the operation repeats. Each repetition goes through the ALU and updates the flags; C keeps the last bit that was shifted out.

| Instruction | What enters the freed bit          | What goes to C |
| ----------- | ---------------------------------- | -------------- |
| `SHL`       | 0 (on the right)                   | bit 7          |
| `SHR`       | 0 (on the left)                    | bit 0          |
| `SRA`       | a copy of bit 7 (the sign is kept) | bit 0          |
| `ROL`       | bit 7 (comes back on the right)    | bit 7          |
| `ROR`       | bit 0 (comes back on the left)     | bit 0          |

With a counter of `00`, nothing changes: ACC and the flags stay as they were. (In the original simulator, ACC received the output the ALU kept from the previous instruction; this was fixed in version 1.1, see [Differences from the original](#/documentacao/diferencas).)

## Jumps

All jumps use direct addressing: the operand is the target address.

| Instruction | Jumps when      | Usual reading, after `CMP x` |
| ----------- | --------------- | ---------------------------- |
| `JMP`       | always          | —                            |
| `JEQ`       | Z = 1           | ACC = x                      |
| `JGT`       | Z = 0 and N = 0 | result positive and not zero |
| `JGE`       | N = 0           | result positive or zero      |
| `JCY`       | C = 1           | ACC ≥ x (unsigned)           |

`JGT` and `JGE` look at bit 7 of the result, that is, they treat the result as a signed number. To compare unsigned values, use `JCY` after `CMP`.

## Subroutines and the stack

- `CAL addr` saves on the stack the address of the next instruction (the value of PC), decrements SP and jumps to `addr`.
- `RET` increments SP, reads the saved address and returns to it.

The stack starts at `FF` and grows downward (`FF`, `FE`, `FD`…). The CPU has no protection: too many calls can overwrite the program. When that happens, the simulator pauses execution and warns you.

## Control

- `HLT` stops the CPU. To run again, use **Reset**.
- `NOP` does nothing; it takes 1 byte and one execute pulse.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

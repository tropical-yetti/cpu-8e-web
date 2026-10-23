# Using the simulator

## Toolbar {#barra}

| Button    | Shortcut | What it does                                                                                                                                                                          |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Load**  | Ctrl+L   | Loads a `.bin` program: a file from your device or one of the original simulator's programs. Memory is cleared first and the CPU is reset, which also interrupts any run in progress. |
| **Save**  | Ctrl+S   | Downloads the memory contents as a `.bin` file (see [Saving](#gravar)).                                                                                                               |
| **Go**    | Ctrl+G   | Starts running or advances, depending on the mode.                                                                                                                                    |
| **Pause** | Ctrl+P   | Pauses at the next clock pulse. **Go** continues from there. With nothing running, it does nothing.                                                                                   |
| **Reset** | Ctrl+R   | Interrupts any run in progress, clears the registers and sets SP to `FF` and PC to `00`. Memory is not erased.                                                                        |
| **Help**  | F1       | Opens this documentation.                                                                                                                                                             |

Go, Pause and Reset start disabled and become available once a program is loaded or typed into memory.

## Modes {#modos}

| Mode             | Where the CPU stops and waits for you to press Go                                           |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Single Step**  | After each clock pulse, with the highlight on.                                              |
| **Single Cycle** | At the end of each instruction.                                                             |
| **Full Run**     | Only at `HLT`, at an invalid code, if the stack reaches the program, or if you press Pause. |

You can change the mode at any time; it takes effect at the next stopping point.

## Phase and status {#fase-status}

The **Phase** lamps show which part of the [instruction cycle](#/documentacao/ciclo) the CPU is in: **Fetch** (blue), **Operand** (yellow) or **Execute** (green). After a Reset they are all off.

The **Status** light shows the execution state:

- **red**: stopped (after a Reset, `HLT`, or Go with no program);
- **yellow**: paused, waiting for you to press Go;
- **green**: running.

## Clock {#clock}

The **Clock** selector, below the diagram, sets the time between two pulses. It goes from 10 (slowest) to 100 (no wait). The time follows the original simulator's formula: `510 − 5.144 × clock` milliseconds, with the decimals dropped.

| Clock        | 10  | 20  | 30  | 40  | 50  | 60  | 70  | 80  | 90  | 100 |
| ------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms per pulse | 459 | 408 | 356 | 305 | 253 | 202 | 150 | 99  | 48  | 0   |

The default is 50. In Single Step mode this time also passes after each press of Go, before the highlight goes off.

## Diagram {#diagrama}

While running, each clock pulse paints red the text of the registers that received a value and the bus segments the data went through. Hover over a part of the diagram, or tap it on a phone, to see a tip about it.

**Binary value:** press and hold ACC, A, B, IR, MAR, MDR, PC, SP or the ALU output to see its value in binary, such as `ACC=00000101`. It goes away when you release. With the keyboard, **Tab** to the register and press **Enter**.

**Accessibility:** screen readers find a table with the state of every register and hear, at each stop, what changed on the last clock pulse (for example, "Fetch: MAR:00").

## Memory {#memoria}

The table shows all 256 addresses:

- **Address**: from `00` to `FF`;
- **Memory**: the contents in hexadecimal;
- **Symbol**: the instruction those contents stand for (disassembly), or `DB` followed by the value when the byte is data.

The highlighted row follows execution: usually it is the address of the current instruction or of the last write.

Locations used by the [stack](#pilha) have a different background color, and the **Symbol** column shows the word "stack" where there is no instruction.

### Editing memory {#editar-memoria}

Tap a cell in the **Memory** column, type the value in hexadecimal (`00` to `FF`) and press **Enter**: the value is stored and editing moves to the next row, so you can type a program in sequence. **Esc** cancels the edit.

- Only hexadecimal values with one or two digits, from `00` to `FF`, upper or lower case, are accepted. Anything else is refused: a warning appears above the table, the field stays open and memory does not change.
- Editing past the end of the program extends the program up to that location.

The **Symbol** column is updated after each edit and each load. To tell code from data, it follows the paths execution can take starting at `00`: each instruction is followed by the next one, and jumps (`JMP`, `JEQ`, `JGT`, `JGE`, `JCY` and `CAL`) also lead to the operand address. Whatever no path reaches is shown as data, for example `DB 05`. A program that modifies its own code may be shown differently from how it runs.

### Saving {#gravar}

**Save** writes the bytes from `00` up to the last non-zero byte of memory, and never less than the loaded or edited program. So data the program wrote with `STO`, and return addresses kept on the stack, are included in the file too.

### Stack {#pilha}

The stack starts at `FF` and grows down with each `CAL` (see [Subroutines and the stack](#/documentacao/instrucoes)). The locations above SP, which hold return addresses, are highlighted in the table. If a `CAL` writes its return address inside the program, execution pauses with a message: the stack has reached the code. Pressing **Go** continues anyway, as on a real CPU, which has no such protection.

## Language {#idioma}

Use the selector at the top right to switch between Portuguese and English. Your choice is remembered in this browser.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'
[//]: # 'Partes derivadas de CPU8E_Sim.txt, CPU-8E v2.2, Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores; veja NOTICE.md.'

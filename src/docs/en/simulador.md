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

The **Clock** selector, in the control unit (CU) of the panel, sets the time between two pulses. It goes from 10 (slowest) to 100 (no wait). The time follows the original simulator's formula: `510 − 5.144 × clock` milliseconds, with the decimals dropped.

| Clock        | 10  | 20  | 30  | 40  | 50  | 60  | 70  | 80  | 90  | 100 |
| ------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms per pulse | 459 | 408 | 356 | 305 | 253 | 202 | 150 | 99  | 48  | 0   |

The default is 50. In Single Step mode this time also passes after each press of Go, before the highlight goes off.

## Panel {#diagrama}

The panel shows the CPU with the internal bus (**IB**) in the middle. On the left are PC, SP, ACC and the **ALU** block: inputs A and B, connected to the **Output** to show that the result combines both, and the **Status Register**, with the flags; on the right, MAR, MDR, IR and the control unit (CU), with the instruction decoder (ID) and the clock. Toward the memory go the address bus (**AB**), the data bus (**DB**) and the **RD** and **WR** signals.

While running, each clock pulse highlights the registers that received a value and lights up the wires the data went through, with an arrow showing where it goes. The colors are those of the original panel: IB blue, AB green, DB cyan and control signals yellow. Hover over an abbreviation, focus it with the keyboard or tap it on a phone to see what it stands for; the full list is in [Abbreviations](#/documentacao/siglas).

**Bases:** registers show their value in hexadecimal, with the `0x` prefix (for example, `0x05`). Tap ACC, A, B, IR, MAR, MDR, PC, SP or the ALU output to see the same value in decimal (`5`); tap again to see it in binary, with the `0b` prefix (`0b00000101`); one more tap goes back to hexadecimal. Each register keeps its own base. With the keyboard, **Tab** to the register and press **Enter**. Screen readers hear the value in all three bases.

**Classic look:** the **Panel look** selector, above the panel, switches to the original simulator's drawing, with the same positions, colors and tips. There, registers that changed get red text, and the binary value shows while the register is held down. The choice is kept in the browser.

**Accessibility:** screen readers find a table with the state of every register and hear, at each stop, what changed on the last clock pulse (for example, "Fetch: MAR:00").

## Memory {#memoria}

The selector above the memory picks how to see it: **Inside** (the default) or **Table**. The choice is kept in the browser.

### Inside (row × column) {#memoria-por-dentro}

Inside the chip, the 256 bytes form a grid of 16 rows by 16 columns. The address in the **MAR** picks a location: the 4 high bits (A7–A4, the first hex digit) go to the **row decoder**, on the left, and the 4 low bits (A3–A0, the second digit) to the **column decoder**, above. Each decoder turns on one of its 16 outputs, and the crossing is the location accessed. Address `3A`, for example, is at row 3, column A.

The row and column of the MAR stay marked in green, the color of the address bus, all the time. On a read pulse (M[MAR] → MDR), the cell at the crossing lights up in cyan, the color of the data bus; on a write pulse (MDR → M[MAR]), it lights up in yellow, the color of the control signals. The strip below the grid says what is happening, such as `Read: M[16] = 05 → MDR (row 1, column 6)`.

The grid also shows what the table shows: the cell pointed to by the **PC** has a marked corner, the **stack** has a different background and bytes that are **data** (`DB`) are in italics. Tap a cell to see its address, value and symbol; tap it again to edit.

Screen readers find the grid as a table in which only the chosen cell is announced ("Row 3, column A: 05, …"); the arrow keys change the cell, and a summary gives the row and column of the MAR and the access in progress.

### Table {#memoria-tabela}

The table shows all 256 addresses:

- **Address**: from `00` to `FF`;
- **Memory**: the contents in hexadecimal;
- **Symbol**: the instruction those contents stand for (disassembly), or `DB` followed by the value when the byte is data.

The highlighted row follows execution: usually it is the address of the current instruction or of the last write.

Locations used by the [stack](#pilha) have a different background color, and the **Symbol** column shows the word "stack" where there is no instruction.

### Editing memory {#editar-memoria}

In the **Inside** view, double-tap a cell (or choose the cell and press **Enter**, or type a hex digit). The rules are the same as in the table, described below.

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

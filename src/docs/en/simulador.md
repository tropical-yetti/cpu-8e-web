# Using the simulator

## Toolbar {#barra}

| Button    | Shortcut | What it does                                                                                                                               |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Load**  | Ctrl+L   | Loads a `.bin` program: a file from your device or one of the original simulator's programs. Memory is cleared first and the CPU is reset. |
| **Save**  | Ctrl+S   | Downloads the program in memory as a `.bin` file.                                                                                          |
| **Go**    | Ctrl+G   | Starts running or advances, depending on the mode.                                                                                         |
| **Pause** | Ctrl+P   | Pauses at the next clock pulse. **Go** continues from there.                                                                               |
| **Halt**  | Ctrl+H   | Stops execution. After that, **Go** and **Pause** stay disabled until a **Reset**.                                                         |
| **Reset** | Ctrl+R   | Clears the registers, sets SP to `FF` and PC to `00`. Memory is not erased.                                                                |
| **Help**  | F1       | Opens this documentation.                                                                                                                  |

Go, Pause, Halt and Reset start disabled and become available once a program is loaded or typed into memory.

## Modes {#modos}

| Mode             | Where the CPU stops and waits for you to press Go                 |
| ---------------- | ----------------------------------------------------------------- |
| **Single Step**  | After each clock pulse, with the highlight on.                    |
| **Single Cycle** | At the end of each instruction.                                   |
| **Full Run**     | Only at `HLT`, at an invalid code, or if you press Pause or Halt. |

You can change the mode at any time; it takes effect at the next stopping point.

## Phase and status {#fase-status}

The **Phase** lamps show which part of the [instruction cycle](#/documentacao/ciclo) the CPU is in: **Fetch** (blue), **Operand** (yellow) or **Execute** (green). After a Reset or Halt they are all off.

The **Status** light shows the execution state:

- **red**: halted (after a Reset, Halt or `HLT`);
- **yellow**: paused, waiting for you to press Go;
- **green**: running.

## Clock {#clock}

The **Clock** selector, below the diagram, sets the time between two pulses. It goes from 10 (slowest) to 100 (no wait). The time follows the original simulator's formula: `510 − 5.144 × clock` milliseconds, with the decimals dropped.

| Clock        | 10  | 20  | 30  | 40  | 50  | 60  | 70  | 80  | 90  | 100 |
| ------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ms per pulse | 459 | 408 | 356 | 305 | 253 | 202 | 150 | 99  | 48  | 0   |

The default is 50. In Single Step mode this time also passes after each press of Go, before the highlight goes off.

## Diagram {#diagrama}

While running, each clock pulse paints red the text of the registers that received a value and the bus segments the data went through. Hover over (or press and hold) a part of the diagram to see a tip about it.

**Binary value:** press and hold ACC, A, B, IR, MAR, MDR, PC, SP or the ALU output (ULA) to see its value in binary, such as `ACC=00000101`. It goes away when you release.

## Memory {#memoria}

The table shows all 256 addresses:

- **Address**: from `00` to `FF`;
- **Memory**: the contents in hexadecimal;
- **Symbol**: the instruction those contents stand for (disassembly).

The highlighted row follows execution: usually it is the address of the current instruction or of the last write.

### Editing memory {#editar-memoria}

Tap a cell in the **Memory** column, type the value in hexadecimal (`00` to `FF`) and press **Enter**: the value is stored and editing moves to the next row, so you can type a program in sequence. **Esc** cancels the edit.

- Anything that is not valid hexadecimal is stored as `00`, with no warning.
- Values above `FF` keep only their last two digits (`1FF` becomes `FF`).
- Editing past the end of the program extends the program up to that location.

The **Symbol** column is updated after each edit and each load. It reads memory from `00` as if everything were code, so data areas also appear as instructions (sometimes `XXX`).

### Saving {#gravar}

**Save** writes the bytes from `00` to the end of the program (the size of the loaded file, or the last edited location). Data the program wrote past that point, with `STO` or through the stack, is not included in the file.

## Language {#idioma}

Use the selector at the top right to switch between Portuguese and English. Your choice is remembered in this browser.

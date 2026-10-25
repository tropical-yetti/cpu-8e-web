# Differences from the original

Version 1.0 reproduced the CPU-8E simulator v2.2.3 (IESB, 2010) with **full fidelity**: the same arithmetic, the same sequence of micro-operations and the same button behavior, including the known defects. **Version 1.1** fixed those defects; up to it, automated tests compared this version, pulse by pulse, with the original Pascal code with the same fixes applied.

The **2.x series** changes the screen, not the CPU: the instructions, the clock pulses and the flags are the same as in 1.1. Since 2.0, each instruction is checked by tests that compare the memory, the registers and the flags before and after it.

## Fixed in version 1.1 {#corrigido}

| What changed                    | In the original (and in version 1.0)                                                                                                    | Now                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Shift with counter `00`         | `SHL`, `SHR`, `SRA`, `ROL` and `ROR` with operand `00` copied into ACC the output the ALU kept from the previous instruction.           | ACC and the flags stay as they were.                                                                                   |
| `STO` write                     | The memory write was animated twice: 3 clock pulses in the execute phase.                                                               | A single write: 2 pulses.                                                                                              |
| `NOT` order                     | The ALU showed the result before the pulse animated ACC → A.                                                                            | First ACC → A, then the ALU computes. The result is the same.                                                          |
| Halt button                     | Ended execution without allowing it to continue; it was only useful to interrupt before a Reset.                                        | Removed, along with the Ctrl+H shortcut. To interrupt, use **Pause** or **Reset**.                                     |
| Reset or Load during a Full Run | Execution did not stop: the CPU carried on from the cleared state and restarted the program (the new one, for Load).                    | Execution is interrupted.                                                                                              |
| Pause while stopped             | The next **Go** did not start execution; you had to press it again.                                                                     | With nothing running, Pause does nothing.                                                                              |
| Go with no program              | The warning appeared, but the status light stayed green.                                                                                | The status light goes back to red.                                                                                     |
| Initial decoder text            | Before the first Reset or load, the Portuguese interface showed `ID:NOP` (the English abbreviation) and then switched to `DI:…`.        | It starts with `DI:NOP` in Portuguese. In English it is always `ID`.                                                   |
| Memory editing                  | Text that was not hexadecimal became `00` without warning, and values above `FF` were cut down.                                         | Only values from `00` to `FF` are accepted; anything else is refused with a warning, and memory does not change.       |
| Save                            | Saved only up to the end of the loaded or edited program; data written past it, with `STO` or through the stack, was left out.          | Saves up to the last non-zero byte of memory, and never less than the program.                                         |
| Symbol column                   | Treated all memory as code, starting at `00`. Data showed up as instructions, and a data byte could misalign the instructions after it. | Follows the paths execution can take, including jumps, and shows as `DB 05` whatever no path reaches.                  |
| Stack                           | Grew down from `FF` and could overwrite the program without warning.                                                                    | Locations used by the stack are highlighted, and execution pauses with a message when a `CAL` writes over the program. |

The `v1.0.0` tag in the [project repository](https://github.com/tropical-yetti/cpu-8e-web) keeps the version with the original behavior.

## What's new in the 2.x series {#serie-2}

- **New panel**, with wires colored by bus and arrows showing where the data goes, abbreviations explained by captions and the ALU block with its inputs connected to the output and the Status Register. The original drawing is still there in the **Classic** look.
- **Inside the memory**: the 16 × 16 grid with the row and column decoders, following the MAR. The original table is still there in the **Table** selector.
- Registers show their value in hexadecimal, decimal or binary; in the original, only in binary, while the register was held down.
- A **first-visit guide** and **?** buttons with balloons that explain each part of the screen.
- On a write, the new value shows up in memory on the WR pulse itself, not only on the next pulse.

## Differences due to the platform {#plataforma}

Some things cannot work the same way in a browser:

- **Help** opens this documentation; the original opened a text file in the `gedit` editor, which only worked on Linux.
- There is no **Exit** button: just close the tab.
- **Load** also offers `teste.bin` and `allopcodes.bin`, which came in the original program's folder.
- **Save** downloads the file through the browser instead of opening a window to pick a folder.
- Pressing **Go** during a Full Run does nothing. In the original, it started a second run inside the first one and scrambled the CPU state.
- The interface is also available in English, with the panel tips translated and the diagram abbreviations in English (ALU, CU, ID, IB, DB, AB).
- In the classic look, on a phone, the diagram scrolls sideways when the screen is narrow.

If you find any other difference from the original, it is a bug in this version; [report it in the project repository](https://github.com/tropical-yetti/cpu-8e-web).

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

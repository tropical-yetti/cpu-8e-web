# Differences from the original

This version reproduces the CPU-8E simulator v2.2.3 (IESB, 2010) with **full fidelity**: the same arithmetic, the same sequence of micro-operations and the same button behavior, including the known defects. Fidelity is checked by automated tests that compare this version with the original Pascal code, pulse by pulse.

Fixes for the defects are planned for version 1.1.

## Differences due to the platform

Some things cannot work the same way in a browser:

- **Help** opens this documentation; the original opened a text file in the `gedit` editor, which only worked on Linux.
- There is no **Exit** button: just close the tab.
- **Load** also offers `teste.bin` and `allopcodes.bin`, which came in the original program's folder.
- **Save** downloads the file through the browser instead of opening a window to pick a folder.
- Pressing **Go** during a Full Run does nothing. In the original, it started a second run inside the first one and scrambled the CPU state.
- The interface is also available in English, with the panel tips translated.
- On a phone, the diagram scrolls sideways when the screen is narrow.

## Behavior inherited from the original

These behaviors come from the original simulator and were kept on purpose in version 1.0.

| Behavior                        | What happens                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shift with counter `00`         | `SHL`, `SHR`, `SRA`, `ROL` and `ROR` with operand `00` should leave ACC unchanged, but copy into it the output the ALU kept from the previous instruction. |
| Repeated `STO` write            | The memory write is animated twice, one extra clock pulse. The result does not change.                                                                     |
| Incomplete save                 | **Save** only writes up to the end of the loaded or edited program. Data written past that point, with `STO` or through the stack, is left out.            |
| Unvalidated editing             | In the memory table, text that is not hexadecimal becomes `00` with no warning, and values above `FF` are cut.                                             |
| Unprotected stack               | The stack grows down from `FF` and can overwrite the program if there are too many calls.                                                                  |
| Linear disassembly              | The **Symbol** column treats all memory as code, starting at `00`. Data appears as instructions, and a data byte can misalign the instructions after it.   |
| Pause while stopped             | If you press **Pause** with nothing running, the next **Go** does not start execution; you need to press Go again.                                         |
| Go with no program              | The warning appears, but the status light stays green.                                                                                                     |
| Reset or Load during a Full Run | Execution does not stop: the CPU carries on from the cleared state, that is, it restarts the program (the new one, for Load). Press **Halt** first.        |
| Initial decoder text            | Before the first Reset or load, the decoder shows `ID:NOP`, a label that came with the original form.                                                      |

If you find any other difference from the original, it is a bug in this version; [report it in the project repository](https://github.com/tropical-yetti/cpu-8e-web).

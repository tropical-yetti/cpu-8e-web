# Getting started

The CPU-8E is an 8-bit CPU designed to teach how a processor works inside. The simulator shows every register, the ALU, the buses and the memory, and lets you follow a program one clock pulse at a time.

This page takes about five minutes and walks through the basics: loading a program, running it slowly and checking the result.

## 1. Load a program

1. On the **Simulator** page, press **Load**.
2. Choose **teste.bin**, one of the programs included with the original simulator.
3. A message confirms how many bytes were read. Press **OK**.

The table on the right (or below, on a phone) shows the memory: the **Address**, the contents in hexadecimal (**Memory**) and the matching instruction (**Symbol**). The program starts at address `00` with `LOD [16]`.

## 2. Run it step by step

The initial mode is **Single Step**. Each press of **Go** advances one clock pulse:

- registers that changed get **red** text;
- the bus segments the data went through turn **red**;
- the **Phase** lamp shows whether the CPU is fetching the instruction, fetching the operand or executing;
- the **Status** light turns yellow while the CPU waits for you.

Press **Go** a few times and watch the first cycle: PC goes to MAR, memory hands the instruction code to MDR, MDR moves to IR and the decoder (DI) shows `LOD[16]`.

## 3. Run the whole program

Change the **Mode** to **Full Run** and pick clock **100** (the fastest). Press **Go**: the CPU runs up to the `HLT` instruction and the status light turns red. At the end, ACC is `FF`.

## 4. Start over

**Reset** clears the registers and sets PC back to `00`, keeping the program in memory. You can repeat the run as many times as you like, in any mode.

> **Tip:** press and hold a register to see its value in binary, such as `ACC=11111111`.

## Next steps

- [The CPU-8E](#/documentacao/cpu) explains each part of the diagram.
- [Instruction cycle](#/documentacao/ciclo) details what happens on each pulse.
- [Writing programs](#/documentacao/programas) shows how to create your own programs.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

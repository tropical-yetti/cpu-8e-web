# Getting started

The CPU-8E is an 8-bit CPU designed to teach how a processor works inside. The simulator shows every register, the ALU, the buses and the memory, and lets you follow a program one clock pulse at a time.

This page takes about five minutes and walks through the basics: loading a program, running it slowly and checking the result.

On your first visit, the simulator opens a **guide** with balloons pointing at each part of the screen. To see it again, use the **Show the guide** button below the panel; each part also has a **?** button that explains just that part ([Guide and help](#/documentacao/simulador#guia)).

## 1. Load a program

1. On the **Simulator** page, press **Load**.
2. Choose **teste.bin**, one of the programs included with the original simulator.
3. A message confirms how many bytes were read. Press **OK**.

On the right (or below, on a phone) is the memory, seen **inside**: the 256 bytes in a grid of 16 rows by 16 columns, where the first digit of the address is the row and the second is the column. The program starts at address `00` with `LOD [16]`; tap a cell to see the instruction it holds. The **Table** selector shows the same memory as a list, with the **Address**, the contents and the **Symbol**.

## 2. Run it step by step

The initial mode is **Single Step**. Each press of **Go** advances one clock pulse:

- registers that changed are **highlighted**;
- the wires the data went through **light up**, with an arrow showing where it goes;
- the **Phase** lamp shows whether the CPU is fetching the instruction, fetching the operand or executing;
- the **Status** light turns yellow while the CPU waits for you.

Press **Go** a few times and watch the first cycle: PC goes to MAR, memory hands the instruction code to MDR, MDR moves to IR and the decoder (ID) shows `LOD[16]`.

## 3. Run the whole program

Change the **Mode** to **Full Run** and pick clock **100** (the fastest). Press **Go**: the CPU runs up to the `HLT` instruction and the status light turns red. At the end, ACC is `FF`.

## 4. Start over

**Reset** clears the registers and sets PC back to `00`, keeping the program in memory. You can repeat the run as many times as you like, in any mode.

> **Tip:** tap a register to change the base of its value: from hexadecimal (`0xFF`) to decimal (`255`) and binary (`0b11111111`).

## Next steps

- [The CPU-8E](#/documentacao/cpu) explains each part of the diagram.
- [Instruction cycle](#/documentacao/ciclo) details what happens on each pulse.
- [Writing programs](#/documentacao/programas) shows how to create your own programs.

[//]: # 'SPDX-License-Identifier: GPL-3.0-or-later'

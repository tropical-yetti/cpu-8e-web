/**
 * Fios do painel novo (ADR 0005) e os segmentos do desenho original que os
 * acendem.
 *
 * O núcleo diz, a cada pulso, quais segmentos do formulário original o dado
 * percorre (src/core/barramentos.ts). O painel novo tem menos traços que o
 * original: cada fio dele acende quando passa dado por um dos seus segmentos.
 * Assim os dois visuais leem o mesmo estado, sem regra própria.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Segmentos do original que acendem cada fio do painel novo. */
export const SEGMENTOS_DO_FIO = {
  // Entre os registradores e o barramento interno (BI)
  pcEntra: ['shPCIn1'],
  pcSai: ['shPCOut1'],
  spSai: ['shSPOut1'],
  accEntra: ['shACCIn1'],
  accSai: ['shACCOut1'],
  aEntra: ['shAIn1'],
  bEntra: ['shBIn1'],
  ulaSai: ['shULAOut1'],
  marEntra: ['shMARIn1'],
  marSai: ['shMAROut1'],
  mdrEntra: ['shMDRIn1'],
  mdrSai: ['shMDROut1'],
  irEntra: ['shIRIn1'],
  bi: ['shBI1'],
  // Entre a CPU e a memória
  be: ['shBE1'],
  bdParaCpu: ['shMDRIn3'],
  bdParaMemoria: ['shMDROut3'],
  rd: ['shRD1'],
  wr: ['shWR1'],
  // Dentro da CPU, fora do BI
  irParaUc: ['shIROut1'],
  flags: ['shZOut1', 'shNOut1', 'shCOut1'],
} as const satisfies Record<string, readonly string[]>

export type Fio = keyof typeof SEGMENTOS_DO_FIO

/** Fios acesos, dados os segmentos acesos no pulso atual. */
export function fiosAcesos(segmentos: Iterable<string>): Set<Fio> {
  const acesos = new Set(segmentos)
  const fios = new Set<Fio>()
  for (const [fio, lista] of Object.entries(SEGMENTOS_DO_FIO) as [Fio, readonly string[]][]) {
    if (lista.some((segmento) => acesos.has(segmento))) fios.add(fio)
  }
  return fios
}

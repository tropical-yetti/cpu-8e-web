/**
 * Visual do painel (ADR 0005): o novo, padrão, ou o clássico, desenhado a
 * partir do formulário original. A escolha fica guardada no navegador e vale
 * para o simulador e para a documentação.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ref } from 'vue'

export type Visual = 'novo' | 'classico'

export const VISUAIS: readonly Visual[] = ['novo', 'classico']

const CHAVE = 'cpu8e.visual'

function visualSalvo(): Visual {
  try {
    return localStorage.getItem(CHAVE) === 'classico' ? 'classico' : 'novo'
  } catch {
    return 'novo'
  }
}

const visual = ref<Visual>(visualSalvo())

function mudarVisual(novo: Visual) {
  visual.value = novo
  try {
    localStorage.setItem(CHAVE, novo)
  } catch {
    // Sem armazenamento, a escolha vale só para esta visita.
  }
}

export function useVisual() {
  return { visual, mudarVisual }
}

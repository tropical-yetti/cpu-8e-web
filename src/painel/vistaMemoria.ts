/**
 * Vista da memória (ADR 0006): por dentro (linha × coluna), padrão, ou a
 * tabela de antes. A escolha fica guardada no navegador.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ref } from 'vue'

export type VistaMemoria = 'porDentro' | 'tabela'

export const VISTAS_MEMORIA: readonly VistaMemoria[] = ['porDentro', 'tabela']

const CHAVE = 'cpu8e.vistaMemoria'

function vistaSalva(): VistaMemoria {
  try {
    return localStorage.getItem(CHAVE) === 'tabela' ? 'tabela' : 'porDentro'
  } catch {
    return 'porDentro'
  }
}

const vista = ref<VistaMemoria>(vistaSalva())

function mudarVista(nova: VistaMemoria) {
  vista.value = nova
  try {
    localStorage.setItem(CHAVE, nova)
  } catch {
    // Sem armazenamento, a escolha vale só para esta visita.
  }
}

export function useVistaMemoria() {
  return { vista, mudarVista }
}

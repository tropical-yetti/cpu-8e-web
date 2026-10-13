/**
 * Rotas do site. Usa o modo "hash" (#/sobre) porque o GitHub Pages não
 * redireciona caminhos desconhecidos para o index.html.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import SimuladorView from '@/views/SimuladorView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'simulador', component: SimuladorView },
    {
      path: '/documentacao',
      name: 'documentacao',
      component: () => import('@/views/DocumentacaoView.vue'),
    },
    { path: '/sobre', name: 'sobre', component: () => import('@/views/SobreView.vue') },
    // Reservado para os exercícios (depois da v1.2).
    // { path: '/exercicios/:id', name: 'exercicio', component: ... },
  ],
})

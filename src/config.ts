// SPDX-License-Identifier: GPL-3.0-or-later

/** Repositório deste projeto (código-fonte correspondente, exigido pela GPL). */
export const URL_CODIGO_FONTE = 'https://github.com/tropical-yetti/cpu-8e-web'

/** Pedido de ajuda para testar o site com leitores de tela de verdade. */
export const ISSUE_LEITOR_DE_TELA = `${URL_CODIGO_FONTE}/issues/12`

/** Repositório do simulador original. */
export const URL_CODIGO_ORIGINAL = 'https://github.com/wanderlan/cpu-8e'

/** Texto oficial da licença. */
export const URL_LICENCA = 'https://www.gnu.org/licenses/gpl-3.0.html'

/** Autor do simulador original e o seu currículo Lattes (todo crédito a ele leva o link). */
export const AUTOR_ORIGINAL = {
  nome: 'Joel Guilherme da Silva Filho',
  lattes: 'http://lattes.cnpq.br/7746085908957322',
}

/** Endereço de um commit no GitHub. */
export function urlDoCommit(commit: string): string {
  return `${URL_CODIGO_FONTE}/commit/${commit}`
}

/**
 * Leitura dos programas de exemplo escritos na documentação.
 *
 * Os exemplos ficam em blocos ```cpu8e, uma linha por instrução:
 *
 *     00: D1 20     LOD [20]
 *     20: 05        dado
 *     ; espera: ACC=0C M[22]=0C
 *
 * Cada linha começa com o endereço (hex) seguido de dois-pontos e dos bytes
 * (pares hex); o resto da linha é comentário. A linha "; espera:" (ou
 * "; expect:") diz o resultado depois do HALT, e é conferida pelos testes.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ProgramaDocumentado {
  bytes: Uint8Array
  /** Resultados esperados: registrador ou "M[xx]" → valor. */
  esperado: Record<string, number>
}

const LINHA_DE_CODIGO = /^([0-9A-Fa-f]{2}):((?:\s+[0-9A-Fa-f]{2}(?=\s|$))+)/
const LINHA_ESPERADA = /^;\s*(?:espera|expect):\s*(.*)$/i

export function lerPrograma(texto: string): ProgramaDocumentado {
  const memoria = new Uint8Array(256)
  let fim = 0
  const esperado: Record<string, number> = {}

  for (const linhaBruta of texto.split('\n')) {
    const linha = linhaBruta.trim()
    const codigo = LINHA_DE_CODIGO.exec(linha)
    if (codigo) {
      const inicio = Number.parseInt(codigo[1]!, 16)
      const bytes = codigo[2]!
        .trim()
        .split(/\s+/)
        .map((b) => Number.parseInt(b, 16))
      memoria.set(bytes, inicio)
      fim = Math.max(fim, inicio + bytes.length)
      continue
    }
    const expectativa = LINHA_ESPERADA.exec(linha)
    if (expectativa) {
      for (const par of expectativa[1]!.split(/\s+/).filter(Boolean)) {
        const [nome, valor] = par.split('=')
        if (nome && valor) esperado[nome.toUpperCase()] = Number.parseInt(valor, 16)
      }
    }
  }
  return { bytes: memoria.slice(0, fim), esperado }
}

/**
 * Gera os gabaritos dos testes de fidelidade executando cada programa de
 * tests/fixtures/programas.ts no simulador de referência (cpu8e_ref.pas).
 *
 * A referência é o código Pascal original. Compilada com -dCORRIGIDO, ela
 * aplica as mesmas correções da v1.1 que o núcleo TypeScript, cada uma num
 * bloco {$IFDEF CORRIGIDO} fácil de revisar. Os gabaritos usam essa
 * variante; sem o define, o executável continua sendo o simulador original
 * (o comportamento da v1.0, guardado na tag v1.0.0).
 *
 * Requer o Free Pascal (fpc). Uso:  npm run gabaritos
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { PROGRAMAS } from '../../tests/fixtures/programas.ts'

const aqui = fileURLToPath(new URL('.', import.meta.url))
const destino = fileURLToPath(new URL('../../tests/fixtures/gabaritos/', import.meta.url))
const temporario = mkdtempSync(join(tmpdir(), 'cpu8e-'))

/**
 * Compila o simulador de referência e devolve o caminho do executável.
 * `corrigido` (padrão) aplica as correções da v1.1; `false` compila o original.
 */
export function compilarReferencia({ corrigido = true, pasta = temporario } = {}): string {
  const saida = join(pasta, corrigido ? 'corrigido' : 'original')
  mkdirSync(saida, { recursive: true })
  const opcoes = ['-v0', `-FE${saida}`, ...(corrigido ? ['-dCORRIGIDO'] : [])]
  execFileSync('fpc', [...opcoes, join(aqui, 'cpu8e_ref.pas')], { stdio: 'inherit' })
  return join(saida, 'cpu8e_ref')
}

/** Executa um programa no simulador de referência e devolve o rastro em texto. */
export function rastroOriginal(executavel: string, bytes: Uint8Array, maxEventos = 5000): string {
  const arquivo = join(temporario, `programa-${Date.now()}-${Math.random()}.bin`)
  writeFileSync(arquivo, bytes)
  return execFileSync(executavel, [arquivo, String(maxEventos)], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const executavel = compilarReferencia()
  mkdirSync(destino, { recursive: true })
  for (const programa of PROGRAMAS) {
    const rastro = rastroOriginal(executavel, programa.bytes)
    writeFileSync(join(destino, `${programa.nome}.jsonl`), rastro)
    console.log(`${programa.nome}: ${rastro.trim().split('\n').length} eventos`)
  }

  // Tabela completa da ULA (todas as operações × A × B).
  execFileSync('fpc', ['-v0', `-FE${temporario}`, join(aqui, 'ula_tabela.pas')], {
    stdio: 'inherit',
  })
  const tabela = join(temporario, 'ula.bin')
  execFileSync(join(temporario, 'ula_tabela'), [tabela])
  writeFileSync(
    join(destino, '..', 'ula-original.bin.gz'),
    gzipSync(readFileSync(tabela), { level: 9 }),
  )
  console.log('ula-original.bin.gz atualizado')
}

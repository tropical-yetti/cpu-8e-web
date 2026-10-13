/**
 * Gera os gabaritos dos testes de fidelidade executando cada programa de
 * tests/fixtures/programas.ts no simulador original (cpu8e_ref.pas).
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

/** Compila o simulador de referência e devolve o caminho do executável. */
export function compilarReferencia(pasta = temporario): string {
  execFileSync('fpc', ['-v0', `-FE${pasta}`, join(aqui, 'cpu8e_ref.pas')], { stdio: 'inherit' })
  return join(pasta, 'cpu8e_ref')
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

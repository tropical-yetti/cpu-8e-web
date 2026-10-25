/**
 * Leitor de tela simulado (issue #12): o que seria dito no painel, na
 * memória por dentro e a cada pulso de clock. Ninguém no projeto usa leitor
 * de tela no dia a dia, então isto é o que dá para garantir no CI; o teste
 * com leitores reais continua pendente.
 *
 * O leitor virtual monta as frases a partir do DOM, e não da árvore de
 * acessibilidade de cada navegador, então basta rodar num projeto.
 *
 * Adaptado do MEM-8E Web (tests/e2e/leitor-de-tela.spec.ts) em 2026-10-25 (ADR 0004).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, test, type Page } from '@playwright/test'
import { frases, lerTudo, ligarLeitor, limparFrases } from './leitor-virtual'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'computador', 'o leitor virtual não depende do navegador')
  await page.goto('./')
})

async function lerAPagina(page: Page) {
  await ligarLeitor(page)
  return lerTudo(page)
}

async function carregarTeste(page: Page) {
  await page.getByRole('button', { name: 'Carregar', exact: true }).click()
  await page.getByRole('button', { name: 'teste.bin' }).click()
  await page.getByRole('button', { name: 'OK' }).click()
}

test.describe('ler a página inteira', () => {
  test('a memória por dentro passa por uma célula só', async ({ page }) => {
    const lidas = await lerAPagina(page)
    expect(lidas.filter((f) => f.startsWith('gridcell'))).toEqual([
      'gridcell, Linha 0, coluna 0: 00, valor hexadecimal 0 0, endereço do MAR, apontada pelo PC, column index 1, current location',
    ])
    expect(lidas).toContain('end of document')
  })

  test('os registradores dizem o nome e o valor nas três bases', async ({ page }) => {
    const lidas = await lerAPagina(page)
    for (const nome of ['PC', 'SP', 'ACC', 'A', 'B', 'Saída da ULA', 'MAR', 'MDR', 'IR']) {
      expect(lidas).toContainEqual(
        expect.stringMatching(
          new RegExp(`^button, ${nome}: 0x[0-9A-F]{2}, \\d+ em decimal, [01]{8} em binário\\.`),
        ),
      )
    }
  })

  test('sem programa, não há um parágrafo vazio no lugar do nome do programa', async ({ page }) => {
    const lidas = await lerAPagina(page)
    const visual = lidas.indexOf('radiogroup, Visual do painel')
    expect(lidas[visual - 1]).not.toBe('paragraph')
  })

  test('com programa, o nome dele é lido antes do painel', async ({ page }) => {
    await carregarTeste(page)
    const lidas = await lerAPagina(page)
    const visual = lidas.indexOf('radiogroup, Visual do painel')
    const antes = lidas.slice(visual - 8, visual)
    expect(antes.some((f) => f.includes('Programa:'))).toBe(true)
    expect(antes).toContain('teste.bin')
  })

  test('o visual clássico é lido pela descrição, e não por dentro do desenho', async ({ page }) => {
    await page.getByRole('radio', { name: 'Clássico' }).click()
    const lidas = await lerAPagina(page)
    const i = lidas.findIndex((f) => f.startsWith('image, Diagrama da CPU-8E'))
    expect(i).toBeGreaterThan(-1)
    // Depois da descrição vêm os controles por cima do desenho, nunca os textos dele.
    expect(lidas[i + 1]).toMatch(/^button, /)
    expect(lidas).not.toContain('ULA:00')
  })
})

test.describe('navegar na grade', () => {
  test('cada seta anuncia só a nova célula: linha, coluna, dígitos e símbolo', async ({ page }) => {
    await carregarTeste(page)
    await page.locator('td[data-endereco="00"]').click()
    await ligarLeitor(page)
    const passos: [string, string][] = [
      ['ArrowRight', 'Linha 0, coluna 1: 16, valor hexadecimal 1 6, [16], column index 2'],
      ['ArrowDown', 'Linha 1, coluna 1: 14, valor hexadecimal 1 4, [14], column index 2'],
      ['End', 'Linha 1, coluna F: 00, valor hexadecimal 0 0, column index 16'],
      ['ArrowLeft', 'Linha 1, coluna E: 00, valor hexadecimal 0 0, column index 15'],
    ]
    for (const [tecla, dito] of passos) {
      await limparFrases(page)
      await page.keyboard.press(tecla)
      await expect.poll(() => frases(page)).toEqual([`gridcell, ${dito}`])
    }
  })

  test('o resumo da grade diz a linha e a coluna do MAR e a leitura', async ({ page }) => {
    await carregarTeste(page)
    const grade = page.getByRole('grid')
    await expect(grade).toHaveAccessibleDescription(/MAR = 00: linha 0, coluna 0\.$/)
    await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')
    await page.getByRole('button', { name: 'Executar', exact: true }).click()
    await page.getByRole('button', { name: 'Executar', exact: true }).click()
    await expect(grade).toHaveAccessibleDescription(
      /Leitura: M\[00\] = D1 → MDR \(linha 0, coluna 0\)\.$/,
    )
  })
})

test.describe('o que muda é anunciado', () => {
  test('cada pulso de clock diz a fase e o que mudou', async ({ page }) => {
    await carregarTeste(page)
    await ligarLeitor(page)
    await page.getByRole('button', { name: 'Executar', exact: true }).click()
    await expect
      .poll(() => frases(page))
      .toContainEqual(expect.stringMatching(/^polite: Busca: MAR:00/))
  })
})

test.describe('árvore de acessibilidade', () => {
  test('o painel: registradores como botões, flags, decodificador e clock', async ({ page }) => {
    await expect(page.locator('[data-visual="novo"]')).toMatchAriaSnapshot(`
      - region "Diagrama da CPU-8E com registradores, ULA, barramentos e unidade de controle":
        - heading "CPU-8E" [level=2]
        - 'button /^PC: 0x00, 0 em decimal/'
        - 'button /^SP: 0xFF, 255 em decimal/'
        - 'button /^ACC: 0x00/'
        - 'button /^A: 0x00/'
        - 'button /^B: 0x00/'
        - 'button /^Saída da ULA: 0x00/'
        - 'button /^MAR: 0x00/'
        - 'button /^MDR: 0x00/'
        - 'button /^IR: 0x00/'
        - text: Status Register Z 0 N 0 C 0 UC DI NOP
        - combobox "Velocidade do clock"
    `)
  })

  test('a memória: seletor de vista, ajuda, uma célula só e o resumo', async ({ page }) => {
    await expect(page.locator('[data-guia="memoria"]')).toMatchAriaSnapshot(`
      - region "Memória principal (256 bytes)":
        - heading "Memória principal (256 bytes)" [level=2]
        - radiogroup "Como mostrar a memória":
          - radio "Por dentro" [checked]
          - radio "Tabela"
        - 'button "Ajuda: A memória por dentro"'
        - paragraph
        - grid "Memória por dentro (linha × coluna)":
          - rowgroup:
            - row:
              - 'gridcell "Linha 0, coluna 0: 00, valor hexadecimal 0 0, endereço do MAR, apontada pelo PC"'
        - paragraph: "MAR = 00: linha 0, coluna 0."
        - paragraph: 'Endereço 00: 00 · —'
    `)
  })
})

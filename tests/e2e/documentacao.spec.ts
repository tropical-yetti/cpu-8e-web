/**
 * Documentação no site: navegação, idiomas, exemplos e ajuda contextual.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, test } from '@playwright/test'

test('Ajuda abre a documentação e o menu navega entre as páginas', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Ajuda', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Primeiros passos' })).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Páginas da documentação' })
    .getByRole('link', { name: 'Conjunto de instruções' })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Conjunto de instruções' }),
  ).toBeVisible()
  await expect(page.getByRole('row', { name: /LOD.*91h.*D1h/ })).toBeVisible()
})

test('a documentação acompanha o idioma escolhido', async ({ page }) => {
  await page.goto('./#/documentacao/ciclo')
  await expect(page.getByRole('heading', { level: 1, name: 'Ciclo de instrução' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en')
  await expect(page.getByRole('heading', { level: 1, name: 'Instruction cycle' })).toBeVisible()
})

test('um exemplo da documentação carrega no simulador e dá o resultado anunciado', async ({
  page,
}) => {
  await page.goto('./#/documentacao/programas')
  await page.getByRole('button', { name: 'Carregar no simulador' }).first().click()
  await expect(page.getByText(/Foram lidos 34\(22h\) bytes/)).toBeVisible()
  await page.getByRole('button', { name: 'OK' }).click()
  await page.locator('.campo-modo select').selectOption('continuo')
  await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')
  await page.getByRole('button', { name: 'Executar', exact: true }).click()
  await expect(page.locator('img.semaforo')).toHaveAttribute('alt', 'Parada (vermelho)', {
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: /^ACC: 0x0C,/ })).toBeVisible()
  await expect(page.locator('tr[data-endereco="34"]')).toContainText('0C')
})

test('a ajuda contextual leva à seção certa', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Ajuda sobre Modo:' }).click()
  await expect(page).toHaveURL(/documentacao\/simulador#modos$/)
  await expect(page.locator('#modos')).toBeInViewport()
})

test('a página Siglas lista as siglas do painel nos dois idiomas', async ({ page }) => {
  await page.goto('./#/documentacao/siglas')
  await expect(page.getByRole('heading', { level: 1, name: 'Siglas' })).toBeVisible()
  await expect(page.getByRole('row', { name: /ULA.*Unidade lógica e aritmética/ })).toBeVisible()
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en')
  await expect(page.getByRole('heading', { level: 1, name: 'Abbreviations' })).toBeVisible()
  await expect(page.getByRole('row', { name: /ALU.*Arithmetic logic unit/ })).toBeVisible()
})

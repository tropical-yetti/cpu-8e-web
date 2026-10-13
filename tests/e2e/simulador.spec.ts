/**
 * Fluxos principais do simulador num navegador de verdade.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, test, type Page } from '@playwright/test'

async function carregarTeste(page: Page) {
  await page.goto('./')
  await page.getByRole('button', { name: 'Carregar', exact: true }).click()
  await page.getByRole('button', { name: 'teste.bin' }).click()
  await expect(page.getByText('Foram lidos 25(19h) bytes para a memória.')).toBeVisible()
  await page.getByRole('button', { name: 'OK' }).click()
}

const diagrama = (page: Page) => page.getByRole('img', { name: /Diagrama da CPU-8E/ })
const status = (page: Page) => page.locator('img.semaforo')

test('carrega teste.bin e mostra o disassembly', async ({ page }) => {
  await carregarTeste(page)
  await expect(page.getByText('Programa: teste.bin')).toBeVisible()
  const linha0 = page.locator('tr[data-endereco="0"]')
  await expect(linha0).toContainText('D1')
  await expect(linha0).toContainText('LOD')
  await expect(diagrama(page)).toContainText('DI:HLT')
})

test('passo a passo avança um pulso de clock por vez', async ({ page }) => {
  await carregarTeste(page)
  const executar = page.getByRole('button', { name: 'Executar', exact: true })

  await executar.click()
  await expect(status(page)).toHaveAttribute('alt', 'Pausa (amarelo)')
  await expect(page.locator('.lampada.acesa')).toHaveText('Busca')
  await expect(diagrama(page)).toContainText('MAR:00')

  await executar.click()
  await expect(diagrama(page)).toContainText('MDR:D1')
  await expect(diagrama(page)).toContainText('PC:01')
})

test('execução contínua roda teste.bin até o HALT', async ({ page }) => {
  await carregarTeste(page)
  await page.locator('.campo-modo select').selectOption('continuo')
  await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')
  await page.getByRole('button', { name: 'Executar', exact: true }).click()
  await expect(status(page)).toHaveAttribute('alt', 'Parada (vermelho)', { timeout: 15_000 })
  await expect(diagrama(page)).toContainText('ACC:FF')
})

test('editar a memória atualiza o símbolo e avança para a linha seguinte', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '00: editar o endereço 00' }).click()
  await page.keyboard.type('91')
  await page.keyboard.press('Enter')
  await page.keyboard.type('07')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.locator('tr[data-endereco="0"]')).toContainText('LOD')
  await expect(page.locator('tr[data-endereco="1"]')).toContainText('07')
  await expect(page.getByRole('button', { name: 'Executar', exact: true })).toBeEnabled()
})

test('troca o idioma para inglês e lembra a escolha', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en')
  await expect(page.getByRole('button', { name: 'Load', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Load', exact: true })).toBeVisible()
})

test('mostra os avisos de licença', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('contentinfo')).toContainText('Joel Guilherme da Silva Filho')
  await page.getByRole('link', { name: /Licença GPL-3.0-or-later/ }).click()
  await expect(page.getByRole('heading', { name: 'Licença' })).toBeVisible()
  await expect(page.getByText(/SEM NENHUMA GARANTIA/)).toBeVisible()
})

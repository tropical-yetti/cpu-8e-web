/**
 * Guia de primeiro acesso: abre sozinho na primeira visita, anda pelos
 * passos, é lembrado, e cada "?" abre só o balão da sua parte.
 *
 * Adaptado do MEM-8E Web (tests/e2e/guia.spec.ts) em 2026-10-25 (ADR 0004).
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('primeiro acesso', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('o guia abre sozinho e percorre todos os passos', async ({ page }) => {
    await page.goto('./')
    const balao = page.getByRole('dialog')
    await expect(balao).toContainText('1 de 10')
    await expect(page.getByRole('heading', { name: 'Uma CPU de 8 bits, aberta' })).toBeFocused()

    await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page.getByRole('heading', { name: 'Comandos' })).toBeVisible()

    // O balão não bloqueia a página: dá para fazer o que ele sugere.
    await page.getByRole('button', { name: 'Carregar', exact: true }).click()
    await page.getByRole('button', { name: 'teste.bin' }).click()
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByText('Programa: teste.bin')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Comandos' })).toBeVisible()

    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(balao).toContainText('1 de 10')
    for (let i = 0; i < 9; i++) await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page.getByRole('heading', { name: 'Pronto' })).toBeVisible()
    await page.getByRole('button', { name: 'Começar' }).click()
    await expect(page.getByRole('heading', { name: 'Pronto' })).toBeHidden()

    // Visto uma vez, não abre de novo.
    await page.reload()
    await expect(page.getByRole('button', { name: 'Ver o guia' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Uma CPU de 8 bits, aberta' })).toBeHidden()
  })

  test('Esc fecha o guia e conta como visto', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'Uma CPU de 8 bits, aberta' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Uma CPU de 8 bits, aberta' })).toBeHidden()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Ver o guia' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Uma CPU de 8 bits, aberta' })).toBeHidden()
  })

  for (const tema of ['light', 'dark'] as const) {
    test(`balão sem problemas graves de acessibilidade, tema ${tema}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: tema })
      await page.goto('./')
      await page.getByRole('button', { name: 'Próximo' }).click()
      await expect(page.getByRole('heading', { name: 'Comandos' })).toBeVisible()
      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      const graves = resultado.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }
})

test('cada passo do guia aponta para uma parte visível da tela', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Ver o guia' }).click()
  const balao = page.getByRole('dialog')
  for (let n = 1; n <= 10; n++) {
    await expect(balao).toContainText(`${n} de 10`)
    if (n > 1) await expect(page.locator('.recorte')).toBeVisible()
    if (n < 10) await page.getByRole('button', { name: 'Próximo' }).click()
  }
})

test('o botão "?" abre só o balão daquela parte, e o foco volta para ele', async ({ page }) => {
  await page.goto('./')
  const ajuda = page.getByRole('button', { name: 'Ajuda: A memória por dentro' })
  await ajuda.click()
  const balao = page.getByRole('dialog')
  await expect(balao).toContainText('A memória por dentro')
  await expect(balao).not.toContainText('de 10')
  await page.getByRole('button', { name: 'Entendi' }).click()
  await expect(balao).toBeHidden()
  await expect(ajuda).toBeFocused()
})

test('"Ver o guia" abre o guia completo de novo', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Ver o guia' }).click()
  await expect(page.getByRole('dialog')).toContainText('1 de 10')
  await page.getByRole('button', { name: 'Pular o guia' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

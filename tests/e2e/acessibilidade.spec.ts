/**
 * Acessibilidade: auditoria automática (axe) e uso só com o teclado.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function auditar(page: Page, onde: string) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    graves.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
    onde,
  ).toEqual([])
}

for (const tema of ['light', 'dark'] as const) {
  test.describe(`tema ${tema === 'light' ? 'claro' : 'escuro'}`, () => {
    test.use({ colorScheme: tema })

    test('simulador em execução não tem problemas graves de acessibilidade', async ({ page }) => {
      await page.goto('./')
      await page.getByRole('button', { name: 'Carregar', exact: true }).click()
      await page.getByRole('button', { name: 'teste.bin' }).click()
      await page.getByRole('button', { name: 'OK' }).click()
      await page.getByRole('button', { name: 'Executar', exact: true }).click()
      await expect(page.locator('img.semaforo')).toHaveAttribute('alt', 'Pausa (amarelo)')
      await auditar(page, 'simulador')
    })

    test('visual clássico não tem problemas graves de acessibilidade', async ({ page }) => {
      await page.goto('./')
      await page.getByRole('radio', { name: 'Clássico' }).click()
      await expect(page.getByRole('img', { name: /Diagrama da CPU-8E/ })).toBeVisible()
      await auditar(page, 'visual clássico')
    })

    for (const pagina of ['primeiros-passos', 'cpu', 'instrucoes', 'programas', 'siglas']) {
      test(`documentação /${pagina} não tem problemas graves de acessibilidade`, async ({
        page,
      }) => {
        await page.goto(`./#/documentacao/${pagina}`)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await auditar(page, pagina)
      })
    }

    test('página Sobre não tem problemas graves de acessibilidade', async ({ page }) => {
      await page.goto('./#/sobre')
      await auditar(page, 'sobre')
    })
  })
}

test('dá para usar o simulador só com o teclado', async ({ page, isMobile, browserName }) => {
  test.skip(isMobile, 'teclado físico só no computador')
  // O Safari só leva o foco a botões com Tab se o usuário ativar essa opção.
  test.skip(browserName === 'webkit', 'Tab do Safari não passa por botões por padrão')
  await page.goto('./')

  // Ctrl+L abre a janela de carregar; Tab até teste.bin; Enter carrega.
  await page.keyboard.press('Control+l')
  const teste = page.getByRole('button', { name: 'teste.bin' })
  while (!(await teste.evaluate((el) => el === document.activeElement))) {
    await page.keyboard.press('Tab')
  }
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'OK' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeHidden()

  // Ctrl+G avança um pulso; o estado é anunciado para leitores de tela.
  await page.keyboard.press('Control+g')
  await expect(page.locator('[aria-live="polite"]')).toHaveText(/Busca: MAR:00/)

  // Registradores recebem foco e mostram o valor em binário com Enter.
  const pc = page.getByRole('button', { name: /^PC:00/ })
  await pc.focus()
  await page.keyboard.press('Enter')
  await expect(pc).toContainText('00000000')
  await expect(pc).toHaveAttribute('aria-pressed', 'true')

  // Editar a memória pelo teclado.
  await page.getByRole('button', { name: 'D1: editar o endereço 00' }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('textbox', { name: 'Editar o conteúdo do endereço 00' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
})

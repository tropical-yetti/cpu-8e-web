/**
 * Experimentos "e se…?" (ADR 0007): a lista, os quatro momentos do balão,
 * os passos que avançam sozinhos e a saída que desfaz tudo.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Sem rolagem suave: o balão vai direto à parte em destaque (como em guia.spec.ts).
test.use({ reducedMotion: 'reduce' })

async function abrirExperimento(page: Page, titulo: RegExp) {
  await page.getByRole('button', { name: 'Experimentos “e se…?”' }).click()
  await page
    .getByRole('dialog', { name: 'Experimentos “e se…?”' })
    .getByRole('button', { name: titulo })
    .click()
}

const balao = (page: Page) => page.getByRole('dialog', { name: /^E se/ })
const momento = (page: Page) => balao(page).locator('[data-momento]')

/** Toca em Executar até o balão sair do momento atual. */
async function executarAte(page: Page, proximoMomento: string) {
  const executar = page.getByRole('button', { name: 'Executar', exact: true })
  for (let i = 0; i < 20; i++) {
    if ((await momento(page).textContent())?.includes(proximoMomento)) return
    if (await executar.isEnabled()) await executar.click()
    await page.waitForTimeout(150)
  }
  await expect(momento(page)).toContainText(proximoMomento)
}

test('estouro: pergunta, passos que avançam sozinhos, resultado e por que isso importa', async ({
  page,
}) => {
  await page.goto('./')
  await abrirExperimento(page, /E se a soma passar do limite/)
  await expect(momento(page)).toHaveText('Pense antes')
  await expect(page.getByText('Programa: experimento-estouro.bin')).toBeVisible()
  await page.getByRole('button', { name: 'Vamos ver' }).click()
  await expect(momento(page)).toHaveText('Passo 1 de 2')
  await expect(balao(page)).toContainText('o balão avança sozinho')
  // Velocidade máxima, para o teste não esperar o clock.
  await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')

  await executarAte(page, 'Passo 2 de 2')
  await expect(page.getByRole('button', { name: /^ACC: 0x80,/ })).toBeVisible()
  await executarAte(page, 'O que aconteceu')
  await expect(balao(page)).toContainText('7F + 01 deu 80')

  await page.getByRole('button', { name: 'Por que isso importa?' }).click()
  await expect(momento(page)).toHaveText('Por que isso importa')
  await expect(balao(page)).toContainText('flag de estouro')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(balao(page)).toBeHidden()
})

test('sair desfaz tudo: o programa, a memória e o modo voltam a ser os de antes', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Carregar', exact: true }).click()
  await page.getByRole('button', { name: 'teste.bin' }).click()
  await page.getByRole('button', { name: 'OK' }).click()
  await page.locator('.campo-modo select').selectOption('continuo')

  await abrirExperimento(page, /E se o desvio cair no meio/)
  await expect(page.locator('td[data-endereco="00"]')).toHaveText('C4')
  await expect(page.locator('.campo-modo select')).toHaveValue('ciclo')
  await page.keyboard.press('Escape')

  await expect(balao(page)).toBeHidden()
  await expect(page.getByText('Programa: teste.bin')).toBeVisible()
  await expect(page.locator('td[data-endereco="00"]')).toHaveText('D1')
  await expect(page.locator('.campo-modo select')).toHaveValue('continuo')
})

test('pilha: a mensagem do simulador faz parte do experimento', async ({ page }) => {
  await page.goto('./')
  await abrirExperimento(page, /E se a pilha não parar de crescer/)
  await page.getByRole('button', { name: 'Vamos ver' }).click()
  await page.getByRole('button', { name: 'Executar', exact: true }).click()
  await expect(page.getByText(/pilha chegou/i)).toBeVisible({ timeout: 15_000 })
  await expect(momento(page)).toHaveText('Passo 2 de 2')
  await page.getByRole('button', { name: 'OK' }).click()
  await expect(momento(page)).toHaveText('O que aconteceu')
  await expect(balao(page)).toContainText('A pilha desceu de FF até 11')
})

test('abrir o guia sai do experimento', async ({ page }) => {
  await page.goto('./')
  await abrirExperimento(page, /E se o programa nunca terminar/)
  await page.getByRole('button', { name: 'Ver o guia' }).click()
  await expect(page.getByRole('heading', { name: 'Uma CPU de 8 bits, aberta' })).toBeVisible()
  await expect(balao(page)).toBeHidden()
  await expect(page.getByText('Programa: experimento-lacoSemFim.bin')).toBeHidden()
})

for (const tema of ['light', 'dark'] as const) {
  test(`lista e balão sem problemas graves de acessibilidade, tema ${tema}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: tema })
    await page.goto('./')
    await page.getByRole('button', { name: 'Experimentos “e se…?”' }).click()
    const graves = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map(
          (v) =>
            `${v.id}: ${v.help} ${v.nodes.map((n) => n.target.join(' ') + ' ' + (n.any[0]?.message ?? '')).join(' | ')}`,
        )
    expect(await graves()).toEqual([])
    await page.getByRole('button', { name: /E se a soma passar do limite/ }).click()
    await page.getByRole('button', { name: 'Vamos ver' }).click()
    await expect(momento(page)).toHaveText('Passo 1 de 2')
    expect(await graves()).toEqual([])
  })
}

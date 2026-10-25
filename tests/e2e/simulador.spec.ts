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
/** Um registrador do painel novo, pelo começo do nome acessível ("MAR: 0x00,"). */
const registrador = (page: Page, nome: string, valor: string) =>
  page.getByRole('button', { name: new RegExp(`^${nome}: 0x${valor},`) })
const decodificador = (page: Page) => page.locator('[data-visual="novo"] [data-sigla="di"]')

async function usarVisual(page: Page, visual: 'Novo' | 'Clássico') {
  await page
    .getByRole('radiogroup', { name: 'Visual do painel' })
    .getByRole('radio', { name: visual })
    .click()
}
const status = (page: Page) => page.locator('img.semaforo')

test('carrega teste.bin e mostra o disassembly', async ({ page }) => {
  await carregarTeste(page)
  await expect(page.getByText('Programa: teste.bin')).toBeVisible()
  const linha0 = page.locator('tr[data-endereco="0"]')
  await expect(linha0).toContainText('D1')
  await expect(linha0).toContainText('LOD')
  await expect(decodificador(page)).toContainText('HLT')
  // v1.1: o botão Parar saiu da barra (item 15).
  await expect(page.getByRole('button', { name: 'Parar' })).toHaveCount(0)
})

test('o nome do programa não empurra o painel para baixo', async ({ page }) => {
  await page.goto('./')
  const painel = page.locator('.area')
  const antes = (await painel.boundingBox())!.y
  await carregarTeste(page)
  await expect(page.getByText('Programa: teste.bin')).toBeVisible()
  expect((await painel.boundingBox())!.y).toBe(antes)
})

test('as siglas do painel seguem o idioma da interface', async ({ page }) => {
  await page.goto('./')
  const painel = page.locator('[data-visual="novo"]')
  for (const sigla of ['ULA', 'UC', 'DI', 'BI', 'BD', 'BE']) {
    await expect(painel.getByText(sigla, { exact: true }).first()).toBeVisible()
  }
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en')
  for (const sigla of ['ALU', 'CU', 'ID', 'IB', 'DB', 'AB', 'RD', 'WR']) {
    await expect(painel.getByText(sigla, { exact: true }).first()).toBeVisible()
  }
  await expect(painel).not.toContainText('ULA')
  await expect(
    page.getByRole('button', { name: /^ALU output: 0x00, 0 in decimal, 00000000 in binary/ }),
  ).toBeVisible()
  await expect(painel.getByText('Output', { exact: true })).toBeVisible()
})

test('no visual clássico, as siglas do diagrama seguem o idioma da interface', async ({ page }) => {
  await page.goto('./')
  await usarVisual(page, 'Clássico')
  const desenho = page.locator('svg.diagrama')
  for (const sigla of ['ULA:00', 'UC', 'BI', 'BD', 'BE']) {
    await expect(desenho.getByText(sigla, { exact: true })).toBeVisible()
  }
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en')
  for (const sigla of ['ALU:00', 'CU', 'IB', 'DB', 'AB', 'ACC:00', 'RD']) {
    await expect(desenho.getByText(sigla, { exact: true })).toBeVisible()
  }
  await expect(desenho).not.toContainText('ULA')
  await expect(page.getByRole('button', { name: /^ALU:00, in binary 00000000/ })).toBeAttached()
})

test('passo a passo avança um pulso de clock por vez', async ({ page }) => {
  await carregarTeste(page)
  const executar = page.getByRole('button', { name: 'Executar', exact: true })

  await executar.click()
  await expect(status(page)).toHaveAttribute('alt', 'Pausa (amarelo)')
  await expect(page.locator('.lampada.acesa')).toHaveText('Busca')
  await expect(registrador(page, 'MAR', '00')).toHaveClass(/realcado/)
  // PC → MAR: o PC sai para o BI, o MAR recebe, e o endereço segue pelo BE.
  for (const fio of ['.bi', '.ponte-esquerda >> nth=0', '.linha-be']) {
    await expect(page.locator(`[data-visual="novo"] ${fio}`)).toHaveClass(/aceso/)
  }

  await executar.click()
  await expect(registrador(page, 'MDR', 'D1')).toHaveClass(/realcado/)
  await expect(registrador(page, 'PC', '01')).toBeVisible()
  // Leitura: RD acende, e o BD traz o dado da memória para o MDR.
  await expect(page.locator('.linha-rd')).toHaveClass(/aceso/)
  await expect(page.locator('.linha-bd')).toHaveClass(/para-esquerda/)
  await expect(page.locator('.linha-be')).toHaveClass(/apagado/)
})

test('as pontas das setas não ficam escondidas atrás das caixas', async ({ page }) => {
  await carregarTeste(page)
  await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')
  const executar = page.getByRole('button', { name: 'Executar', exact: true })
  /** A ponta da seta fica dentro do fio, sem passar para a caixa vizinha. */
  async function pontaVisivel(seletor: string, lado: 'direita' | 'esquerda' | 'baixo') {
    const fio = page.locator(`[data-visual="novo"] ${seletor}`)
    await expect(fio).toHaveClass(new RegExp(`para-${lado}`))
    const sobra = await fio.evaluate((el, lado) => {
      const f = el.getBoundingClientRect()
      const linha = el.querySelector('.linha')!
      const l = linha.getBoundingClientRect()
      const seta = getComputedStyle(linha, lado === 'esquerda' ? '::before' : '::after')
      if (lado === 'direita') return f.right - (l.right + parseFloat(seta.borderLeftWidth))
      if (lado === 'esquerda') return l.left - parseFloat(seta.borderRightWidth) - f.left
      return f.bottom - (l.bottom + parseFloat(seta.borderTopWidth))
    }, lado)
    expect(sobra, seletor).toBeGreaterThanOrEqual(-0.5)
  }
  await executar.click() // PC → MAR: sai do PC e entra no MAR
  await pontaVisivel('.ponte-direita >> nth=0', 'direita')
  await pontaVisivel('.ponte-esquerda >> nth=0', 'direita')
  await executar.click() // memória → MDR: o BD chega à CPU
  await pontaVisivel('.linha-bd', 'esquerda')
  await executar.click() // MDR → IR
  await expect(registrador(page, 'IR', 'D1')).toHaveClass(/realcado/)
  await executar.click() // IR → UC
  await pontaVisivel('.fio-ir-uc', 'baixo')
})

test('no visual clássico, o passo a passo mostra os textos do original', async ({ page }) => {
  await carregarTeste(page)
  await usarVisual(page, 'Clássico')
  await page.getByRole('button', { name: 'Executar', exact: true }).click()
  await expect(diagrama(page)).toContainText('MAR:00')
  await page.getByRole('button', { name: 'Executar', exact: true }).click()
  await expect(diagrama(page)).toContainText('MDR:D1')
  await expect(diagrama(page)).toContainText('DI:HLT')
})

test('o visual escolhido fica guardado, e a documentação mostra o mesmo', async ({ page }) => {
  await page.goto('./')
  const novo = page.getByRole('radio', { name: 'Novo' })
  await expect(novo).toHaveAttribute('aria-checked', 'true')
  await usarVisual(page, 'Clássico')
  await expect(diagrama(page)).toBeVisible()
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Clássico' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(diagrama(page)).toBeVisible()
  await page.goto('./#/documentacao/cpu')
  await expect(diagrama(page)).toBeVisible()
  await page.goto('./')
  await usarVisual(page, 'Novo')
  await expect(page.locator('[data-visual="novo"]')).toBeVisible()
  await expect(diagrama(page)).toHaveCount(0)
})

test('tocar num registrador troca a base: hexadecimal, decimal, binário', async ({ page }) => {
  await page.goto('./')
  const sp = registrador(page, 'SP', 'FF')
  await expect(sp).toHaveAccessibleName(/^SP: 0xFF, 255 em decimal, 11111111 em binário/)
  await expect(sp).toContainText('0xFF')
  await sp.click()
  await expect(sp).toContainText('255')
  await sp.click()
  await expect(sp).toContainText('0b11111111')
  await sp.click()
  await expect(sp).toContainText('0xFF')
  // Cada registrador tem a sua base.
  await sp.click()
  await expect(registrador(page, 'PC', '00')).toContainText('0x00')
})

test('a ULA mostra A e B ligados à saída e o Status Register', async ({ page }) => {
  await page.goto('./')
  const painel = page.locator('[data-visual="novo"]')
  await expect(painel.getByText('ULA', { exact: true })).toBeVisible()
  await expect(painel.getByText('Saída', { exact: true })).toBeVisible()
  await expect(painel.getByText('Status Register', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Saída da ULA: 0x00,/ })).toBeVisible()
  await expect(painel.locator('.combinacao')).not.toHaveClass(/aceso/)
  // LOD 05: a ULA deixa passar A, e as ligações acendem no pulso dela.
  await page.getByRole('button', { name: '00: editar o endereço 00' }).click()
  await page.keyboard.type('91')
  await page.keyboard.press('Enter')
  await page.keyboard.type('05')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')
  const executar = page.getByRole('button', { name: 'Executar', exact: true })
  for (let i = 0; i < 12 && !(await painel.locator('.combinacao.aceso').count()); i++) {
    await executar.click()
    await page.waitForTimeout(100)
  }
  await expect(painel.locator('.combinacao')).toHaveClass(/aceso/)
  await expect(page.getByRole('button', { name: /^Saída da ULA: 0x05,/ })).toBeVisible()
})

test('as siglas têm legenda ao apontar e ao focar', async ({ page, isMobile }) => {
  await page.goto('./')
  const legenda = page.getByRole('tooltip')
  if (!isMobile) {
    await page.locator('[data-visual="novo"] .nome-bi').hover()
    await expect(legenda).toContainText('Barramento interno')
    await page.locator('[data-visual="novo"] .nome-ula').hover()
    await expect(legenda).toContainText('Unidade lógica e aritmética')
    await page.locator('[data-visual="novo"] .nome-status').hover()
    await expect(legenda).toContainText('flags Z, N e C')
  }
  const pc = registrador(page, 'PC', '00')
  await pc.focus()
  await expect(legenda).toContainText('Program Counter')
  await expect(pc).toHaveAttribute('aria-describedby', 'legenda-sigla')
  await page.keyboard.press('Escape')
  await expect(legenda).toBeHidden()
})

test('execução contínua roda teste.bin até o HALT', async ({ page }) => {
  await carregarTeste(page)
  await page.locator('.campo-modo select').selectOption('continuo')
  await page.getByRole('combobox', { name: 'Velocidade do clock' }).selectOption('100')
  await page.getByRole('button', { name: 'Executar', exact: true }).click()
  await expect(status(page)).toHaveAttribute('alt', 'Parada (vermelho)', { timeout: 15_000 })
  await expect(registrador(page, 'ACC', 'FF')).toBeVisible()
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

test('editar a memória com um valor inválido mostra o aviso e não grava (v1.1)', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: '00: editar o endereço 00' }).click()
  const campo = page.getByRole('textbox', { name: 'Editar o conteúdo do endereço 00' })
  await page.keyboard.type('ZZ')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('Digite um valor hexadecimal de 00 a FF.')
  await expect(campo).toHaveAttribute('aria-invalid', 'true')
  await campo.fill('A5')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.locator('tr[data-endereco="0"]')).toContainText('A5')
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
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: 'Joel Guilherme da Silva Filho' }),
  ).toHaveAttribute('href', 'http://lattes.cnpq.br/7746085908957322')
  // O rodapé mostra o commit de onde o site foi gerado, com link para ele.
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: /^[0-9a-f]{7,}$/ }),
  ).toHaveAttribute('href', /\/commit\/[0-9a-f]{7,}$/)
  await page.getByRole('link', { name: /Licença GPL-3.0-or-later/ }).click()
  await expect(page.getByRole('link', { name: 'conte como foi na issue #12' })).toHaveAttribute(
    'href',
    'https://github.com/tropical-yetti/cpu-8e-web/issues/12',
  )
  await expect(page.getByRole('heading', { name: 'Licença' })).toBeVisible()
  await expect(page.getByText(/SEM NENHUMA GARANTIA/)).toBeVisible()
  for (const nome of ['Joel Guilherme da Silva Filho', 'Prof. Joel Guilherme da Silva Filho']) {
    await expect(
      page.getByRole('main').getByRole('link', { name: nome, exact: true }),
    ).toHaveAttribute('href', 'http://lattes.cnpq.br/7746085908957322')
  }
})

test('a página não rola para os lados nem numa tela de 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  for (const rota of ['./', './#/documentacao/cpu', './#/documentacao/siglas', './#/sobre']) {
    await page.goto(rota)
    await page.waitForLoadState('networkidle')
    const larguraDaPagina = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(larguraDaPagina, rota).toBeLessThanOrEqual(320)
  }
})

test('no celular, o diagrama clássico pode ser ajustado à tela', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await usarVisual(page, 'Clássico')
  const diagrama = page.locator('.diagrama-conteiner')
  expect((await diagrama.boundingBox())!.width).toBeGreaterThanOrEqual(640)
  await page.getByRole('button', { name: 'Ajustar à tela' }).click()
  expect((await diagrama.boundingBox())!.width).toBeLessThan(400)
})

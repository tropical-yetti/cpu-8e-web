/**
 * Extrai do formulário original (CPU8E_Panel.lfm) as posições, tamanhos,
 * cores e textos dos elementos do painel da CPU, e grava em
 * src/painel/layout-original.json. O componente DiagramaCpu.vue desenha o
 * painel a partir desse arquivo, reproduzindo o desenho do original.
 *
 * Uso:  npm run layout
 *
 * CPU8E_Panel.lfm: Copyright 2009/10 Joel Guilherme da Silva Filho e
 * colaboradores (veja NOTICE.md). SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ORIGEM = fileURLToPath(new URL('./CPU8E_Panel.lfm', import.meta.url))
const DESTINO = fileURLToPath(new URL('../../src/painel/layout-original.json', import.meta.url))

// ---------------------------------------------------------------------------
// Leitura do formato .lfm (formulários do Lazarus)
// ---------------------------------------------------------------------------

interface ObjetoLfm {
  nome: string
  tipo: string
  props: Record<string, string>
  filhos: ObjetoLfm[]
}

/** Converte strings Pascal ('abc'#13#10'def') em texto normal. */
function textoPascal(valor: string): string {
  let resultado = ''
  const partes = valor.matchAll(/'((?:[^']|'')*)'|#(\d+)/g)
  for (const [, texto, codigo] of partes) {
    if (texto !== undefined) resultado += texto.replaceAll("''", "'")
    else if (codigo !== undefined) resultado += String.fromCharCode(Number(codigo))
  }
  return resultado.replaceAll('\r\n', '\n').trim()
}

function lerLfm(conteudo: string): ObjetoLfm {
  const linhas = conteudo.split(/\r?\n/)
  const pilha: ObjetoLfm[] = []
  let raiz: ObjetoLfm | undefined
  // Valores que ocupam várias linhas: listas ( ... ) e coleções < ... >
  let fechamentoPendente: string | null = null

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim()
    if (fechamentoPendente) {
      if (linha.endsWith(fechamentoPendente)) fechamentoPendente = null
      continue
    }
    const objeto = /^object (\w+): (\w+)$/.exec(linha)
    if (objeto) {
      const novo: ObjetoLfm = { nome: objeto[1]!, tipo: objeto[2]!, props: {}, filhos: [] }
      pilha.at(-1)?.filhos.push(novo)
      raiz ??= novo
      pilha.push(novo)
      continue
    }
    if (linha === 'end') {
      pilha.pop()
      continue
    }
    const prop = /^([\w.]+) = (.*)$/.exec(linha)
    if (prop && pilha.length > 0) {
      const valor = prop[2]!
      if (valor === '(') fechamentoPendente = ')'
      else if (valor === '<') fechamentoPendente = '>'
      else pilha.at(-1)!.props[prop[1]!] = valor
    }
  }
  if (!raiz) throw new Error('Formulário vazio')
  return raiz
}

// ---------------------------------------------------------------------------
// Conversões
// ---------------------------------------------------------------------------

/** Cores nomeadas do Lazarus usadas no formulário. `null` = fundo do painel. */
const CORES_NOMEADAS: Record<string, string | null> = {
  clMoneyGreen: '#C0DCC0',
  clSilver: '#C0C0C0',
  clBtnFace: '#D4D0C8',
  clInactiveCaption: null,
  clAqua: '#00FFFF',
  clLime: '#00FF00',
  clRed: '#FF0000',
  clYellow: '#FFFF00',
  clBlack: '#000000',
  clWhite: '#FFFFFF',
  clNavy: '#000080',
  clBlue: '#0000FF',
  clFuchsia: '#FF00FF',
  clGreen: '#008000',
  clGray: '#808080',
  clMaroon: '#800000',
  clOlive: '#808000',
  clTeal: '#008080',
  clPurple: '#800080',
}

/** Cores numéricas do Lazarus são BGR (azul no byte alto). */
function converterCor(valor: string | undefined): string | null {
  if (valor === undefined) return null
  if (valor in CORES_NOMEADAS) return CORES_NOMEADAS[valor]!
  const numero = Number(valor)
  if (!Number.isFinite(numero)) throw new Error(`Cor desconhecida: ${valor}`)
  const r = numero & 0xff
  const g = (numero >> 8) & 0xff
  const b = (numero >> 16) & 0xff
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0').toUpperCase()).join('')
}

const FORMAS: Record<string, string> = {
  stRectangle: 'retangulo',
  stDownTriangle: 'trianguloBaixo',
  stUpTriangle: 'trianguloCima',
  stLeftTriangle: 'trianguloEsquerda',
  stRightTriangle: 'trianguloDireita',
  stEllipse: 'elipse',
  stCircle: 'elipse',
  stRoundRect: 'retanguloArredondado',
  stDiamond: 'losango',
}

const numero = (props: Record<string, string>, chave: string): number => Number(props[chave] ?? 0)

// ---------------------------------------------------------------------------
// Extração
// ---------------------------------------------------------------------------

const formulario = lerLfm(readFileSync(ORIGEM, 'utf8'))

/** Só os elementos do desenho da CPU (os filhos diretos do formulário). */
const elementos = formulario.filhos.filter((o) => o.props['Visible'] !== 'False')

const formas = elementos
  .filter((o) => o.tipo === 'TShapeEx')
  .map((o) => ({
    nome: o.nome,
    x: numero(o.props, 'Left'),
    y: numero(o.props, 'Top'),
    largura: numero(o.props, 'Width'),
    altura: numero(o.props, 'Height'),
    cor: converterCor(o.props['Brush.Color']) ?? '#FFFFFF',
    contorno: o.props['Pen.Style'] !== 'psClear',
    forma: FORMAS[o.props['Shape'] ?? 'stRectangle'] ?? 'retangulo',
    dica: o.props['Hint'] ? textoPascal(o.props['Hint']) : undefined,
  }))

const textos = elementos
  .filter((o) => o.tipo === 'TStaticText' || o.tipo === 'TLabel')
  .map((o) => ({
    nome: o.nome,
    x: numero(o.props, 'Left'),
    y: numero(o.props, 'Top'),
    largura: numero(o.props, 'Width'),
    altura: numero(o.props, 'Height'),
    texto: textoPascal(o.props['Caption'] ?? "''"),
    fundo: converterCor(o.props['Color']),
    corTexto: converterCor(o.props['Font.Color']) ?? '#000000',
    tamanhoFonte: Math.abs(numero(o.props, 'Font.Height')) || 12,
    negrito:
      (o.props['Font.Style'] ?? '').includes('fsBold') ||
      o.props['Font.Name']?.includes('Black') === true,
    italico: (o.props['Font.Style'] ?? '').includes('fsItalic'),
    centralizado: o.props['Alignment'] === 'taCenter',
    dica: o.props['Hint'] ? textoPascal(o.props['Hint']) : undefined,
  }))

const seletorClock = elementos.find((o) => o.nome === 'ClockSelect')!
const memoria = elementos.find((o) => o.nome === 'sgMemoria')!

const layout = {
  _aviso:
    'Gerado por tools/layout/extrair-layout.ts a partir de CPU8E_Panel.lfm (CPU-8E v2.2.3, ' +
    'Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores). GPL-3.0-or-later. ' +
    'Não edite à mão: rode npm run layout.',
  largura: numero(memoria.props, 'Left'),
  altura: numero(formulario.props, 'ClientHeight'),
  topo: numero(memoria.props, 'Top'),
  formas,
  textos,
  clock: {
    x: numero(seletorClock.props, 'Left'),
    y: numero(seletorClock.props, 'Top'),
    largura: numero(seletorClock.props, 'Width'),
    altura: numero(seletorClock.props, 'Height'),
  },
}

writeFileSync(DESTINO, JSON.stringify(layout, null, 2) + '\n')
console.log(`${formas.length} formas e ${textos.length} textos gravados em ${DESTINO}`)

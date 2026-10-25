<!--
  Memória por dentro (ADR 0006): os 256 bytes como a matriz 16 × 16 que eles
  são dentro do chip. O primeiro dígito do endereço é a linha, o segundo é a
  coluna. O decodificador de linha (A7–A4) fica à esquerda, o de coluna
  (A3–A0) acima.

  A linha e a coluna do endereço no MAR ficam marcadas o tempo todo. Num
  pulso de leitura (M[MAR] → MDR) ou de escrita (MDR → M[MAR]), a célula do
  cruzamento acende, e a faixa embaixo da grade diz o sentido do dado.

  A grade também mostra o que a tabela mostra: a posição do PC, a pilha
  (acima do SP) e os bytes que o disassembler trata como dados. A célula
  escolhida mostra o endereço, o valor e o símbolo.

  Teclado: setas movem a escolha; Enter, F2 ou um dígito hexadecimal editam;
  Enter grava e segue para o endereço seguinte, como na tabela; Esc cancela.
  Mouse e toque: um toque escolhe a célula, outro toque (ou dois cliques)
  edita. Ao contrário do MEM-8E Web, escolher uma célula não muda o MAR: quem
  manda no MAR é a CPU.

  Leitor de tela: a grade é um widget de grade, e só a célula escolhida fica
  visível para ele ("Linha 3, coluna A: 05, …"). As outras 255, os
  cabeçalhos e os decodificadores ficam ocultos; um resumo diz a linha e a
  coluna do MAR e o acesso em andamento.

  Copiado do MEM-8E Web (src/components/GradeMemoria.vue) em 2026-10-25 (ADR 0004).
  Modificado: lê o estado da CPU-8E (MAR, PC, pilha, símbolos e os pulsos de
  leitura e escrita), sem CS, sem níveis Z e X e sem os blocos de saída;
  escolher uma célula não põe o endereço no MAR; a edição usa a mesma
  validação da tabela e segue para o endereço seguinte.
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fiosAcesos } from '@/painel/fios'
import { useSimuladorStore } from '@/stores/simulador'
import DecodificadorColuna from './DecodificadorColuna.vue'
import DecodificadorLinha from './DecodificadorLinha.vue'

const simulador = useSimuladorStore()
const { t } = useI18n()

const HEX = Array.from({ length: 16 }, (_, i) => i.toString(16).toUpperCase())
const INDICES = Array.from({ length: 16 }, (_, i) => i)
const enderecoDe = (linha: number, coluna: number) => linha * 16 + coluna
const hex2 = (n: number) => n.toString(16).toUpperCase().padStart(2, '0')

/** "MAR:3A" → 0x3A. */
function registrador(item: 'MAR' | 'PC'): number {
  return Number.parseInt(simulador.painel.textos[item].split(':')[1] ?? '0', 16)
}
const mar = computed(() => registrador('MAR'))
const pc = computed(() => registrador('PC'))
const linhaMar = computed(() => mar.value >> 4)
const colunaMar = computed(() => mar.value & 0xf)

/** Acesso à memória no pulso atual: leitura (RD) ou escrita (WR). */
const acesso = computed<'leitura' | 'escrita' | null>(() => {
  const fios = fiosAcesos(simulador.painel.barramentos)
  if (fios.has('wr')) return 'escrita'
  if (fios.has('rd')) return 'leitura'
  return null
})

function valor(endereco: number): string {
  return simulador.memoria[endereco]!.valor
}
function simbolo(endereco: number): string {
  return simulador.memoria[endereco]!.simbolo
}

function classesCelula(linha: number, coluna: number) {
  const endereco = enderecoDe(linha, coluna)
  const cruzamento = linha === linhaMar.value && coluna === colunaMar.value
  return {
    'na-linha': linha === linhaMar.value,
    'na-coluna': coluna === colunaMar.value,
    cruzamento,
    leitura: cruzamento && acesso.value === 'leitura',
    escrita: cruzamento && acesso.value === 'escrita',
    pc: endereco === pc.value,
    pilha: endereco > simulador.topoPilha,
    dado: simbolo(endereco).startsWith('DB'),
    escolhida: endereco === foco.value,
  }
}

// -------------------------------------------------------------------------
// Escolha e edição
// -------------------------------------------------------------------------

/** Célula escolhida, com o foco do teclado (uma só parada de Tab para a grade toda). */
const foco = ref(0)
const editando = ref<number | null>(null)
const texto = ref('')
const recusado = ref(false)
const celulasEl = ref<HTMLElement[]>([])

function focar(endereco: number) {
  foco.value = (endereco + 256) % 256
  void nextTick(() => celulasEl.value[foco.value]?.focus())
}

function editar(endereco: number, inicial?: string) {
  foco.value = endereco
  editando.value = endereco
  recusado.value = false
  texto.value = inicial ?? valor(endereco)
  void nextTick(() => {
    const campo = document.getElementById('campo-celula') as HTMLInputElement | null
    campo?.focus()
    if (inicial === undefined) campo?.select()
  })
}

/** Grava a célula. Com Enter, segue editando o endereço seguinte, como na tabela. */
function confirmar(avancar: boolean) {
  const endereco = editando.value
  if (endereco === null) return
  if (texto.value === '' || !simulador.editarMemoria(endereco, texto.value)) {
    if (avancar && texto.value !== '') {
      recusado.value = true
      return
    }
    cancelar()
    return
  }
  recusado.value = false
  if (avancar && endereco < 255) editar(endereco + 1)
  else {
    editando.value = null
    focar(endereco)
  }
}

function cancelar() {
  const endereco = editando.value
  editando.value = null
  recusado.value = false
  if (endereco !== null) focar(endereco)
}

/**
 * Ao sair do campo, grava. O campo de um endereço sai da tela quando a edição
 * segue para o endereço seguinte; esse "sair" não conta.
 */
function aoSairDoCampo(endereco: number) {
  if (editando.value === endereco) confirmar(false)
}

function filtrar(evento: Event) {
  const campo = evento.target as HTMLInputElement
  texto.value = campo.value
    .replace(/[^0-9a-f]/gi, '')
    .toUpperCase()
    .slice(0, 2)
  campo.value = texto.value
}

function teclado(evento: KeyboardEvent, endereco: number) {
  const mover: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: 16,
    ArrowUp: -16,
  }
  if (evento.key in mover) {
    evento.preventDefault()
    focar(endereco + mover[evento.key]!)
  } else if (evento.key === 'Home') {
    evento.preventDefault()
    focar(endereco - (endereco % 16))
  } else if (evento.key === 'End') {
    evento.preventDefault()
    focar(endereco - (endereco % 16) + 15)
  } else if (evento.key === 'Enter' || evento.key === 'F2') {
    evento.preventDefault()
    editar(endereco)
  } else if (/^[0-9a-f]$/i.test(evento.key) && !evento.ctrlKey && !evento.metaKey) {
    evento.preventDefault()
    editar(endereco, evento.key.toUpperCase())
  }
}

/**
 * Um toque escolhe; um segundo toque na mesma célula edita. Conta o último
 * toque, e não o foco: a célula 00 começa com o foco (é a parada de Tab da
 * grade), e o primeiro toque nela também deve só escolher.
 */
let ultimoToque: number | null = null
function tocar(endereco: number) {
  if (ultimoToque === endereco) editar(endereco)
  else {
    ultimoToque = endereco
    focar(endereco)
  }
}

// -------------------------------------------------------------------------
// Textos
// -------------------------------------------------------------------------

/** Dígitos separados por espaço, para o leitor de tela dizer "zero cinco", e não "cinco". */
const separar = (texto: string) => [...texto].join(' ')

function rotulo(endereco: number): string {
  const partes = [
    t('grade.celula', {
      linha: HEX[endereco >> 4],
      coluna: HEX[endereco & 0xf],
      visivel: valor(endereco),
      digitos: separar(valor(endereco)),
    }),
  ]
  if (simbolo(endereco)) partes.push(simbolo(endereco))
  if (endereco === mar.value) partes.push(t('grade.marcas.mar'))
  if (endereco === pc.value) partes.push(t('grade.marcas.pc'))
  if (endereco > simulador.topoPilha) partes.push(t('grade.marcas.pilha'))
  return partes.join(', ')
}

/** A célula escolhida: endereço, valor e símbolo. */
const detalhe = computed(() =>
  t('grade.detalhe', {
    endereco: hex2(foco.value),
    valor: valor(foco.value),
    simbolo: simbolo(foco.value) || '—',
  }),
)

/** O que a vista mostra, numa frase: o MAR e o acesso em andamento. */
const resumo = computed(() => {
  const dados = {
    endereco: hex2(mar.value),
    linha: HEX[linhaMar.value],
    coluna: HEX[colunaMar.value],
    valor: valor(mar.value),
    mdr: simulador.painel.textos.MDR.split(':')[1] ?? '',
  }
  if (acesso.value === 'leitura') return t('grade.resumo.leitura', dados)
  if (acesso.value === 'escrita') return t('grade.resumo.escrita', dados)
  return t('grade.resumo.mar', dados)
})

/** Só a linha e a célula escolhidas ficam visíveis para o leitor de tela. */
const linhaFoco = computed(() => foco.value >> 4)
</script>

<template>
  <div class="grade">
    <p id="ajuda-grade" class="ajuda">{{ t('grade.ajuda') }}</p>
    <div class="moldura">
      <DecodificadorColuna aria-hidden="true" class="dec-coluna" :coluna="colunaMar" />
      <DecodificadorLinha aria-hidden="true" class="dec-linha" :linha="linhaMar" />
      <table
        class="matriz"
        role="grid"
        :aria-label="t('grade.titulo')"
        aria-describedby="ajuda-grade resumo-grade"
        aria-rowcount="16"
        aria-colcount="16"
      >
        <thead aria-hidden="true">
          <tr>
            <th scope="col" class="canto">
              <span class="visualmente-oculto">{{ t('grade.linhaColuna') }}</span>
            </th>
            <th
              v-for="coluna in INDICES"
              :key="coluna"
              scope="col"
              :class="{ ativa: coluna === colunaMar }"
            >
              {{ HEX[coluna] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="linha in INDICES"
            :key="linha"
            :aria-rowindex="linha + 1"
            :aria-hidden="linha === linhaFoco ? undefined : 'true'"
          >
            <th scope="row" aria-hidden="true" :class="{ ativa: linha === linhaMar }">
              {{ HEX[linha] }}
            </th>
            <td
              v-for="coluna in INDICES"
              :key="coluna"
              :ref="(el) => (celulasEl[enderecoDe(linha, coluna)] = el as HTMLElement)"
              :class="classesCelula(linha, coluna)"
              :data-endereco="HEX[linha]! + HEX[coluna]!"
              :aria-colindex="coluna + 1"
              :aria-hidden="foco === enderecoDe(linha, coluna) ? undefined : 'true'"
              :tabindex="foco === enderecoDe(linha, coluna) && editando === null ? 0 : undefined"
              :aria-label="rotulo(enderecoDe(linha, coluna))"
              :aria-current="enderecoDe(linha, coluna) === mar ? 'location' : undefined"
              @click="tocar(enderecoDe(linha, coluna))"
              @dblclick="editar(enderecoDe(linha, coluna))"
              @keydown="teclado($event, enderecoDe(linha, coluna))"
              @focus="foco = enderecoDe(linha, coluna)"
            >
              <input
                v-if="editando === enderecoDe(linha, coluna)"
                id="campo-celula"
                class="campo"
                :value="texto"
                maxlength="2"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                :aria-label="t('memoria.editar', { endereco: HEX[linha]! + HEX[coluna]! })"
                :aria-invalid="recusado ? 'true' : undefined"
                @input="filtrar"
                @keydown.enter.prevent="confirmar(true)"
                @keydown.esc.prevent="cancelar"
                @keydown.stop
                @blur="aoSairDoCampo(enderecoDe(linha, coluna))"
                @click.stop
                @dblclick.stop
              />
              <template v-else>{{ valor(enderecoDe(linha, coluna)) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p
      class="acesso"
      :class="acesso ?? undefined"
      :data-acesso="acesso ?? 'nenhum'"
      aria-hidden="true"
    >
      {{ resumo }}
    </p>
    <p id="resumo-grade" class="visualmente-oculto">{{ resumo }}</p>
    <p class="detalhe" data-detalhe>{{ detalhe }}</p>
    <ul class="legenda" aria-hidden="true">
      <li><span class="amostra amostra-mar"></span>{{ t('grade.legenda.mar') }}</li>
      <li><span class="amostra amostra-pc"></span>{{ t('grade.legenda.pc') }}</li>
      <li><span class="amostra amostra-pilha"></span>{{ t('grade.legenda.pilha') }}</li>
      <li><span class="amostra amostra-dado">DB</span>{{ t('grade.legenda.dado') }}</li>
    </ul>
  </div>
</template>

<style scoped>
.grade {
  --cel-l: 1.75rem;
  --cel-a: 1.45rem;
  --mira: color-mix(in srgb, var(--fio-be) 13%, transparent);
  --mira-forte: color-mix(in srgb, var(--fio-be) 32%, transparent);
  min-width: 0;
  padding: 6px 8px 8px;
}
.ajuda {
  margin: 0 0 6px;
  font-size: 0.78rem;
  color: var(--texto-suave);
  max-width: 60ch;
}
.moldura {
  display: grid;
  /* A matriz tem a largura exata de 17 células (cabeçalho + 16) mais a borda. */
  grid-template-columns: auto calc(17 * var(--cel-l) + 2px);
  grid-template-areas:
    '. coluna'
    'linha matriz';
  justify-content: start;
  overflow-x: auto;
  padding-bottom: 4px;
}
.dec-coluna {
  grid-area: coluna;
}
.dec-linha {
  grid-area: linha;
}
.matriz {
  grid-area: matriz;
}
table {
  width: calc(17 * var(--cel-l) + 2px);
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font: 0.8rem/1 var(--mono);
  background: var(--fundo-tabela);
  border: 1px solid var(--borda);
  border-radius: 6px;
}
th,
td {
  width: var(--cel-l);
  height: var(--cel-a);
  padding: 0;
  text-align: center;
}
th {
  font-weight: 700;
  color: var(--texto-suave);
  background: var(--fundo-cabecalho);
  transition: background-color 120ms;
}
th.ativa {
  color: var(--fundo);
  background: var(--fio-be);
}
td {
  position: relative;
  cursor: pointer;
  color: var(--texto);
  transition: background-color 120ms;
}
td:hover {
  background: var(--fundo-hover);
}
td.pilha {
  background: var(--fundo-pilha);
}
td.dado {
  font-style: italic;
  color: var(--texto-suave);
}
/* A mira: a linha e a coluna do endereço no MAR. */
td.na-linha,
td.na-coluna {
  background: var(--mira);
}
td.cruzamento {
  background: var(--mira-forte);
  font-weight: 700;
  box-shadow: inset 0 0 0 2px var(--fio-be);
  border-radius: 3px;
}
/* O acesso em andamento, nas cores do BD (leitura) e do controle (escrita). */
td.leitura {
  color: var(--fundo);
  background: var(--fio-bd);
  box-shadow: none;
}
td.escrita {
  color: var(--fundo);
  background: var(--fio-controle);
  box-shadow: none;
}
/* O PC: um canto marcado na célula. */
td.pc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  border: 5px solid transparent;
  border-top-color: var(--destaque);
  border-left-color: var(--destaque);
  border-top-left-radius: 2px;
}
td.escolhida {
  outline: 2px solid var(--destaque);
  outline-offset: -2px;
}
td:focus-visible {
  outline: 3px solid var(--destaque);
  outline-offset: -3px;
}
.campo {
  width: 100%;
  height: 100%;
  padding: 0;
  font: inherit;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  color: var(--texto);
  background: var(--fundo-painel);
  border: 2px solid var(--destaque);
  border-radius: 3px;
}
.campo[aria-invalid='true'] {
  border-color: var(--erro);
}
.acesso {
  margin: 6px 0 0;
  padding: 3px 8px;
  font: 600 0.8rem var(--mono);
  border-radius: 4px;
  border-left: 4px solid var(--fio-be);
  background: var(--mira);
}
.acesso.leitura {
  border-left-color: var(--fio-bd);
  background: color-mix(in srgb, var(--fio-bd) 15%, transparent);
}
.acesso.escrita {
  border-left-color: var(--fio-controle);
  background: color-mix(in srgb, var(--fio-controle) 18%, transparent);
}
.detalhe {
  margin: 4px 0 0;
  font: 0.8rem var(--mono);
}
.legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.72rem;
  color: var(--texto-suave);
}
.legenda li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.amostra {
  position: relative;
  display: inline-block;
  width: 1.1rem;
  height: 0.9rem;
  border: 1px solid var(--borda);
  border-radius: 2px;
  font: italic 0.6rem/0.9rem var(--mono);
  text-align: center;
}
.amostra-mar {
  background: var(--mira-forte);
  box-shadow: inset 0 0 0 2px var(--fio-be);
}
.amostra-pc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  border: 4px solid transparent;
  border-top-color: var(--destaque);
  border-left-color: var(--destaque);
}
.amostra-pilha {
  background: var(--fundo-pilha);
}

@media (max-width: 480px) {
  .grade {
    --cel-l: 1.1rem;
    --cel-a: 1.4rem;
  }
  table {
    font-size: 0.6rem;
  }
}
</style>

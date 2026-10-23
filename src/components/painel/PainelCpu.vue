<!--
  Painel novo da CPU (ADR 0005), no estilo do MEM-8E Web: registradores em
  caixas, o barramento interno (BI) no meio e, à direita, os fios que vão para
  a memória (BE, BD, RD e WR). A cada pulso de clock acendem os registradores
  que receberam um valor e os fios por onde o dado passou.

  À esquerda do BI: PC, SP, ACC e o bloco da ULA (A, B, a saída e as flags).
  À direita: MAR, MDR, IR e a unidade de controle, com o decodificador (DI) e
  o clock. As flags vão da ULA para a UC por baixo do BI.

  Lê o mesmo estado do painel que o visual clássico (DiagramaCpu.vue). Os
  registradores são botões: pressionar mostra o valor em binário. As siglas
  têm legenda ao apontar, focar ou tocar (LegendaSiglas.vue).

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ItemPainel } from '@/core'
import { fiosAcesos, type Fio } from '@/painel/fios'
import { SIGLA_DO_ITEM } from '@/painel/siglas'
import { useSimuladorStore } from '@/stores/simulador'
import FioCpu from './FioCpu.vue'

const simulador = useSimuladorStore()
const { t } = useI18n()

const VALORES_CLOCK = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

type Registrador = Exclude<ItemPainel, 'DI' | 'Z' | 'N' | 'C'>

/** Cada registrador, com os fios que o ligam ao BI (entrada e saída). */
const ESQUERDA: { item: Registrador; entra?: Fio; sai?: Fio; linha: number }[] = [
  { item: 'PC', entra: 'pcEntra', sai: 'pcSai', linha: 2 },
  { item: 'SP', sai: 'spSai', linha: 3 },
  { item: 'ACC', entra: 'accEntra', sai: 'accSai', linha: 4 },
  { item: 'A', entra: 'aEntra', linha: 6 },
  { item: 'B', entra: 'bEntra', linha: 7 },
  { item: 'ULA', sai: 'ulaSai', linha: 8 },
]
const DIREITA: { item: Registrador; entra?: Fio; sai?: Fio; linha: number }[] = [
  { item: 'MAR', entra: 'marEntra', sai: 'marSai', linha: 2 },
  { item: 'MDR', entra: 'mdrEntra', sai: 'mdrSai', linha: 3 },
  { item: 'IR', entra: 'irEntra', linha: 4 },
]
const FLAGS = ['Z', 'N', 'C'] as const

const acesos = computed(() => fiosAcesos(simulador.painel.barramentos))
const realcados = computed(() => new Set<ItemPainel>(simulador.painel.realcados))

function aceso(fio: Fio | undefined): boolean {
  return fio !== undefined && acesos.value.has(fio)
}

/** "PC:01" → "01". */
function valor(item: ItemPainel): string {
  return simulador.painel.textos[item].split(':')[1] ?? ''
}

function sigla(item: ItemPainel): string {
  return t(`siglas.${SIGLA_DO_ITEM[item]}.sigla`)
}

/** Seta do fio entre um registrador e o BI: sai do registrador ou entra nele. */
function direcao(lado: 'esquerda' | 'direita', entra: Fio | undefined, sai: Fio | undefined) {
  if (aceso(sai)) return lado === 'esquerda' ? 'direita' : 'esquerda'
  if (aceso(entra)) return lado === 'esquerda' ? 'esquerda' : 'direita'
  return null
}

// -------------------------------------------------------------------------
// Valor em binário do registrador pressionado
// -------------------------------------------------------------------------

const emBinario = ref<Registrador | null>(null)

function alternarBinario(item: Registrador) {
  emBinario.value = emBinario.value === item ? null : item
}

function binario(item: Registrador): string {
  void simulador.painel.textos[item] // recalcula quando o valor muda
  return simulador.valorBinario(item)?.split('=')[1] ?? ''
}

function rotuloDoRegistrador(item: Registrador): string {
  return t('diagrama.registrador', {
    texto: `${sigla(item)}:${valor(item)}`,
    binario: binario(item),
  })
}

// -------------------------------------------------------------------------
// Barramentos entre a CPU e a memória
// -------------------------------------------------------------------------

const direcaoBd = computed(() => {
  if (aceso('bdParaMemoria')) return 'direita'
  if (aceso('bdParaCpu')) return 'esquerda'
  return null
})

function aoMudarClock(evento: Event) {
  void simulador.mudarClock(Number((evento.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="conteiner-painel">
    <section class="painel" :aria-label="t('diagrama.descricao')" data-visual="novo">
      <h2 class="titulo-cpu">{{ t('painel.cpu') }}</h2>
      <div class="bloco-cpu" aria-hidden="true"></div>
      <div class="memoria" aria-hidden="true">{{ t('painel.memoria') }}</div>

      <!-- Barramento interno -->
      <FioCpu class="bi" sigla="bi" :aceso="aceso('bi')" cor="bi" largo vertical />
      <span class="nome-bi" aria-hidden="true" data-sigla="bi">{{ t('siglas.bi.sigla') }}</span>

      <!-- Bloco da ULA (atrás de A, B, saída e flags) -->
      <div class="bloco-ula" aria-hidden="true"></div>

      <!-- Registradores dos dois lados do BI -->
      <template v-for="lado in ['esquerda', 'direita'] as const" :key="lado">
        <template v-for="r in lado === 'esquerda' ? ESQUERDA : DIREITA" :key="r.item">
          <button
            type="button"
            class="registrador"
            :class="[`lado-${lado}`, { realcado: realcados.has(r.item) }]"
            :style="{ gridRow: r.linha }"
            :data-sigla="SIGLA_DO_ITEM[r.item]"
            :aria-label="rotuloDoRegistrador(r.item)"
            :aria-pressed="emBinario === r.item"
            @click="alternarBinario(r.item)"
            @blur="emBinario = null"
          >
            <span class="sigla">{{ sigla(r.item) }}</span>
            <span v-if="emBinario === r.item" class="valor binario">{{ binario(r.item) }}</span>
            <span v-else class="valor">{{ valor(r.item) }}</span>
          </button>
          <FioCpu
            v-if="r.entra || r.sai"
            :class="`ponte-${lado}`"
            :style="{ gridRow: r.linha }"
            :aceso="aceso(r.entra) || aceso(r.sai)"
            cor="bi"
            :direcao="direcao(lado, r.entra, r.sai)"
          />
        </template>
      </template>

      <!-- Flags da ULA, ligadas à UC por baixo do BI -->
      <div class="flags">
        <span
          v-for="flag in FLAGS"
          :key="flag"
          class="flag"
          :class="{ realcado: realcados.has(flag), ligada: valor(flag) === '1' }"
          :data-sigla="SIGLA_DO_ITEM[flag]"
        >
          <span class="sigla">{{ sigla(flag) }}</span>
          <span class="valor">{{ valor(flag) }}</span>
        </span>
      </div>
      <FioCpu class="fio-flags" :aceso="aceso('flags')" cor="controle" direcao="direita" />

      <!-- IR → UC -->
      <FioCpu
        class="fio-ir-uc"
        :aceso="aceso('irParaUc')"
        cor="controle"
        vertical
        direcao="baixo"
      />

      <!-- Unidade de controle, com o decodificador e o clock -->
      <div class="uc">
        <span class="sigla-uc" data-sigla="uc">{{ t('siglas.uc.sigla') }}</span>
        <span class="di" :class="{ realcado: realcados.has('DI') }" data-sigla="di">
          <span class="sigla">{{ sigla('DI') }}</span>
          <span class="valor">{{ valor('DI') }}</span>
        </span>
        <label class="clock" data-sigla="clk">
          <span class="nome-clock" aria-hidden="true">
            <span class="led" :class="{ aceso: simulador.painel.clockPiscando }"></span>
            <span class="sigla">{{ t('siglas.clk.sigla') }}</span>
          </span>
          <select
            :value="simulador.painel.clock"
            :aria-label="t('diagrama.clock')"
            @change="aoMudarClock"
          >
            <option v-for="v in VALORES_CLOCK" :key="v" :value="v">{{ v }}</option>
          </select>
        </label>
      </div>

      <!-- Para a memória -->
      <FioCpu
        class="externo linha-be"
        :nome="t('siglas.be.sigla')"
        sigla="be"
        :aceso="aceso('be')"
        :valor="valor('MAR')"
        cor="be"
        largo
        direcao="direita"
      />
      <FioCpu
        class="externo linha-bd"
        :nome="t('siglas.bd.sigla')"
        sigla="bd"
        :aceso="direcaoBd !== null"
        :valor="valor('MDR')"
        cor="bd"
        largo
        :direcao="direcaoBd"
      />
      <FioCpu
        class="externo linha-rd"
        :nome="t('siglas.rd.sigla')"
        sigla="rd"
        :aceso="aceso('rd')"
        cor="controle"
        direcao="direita"
      />
      <FioCpu
        class="externo linha-wr"
        :nome="t('siglas.wr.sigla')"
        sigla="wr"
        :aceso="aceso('wr')"
        cor="controle"
        direcao="direita"
      />
    </section>
  </div>
</template>

<style scoped>
/*
 * Grade: [registradores da esquerda] [ponte] [BI] [ponte] [registradores da
 * direita] [fios para a memória] [borda da memória]. Linhas: 1 título;
 * 2 PC/MAR; 3 SP/MDR; 4 ACC/IR; 5 IR → UC; 6 A; 7 B; 8 ULA; 9 flags.
 *
 * As medidas são em "em": o painel inteiro cresce com a largura disponível
 * (consultas de contêiner no fim).
 */
.conteiner-painel {
  container-type: inline-size;
}
.painel {
  --caixa: 5em;
  --caixa-uc: 6.25em;
  --ponte: minmax(0.75em, 4em);
  --externo: minmax(3em, 12em);
  --borda-memoria: 1.75em;
  display: grid;
  grid-template-columns:
    [esq] var(--caixa) [pe] var(--ponte) [bi] 0.75em [pd] var(--ponte)
    [dir] var(--caixa-uc) [ext] var(--externo) [mem] var(--borda-memoria) [fim];
  grid-template-rows: auto repeat(3, 3em) 1em repeat(3, 3em) 2.5em;
  justify-content: center;
  row-gap: 0.5em;
  align-items: center;
  padding: 0 0 0.75em;
  color: var(--texto);
}
.titulo-cpu {
  grid-row: 1;
  grid-column: esq / dir;
  margin: 0;
  padding: 0.5em 0.6em 0;
  font-size: 1em;
  z-index: 1;
}
.bloco-cpu {
  grid-row: 1 / -1;
  grid-column: esq / ext;
  align-self: stretch;
  margin-bottom: -0.75em;
  border-right: 2px solid var(--borda);
}
.memoria {
  grid-row: 2 / 10;
  grid-column: mem;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--chip-texto);
  background: var(--chip);
  border-radius: 6px;
}
.bloco-ula {
  grid-row: 6 / 10;
  grid-column: esq;
  align-self: stretch;
  margin: -0.25em 0 -0.25em 0.4em;
  border: 1px dashed var(--borda);
  border-radius: 8px;
}
.bi {
  grid-row: 2 / 9;
  grid-column: bi;
  z-index: 1;
}
.nome-bi {
  grid-row: 1;
  grid-column: bi;
  justify-self: center;
  align-self: end;
  font-size: 0.75em;
  font-weight: 700;
  color: color-mix(in srgb, var(--fio-bi) 40%, var(--texto));
  z-index: 1;
}

/* Registradores */
.registrador,
.flag,
.di {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
  color: var(--texto);
  background: var(--fundo-tabela);
  border: 1px solid var(--borda);
  border-radius: 6px;
  z-index: 1;
}
.registrador {
  height: 2.75em;
  margin: 0;
  padding: 0.1em 0.25em;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
}
.registrador.lado-esquerda {
  grid-column: esq;
  justify-self: end;
  width: calc(var(--caixa) - 0.75em);
}
.registrador.lado-direita {
  grid-column: dir;
  justify-self: start;
  width: calc(var(--caixa-uc) - 0.5em);
}
.registrador:hover {
  background: var(--fundo-hover);
}
.sigla {
  font-size: 0.72em;
  font-weight: 700;
  color: var(--texto-suave);
}
.valor {
  font: 700 1.05em var(--mono);
}
.valor.binario {
  font-size: 0.72em;
  letter-spacing: -0.02em;
}
.realcado {
  border-color: var(--destaque);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--destaque) 35%, transparent);
  background: color-mix(in srgb, var(--destaque) 12%, var(--fundo-tabela));
}
.realcado .sigla {
  /* Mais escuro (ou mais claro) que o destaque, para o contraste de 4,5:1. */
  color: color-mix(in srgb, var(--destaque) 65%, var(--texto));
}
.ponte-esquerda {
  grid-column: pe;
}
.ponte-direita {
  grid-column: pd;
}

/* Flags */
.flags {
  grid-row: 9;
  grid-column: esq;
  justify-self: end;
  display: flex;
  gap: 0.2em;
  width: calc(var(--caixa) - 0.75em);
  z-index: 1;
}
.flag {
  flex: 1;
  height: 2.2em;
}
.flag .valor {
  font-size: 0.85em;
}
.flag.ligada .valor {
  color: var(--destaque);
}
.fio-flags {
  grid-row: 9;
  grid-column: pe / dir;
  z-index: 2;
}

/* IR → UC */
.fio-ir-uc {
  grid-row: 5;
  grid-column: dir;
  justify-self: start;
  margin-left: calc((var(--caixa-uc) - 0.5em) / 2 - 2px);
  height: calc(100% + 1em);
}

/* Unidade de controle */
.uc {
  grid-row: 6 / 10;
  grid-column: dir;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4em;
  width: calc(var(--caixa-uc) - 0.5em);
  padding: 0.35em;
  border: 2px solid color-mix(in srgb, var(--fio-controle) 55%, var(--borda));
  border-radius: 8px;
  background: var(--fundo-tabela);
  z-index: 1;
}
.sigla-uc {
  align-self: center;
  font-weight: 800;
  font-size: 0.9em;
}
.di {
  height: 2.6em;
}
.clock {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
}
.nome-clock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
}
.clock select {
  width: 100%;
  min-height: 28px;
  font: 600 0.8em var(--mono);
  color: var(--texto);
  background: var(--fundo-barra);
  border: 1px solid var(--borda);
  border-radius: 4px;
}
.led {
  flex: none;
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  background: var(--fio-apagado);
}
.led.aceso {
  background: var(--fio-controle);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--fio-controle) 30%, transparent);
}

/* Para a memória */
.externo {
  grid-column: ext;
  padding: 0 2px 0 12px;
}
.linha-be {
  grid-row: 2;
}
.linha-bd {
  grid-row: 3;
}
.linha-rd {
  grid-row: 7;
}
.linha-wr {
  grid-row: 8;
}

/* Telas largas: o painel cresce junto. */
@container (min-width: 560px) {
  .painel {
    font-size: 1.1rem;
  }
}
@container (min-width: 760px) {
  .painel {
    font-size: 1.25rem;
  }
}

/* Celular de 320 px: o painel cabe sem rolar de lado (WCAG 1.4.10, refluxo). */
@container (max-width: 340px) {
  .painel {
    --caixa: 4.4em;
    --caixa-uc: 5.3em;
    --ponte: minmax(0.5em, 1.5em);
    --externo: minmax(2.4em, 1fr);
    --borda-memoria: 1.2em;
  }
  .valor.binario {
    font-size: 0.64em;
  }
}
</style>

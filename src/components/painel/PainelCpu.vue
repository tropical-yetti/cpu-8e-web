<!--
  Painel novo da CPU (ADR 0005), no estilo do MEM-8E Web: registradores em
  caixas, o barramento interno (BI) no meio e, à direita, os fios que vão para
  a memória (BE, BD, RD e WR). A cada pulso de clock acendem os registradores
  que receberam um valor e os fios por onde o dado passou.

  À esquerda do BI: PC, SP, ACC e o bloco da ULA, com as entradas A e B, a
  saída (ligada às duas entradas, para mostrar que o resultado combina A e B)
  e o Status Register com as flags. À direita: MAR, MDR, IR e a unidade de
  controle, com o decodificador (DI) e o clock. As flags vão do Status
  Register para a UC por baixo do BI.

  Lê o mesmo estado do painel que o visual clássico (DiagramaCpu.vue). Os
  registradores são botões: os valores aparecem em hexadecimal (0x05), e cada
  toque passa para decimal, binário e de volta a hexadecimal. As siglas têm
  legenda ao apontar, focar ou tocar (LegendaSiglas.vue).

  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ItemPainel } from '@/core'
import { formatar, proximaBase, type Base } from '@/painel/bases'
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
function texto(item: ItemPainel): string {
  return simulador.painel.textos[item].split(':')[1] ?? ''
}

/** "PC:01" → 1. */
function numero(item: Registrador): number {
  return Number.parseInt(texto(item), 16)
}

/** Nome mostrado na caixa: a sigla, ou "Saída" para a saída da ULA. */
function nome(item: ItemPainel): string {
  return item === 'ULA' ? t('painel.saida') : t(`siglas.${SIGLA_DO_ITEM[item]}.sigla`)
}

/** Seta do fio entre um registrador e o BI: sai do registrador ou entra nele. */
function direcao(lado: 'esquerda' | 'direita', entra: Fio | undefined, sai: Fio | undefined) {
  if (aceso(sai)) return lado === 'esquerda' ? 'direita' : 'esquerda'
  if (aceso(entra)) return lado === 'esquerda' ? 'esquerda' : 'direita'
  return null
}

// -------------------------------------------------------------------------
// Base de exibição de cada registrador (tocar passa para a próxima)
// -------------------------------------------------------------------------

const bases = reactive<Partial<Record<Registrador, Base>>>({})

function base(item: Registrador): Base {
  return bases[item] ?? 'hex'
}

function trocarBase(item: Registrador) {
  bases[item] = proximaBase(base(item))
}

function rotuloDoRegistrador(item: Registrador): string {
  const valor = numero(item)
  return t('painel.registrador', {
    nome: item === 'ULA' ? t('painel.saidaDaUla') : nome(item),
    hex: formatar(valor, 'hex'),
    dec: formatar(valor, 'dec'),
    bin: formatar(valor, 'bin').slice(2),
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

      <!-- Bloco da ULA (atrás de A, B, saída e Status Register) -->
      <div class="bloco-ula" aria-hidden="true"></div>
      <span class="nome-ula" aria-hidden="true" data-sigla="ula">{{ t('siglas.ula.sigla') }}</span>
      <!-- A e B → saída: o resultado combina as duas entradas -->
      <div class="combinacao" :class="{ aceso: realcados.has('ULA') }" aria-hidden="true">
        <span class="ligacao ligacao-a"></span>
        <span class="ligacao ligacao-b"></span>
      </div>

      <!-- Registradores dos dois lados do BI -->
      <template v-for="lado in ['esquerda', 'direita'] as const" :key="lado">
        <template v-for="r in lado === 'esquerda' ? ESQUERDA : DIREITA" :key="r.item">
          <button
            type="button"
            class="registrador"
            :class="[`lado-${lado}`, { realcado: realcados.has(r.item) }]"
            :style="{ gridRow: r.linha }"
            :data-sigla="r.item === 'ULA' ? undefined : SIGLA_DO_ITEM[r.item]"
            :data-base="base(r.item)"
            :aria-label="rotuloDoRegistrador(r.item)"
            @click="trocarBase(r.item)"
          >
            <span class="sigla">{{ nome(r.item) }}</span>
            <span class="valor" :class="`base-${base(r.item)}`">{{
              formatar(numero(r.item), base(r.item))
            }}</span>
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

      <!-- Status Register com as flags, ligado à UC por baixo do BI -->
      <div class="status">
        <span class="nome-status" data-sigla="status">{{ t('siglas.status.sigla') }}</span>
        <div class="flags">
          <span
            v-for="flag in FLAGS"
            :key="flag"
            class="flag"
            :class="{ realcado: realcados.has(flag), ligada: texto(flag) === '1' }"
            :data-sigla="SIGLA_DO_ITEM[flag]"
          >
            <span class="sigla">{{ nome(flag) }}</span>
            <span class="valor">{{ texto(flag) }}</span>
          </span>
        </div>
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
          <span class="sigla">{{ nome('DI') }}</span>
          <span class="valor">{{ texto('DI') }}</span>
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
        :valor="formatar(numero('MAR'), 'hex')"
        cor="be"
        largo
        direcao="direita"
      />
      <FioCpu
        class="externo linha-bd"
        :nome="t('siglas.bd.sigla')"
        sigla="bd"
        :aceso="direcaoBd !== null"
        :valor="formatar(numero('MDR'), 'hex')"
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
 * 2 PC/MAR; 3 SP/MDR; 4 ACC/IR; 5 rótulo ULA e IR → UC; 6 A; 7 B; 8 saída;
 * 9 Status Register.
 *
 * Na coluna da esquerda, as caixas ficam centralizadas no bloco da ULA junto
 * com a ligação de A e B à saída: [ligação][caixa], com a mesma folga dos dois
 * lados. PC, SP e ACC ficam alinhados com elas.
 *
 * As medidas são em "em": o painel inteiro cresce com a largura disponível
 * (consultas de contêiner no fim).
 */
.conteiner-painel {
  container-type: inline-size;
}
.painel {
  --esq: 6.6em;
  --caixa: 4.25em;
  --ligacao: 1.1em;
  --recuo: 0.15em;
  --folga: calc((var(--esq) - 2 * var(--recuo) - var(--caixa) - var(--ligacao)) / 2);
  --margem: calc(var(--recuo) + var(--folga));
  --caixa-uc: 6.25em;
  --ponte: minmax(0.75em, 4em);
  --externo: minmax(3em, 12em);
  --borda-memoria: 1.75em;
  display: grid;
  grid-template-columns:
    [esq] var(--esq) [pe] var(--ponte) [bi] 0.75em [pd] var(--ponte)
    [dir] var(--caixa-uc) [ext] var(--externo) [mem] var(--borda-memoria) [fim];
  grid-template-rows: auto repeat(3, 3em) 1.75em repeat(3, 3em) minmax(3.7em, auto);
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
  grid-row: 5 / 10;
  grid-column: esq;
  align-self: stretch;
  margin: -0.15em var(--recuo) -0.3em;
  border: 2px solid var(--borda-ula);
  border-radius: 8px;
  background: color-mix(in srgb, #c0dcc0 10%, transparent);
}
.nome-ula {
  grid-row: 5;
  grid-column: esq;
  justify-self: center;
  align-self: end;
  font-weight: 800;
  font-size: 0.9em;
  z-index: 1;
}

/* A e B ligados à saída */
.combinacao {
  grid-row: 6 / 9;
  grid-column: esq;
  justify-self: end;
  align-self: stretch;
  position: relative;
  width: var(--ligacao);
  margin-right: calc(var(--margem) + var(--caixa));
  --cor: var(--fio-apagado);
}
.combinacao.aceso {
  --cor: var(--destaque);
}
.ligacao {
  position: absolute;
  right: 0;
  /* Até o meio da saída (linha 8): 1,5em acima do fim. */
  bottom: 1.5em;
  border: 2px solid var(--cor);
  border-right: 0;
  border-radius: 4px 0 0 4px;
  transition: border-color 120ms;
}
.ligacao-a {
  left: 0;
  top: 1.5em;
}
.ligacao-b {
  left: 50%;
  top: 5em;
}
.ligacao-a::after {
  content: '';
  position: absolute;
  right: -2px;
  bottom: -6px;
  border: 5px solid transparent;
  border-left-color: var(--cor);
  border-right-width: 0;
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
  width: var(--caixa);
  margin-right: var(--margem);
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
.valor.base-bin {
  font-size: 0.66em;
  letter-spacing: -0.03em;
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
  /* Do lado da caixa, que fica recuada no bloco da ULA, até o BI. */
  margin-left: calc(-1 * var(--margem));
}
.ponte-direita {
  grid-column: pd;
}

/* Status Register e flags */
.status {
  grid-row: 9;
  grid-column: esq;
  justify-self: end;
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  width: calc(var(--caixa) + var(--ligacao));
  margin-right: var(--margem);
  padding: 0.2em 0.25em 0.25em;
  border: 2px solid var(--borda);
  border-radius: 6px;
  background: var(--fundo-painel);
  z-index: 1;
}
.nome-status {
  font-size: 0.62em;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  color: var(--texto-suave);
}
.flags {
  display: flex;
  gap: 0.2em;
}
.flag {
  flex: 1;
  height: 2em;
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
  margin-left: calc(-1 * var(--margem));
}

/* IR → UC */
.fio-ir-uc {
  /* Da borda de baixo do IR (linha 4) até a borda de cima da UC (linha 6). */
  grid-row: 5;
  grid-column: dir;
  justify-self: start;
  align-self: start;
  margin-left: calc((var(--caixa-uc) - 0.5em) / 2 - 2px);
  margin-top: -0.625em;
  height: calc(100% + 1.125em);
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
  background: color-mix(in srgb, var(--fio-controle) 10%, transparent);
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
  padding: 0 2px 0 4px;
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
    --esq: 5.9em;
    --caixa: 3.85em;
    --ligacao: 0.9em;
    --recuo: 0.1em;
    --caixa-uc: 5.3em;
    --ponte: minmax(0.5em, 1.5em);
    --externo: minmax(2.4em, 1fr);
    --borda-memoria: 1.2em;
  }
  .valor.base-bin {
    font-size: 0.56em;
  }
  /* Sem espaço para o valor ao lado do nome do barramento. */
  .externo :deep(.valor) {
    display: none;
  }
}
</style>

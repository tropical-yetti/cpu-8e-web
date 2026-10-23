<!--
  Barra de ferramentas: carregar, gravar, executar, pausar, reset,
  ajuda, modo de execução, fase atual e semáforo de status.

  Derivado de CPU8E_Panel.lfm/.pas (CPU-8E v2.2.3)
  Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
  Modificado em 2026-10-13: barra refeita em HTML; o botão Exit não existe
  no navegador e Help abre a documentação do site.
  Modificado em 2026-10-17: botão Parar (Halt) removido (v1.1, item 15).
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AjudaContextual from '@/components/AjudaContextual.vue'
import { useSimuladorStore } from '@/stores/simulador'
import type { Fase } from '@/core'
import type { Modo } from '@/simulador/controlador'
import iconeCarregar from '@/assets/original/Load.png'
import iconeGravar from '@/assets/original/SaveAs.png'
import iconeExecutar from '@/assets/original/Go.png'
import iconePausar from '@/assets/original/Pause.png'
import iconeResetar from '@/assets/original/Reset.png'
import iconeAjuda from '@/assets/original/help.png'
import semaforoVermelho from '@/assets/original/Red.png'
import semaforoAmarelo from '@/assets/original/amarelo.png'
import semaforoVerde from '@/assets/original/verde.png'

const simulador = useSimuladorStore()
const { t } = useI18n()

const emit = defineEmits<{ carregar: []; gravar: []; ajuda: [] }>()

const MODOS: Modo[] = ['passo', 'ciclo', 'continuo']
const FASES: { fase: Fase; cor: string }[] = [
  { fase: 'busca', cor: '#00FFFF' },
  { fase: 'operando', cor: '#FFFF00' },
  { fase: 'execucao', cor: '#00FF00' },
]
const SEMAFOROS = { parada: semaforoVermelho, pausa: semaforoAmarelo, execucao: semaforoVerde }

function aoMudarModo(evento: Event) {
  simulador.mudarModo((evento.target as HTMLSelectElement).value as Modo)
}
</script>

<template>
  <div class="barra" role="toolbar" :aria-label="t('barra.rotulo')">
    <div class="grupo">
      <button type="button" :title="t('barra.carregarDica')" @click="emit('carregar')">
        <img :src="iconeCarregar" alt="" />
        <span>{{ t('barra.carregar') }}</span>
      </button>
      <button type="button" :title="t('barra.gravarDica')" @click="emit('gravar')">
        <img :src="iconeGravar" alt="" />
        <span>{{ t('barra.gravar') }}</span>
      </button>
    </div>

    <div class="grupo">
      <button
        type="button"
        :disabled="!simulador.painel.habilitados.executar"
        :title="t('barra.executarDica')"
        @click="simulador.executar()"
      >
        <img :src="iconeExecutar" alt="" />
        <span>{{ t('barra.executar') }}</span>
      </button>
      <button
        type="button"
        :disabled="!simulador.painel.habilitados.pausar"
        :title="t('barra.pausarDica')"
        @click="simulador.pausar()"
      >
        <img :src="iconePausar" alt="" />
        <span>{{ t('barra.pausar') }}</span>
      </button>
      <button
        type="button"
        :disabled="!simulador.painel.habilitados.resetar"
        :title="t('barra.resetarDica')"
        @click="simulador.resetar()"
      >
        <img :src="iconeResetar" alt="" />
        <span>{{ t('barra.resetar') }}</span>
      </button>
      <button type="button" :title="t('barra.ajudaDica')" @click="emit('ajuda')">
        <img :src="iconeAjuda" alt="" />
        <span>{{ t('barra.ajuda') }}</span>
      </button>
    </div>

    <div class="grupo campo-modo">
      <label class="grupo" :title="t('barra.modoDica')">
        <span class="rotulo">{{ t('barra.modo') }}</span>
        <select :value="simulador.painel.modo" @change="aoMudarModo">
          <option v-for="modo in MODOS" :key="modo" :value="modo">{{ t(`modos.${modo}`) }}</option>
        </select>
      </label>
      <AjudaContextual pagina="simulador" secao="modos" :assunto="t('barra.modo')" />
    </div>

    <div class="grupo" role="group" :aria-label="t('barra.fase')">
      <span class="rotulo">{{ t('barra.fase') }}</span>
      <span
        v-for="{ fase, cor } in FASES"
        :key="fase"
        class="lampada"
        :class="{ acesa: simulador.painel.fase === fase }"
        :style="simulador.painel.fase === fase ? { background: cor } : undefined"
        :aria-current="simulador.painel.fase === fase ? 'step' : undefined"
      >
        {{ t(`fases.${fase}`) }}
      </span>
      <AjudaContextual pagina="ciclo" :assunto="t('barra.fase')" />
    </div>

    <div class="grupo">
      <span class="rotulo">{{ t('barra.status') }}</span>
      <img
        class="semaforo"
        :src="SEMAFOROS[simulador.painel.status]"
        :alt="t(`status.${simulador.painel.status}`)"
        :title="t(`status.${simulador.painel.status}`)"
      />
      <AjudaContextual pagina="simulador" secao="fase-status" :assunto="t('barra.status')" />
    </div>
  </div>
</template>

<style scoped>
.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 6px 8px;
  border: 1px solid var(--borda);
  border-bottom: none;
  background: var(--fundo-barra);
  font-family: Arial, sans-serif;
  font-size: 13px;
}
.grupo {
  display: flex;
  align-items: center;
  gap: 4px;
}
button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 48px;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
button:hover:not(:disabled) {
  border-color: var(--borda);
  background: var(--fundo-hover);
}
button:focus-visible {
  outline: 2px solid var(--destaque);
}
button:disabled {
  cursor: default;
  opacity: 0.4;
  filter: grayscale(1);
}
button img {
  width: 22px;
  height: 22px;
}
@media (max-width: 720px) {
  .barra {
    gap: 6px 12px;
  }
  button {
    min-width: 0;
    padding: 4px 3px;
    font-size: 10px;
  }
}
.rotulo {
  font-weight: 700;
  margin-right: 2px;
}
select {
  font:
    700 13px Arial,
    sans-serif;
  padding: 2px;
}
.lampada {
  padding: 1px 6px;
  border: 1px solid var(--borda);
  border-radius: 3px;
  color: var(--texto-suave);
  font-size: 12px;
}
.lampada.acesa {
  color: #000;
  font-weight: 700;
  border-color: #000;
}
.semaforo {
  width: 44px;
  height: 44px;
  margin: -10px 0;
}
</style>

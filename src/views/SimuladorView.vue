<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section>
    <h1>{{ t('nav.simulador') }}</h1>
    <p>{{ t('simulador.emConstrucao') }}</p>
  </section>
</template>

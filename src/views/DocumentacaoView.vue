<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section>
    <h1>{{ t('nav.documentacao') }}</h1>
    <p>{{ t('documentacao.emConstrucao') }}</p>
  </section>
</template>

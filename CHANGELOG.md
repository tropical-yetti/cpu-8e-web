# Registro de modificações

Este arquivo registra, com data, as modificações feitas em relação ao
simulador original CPU-8E v2.2.3 (exigência da GPL-3.0, seção 5a) e a
evolução do próprio CPU-8E Web.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### 2026-10-13 — Início do port

- Projeto criado com Vite, Vue 3 e TypeScript.
- Núcleo da CPU reescrito em TypeScript a partir de `CPU8E.pas` e
  `CPU8E_Control.pas`, com a mesma aritmética e a mesma sequência de
  micro-operações do original, inclusive os defeitos conhecidos.
- O laço de execução bloqueante do original (`Sleep` +
  `Application.ProcessMessages` + `Abort`) foi substituído por um gerador de
  eventos: a CPU emite cada micro-operação e a interface decide quando
  mostrá-la. Isso não altera os resultados dos programas.
- Ferramenta `tools/referencia/cpu8e_ref.pas`: versão do núcleo original sem
  interface gráfica, usada para gerar os gabaritos dos testes.

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

### 2026-10-13 — Painel do simulador

- Painel da CPU redesenhado em SVG a partir das posições, cores e dicas do
  formulário original (`CPU8E_Panel.lfm`, extraídas por
  `tools/layout/extrair-layout.ts`). Ícones da barra de ferramentas e do
  semáforo reaproveitados do original.
- Botões, modos de execução, pausa, clock e mensagens seguem a lógica de
  comando do original (`Cmd`, `RunProgram`, `PulseClock`, `Pause`), inclusive
  suas particularidades.
- Diferenças inevitáveis por causa da plataforma:
  - Ajuda abre a documentação do site, em vez do `gedit`.
  - Não há botão Sair (Exit); basta fechar a aba.
  - Os programas `teste.bin` e `allopcodes.bin`, que vinham na pasta do
    original, são oferecidos na janela Carregar.
  - Gravar baixa o arquivo pelo navegador.
  - Apertar Executar durante uma execução contínua é ignorado; no original
    isso iniciava uma segunda execução dentro da primeira.
  - Interface também em inglês, com dicas traduzidas.

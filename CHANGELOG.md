# Registro de modificações

Este arquivo registra, com data, as modificações feitas em relação ao
simulador original CPU-8E v2.2.3 (exigência da GPL-3.0, seção 5a) e a
evolução do próprio CPU-8E Web.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### 2026-10-14 — Siglas do painel no idioma da interface

- Na interface em inglês, as siglas portuguesas do desenho original aparecem
  em inglês: ULA → ALU, UC → CU, DI → ID, BI → IB, BD → DB e BE → AB, também
  no valor em binário, nos rótulos para leitores de tela e na documentação em
  inglês. Em português, o painel continua idêntico ao original.

### 2026-10-17 — Correções da v1.1 nos botões

- **Reset** e **Carregar** interrompem também a execução contínua. No
  original, a execução seguia a partir do estado zerado e recomeçava o
  programa (item 13).
- O botão **Parar** (Halt) e o atalho Ctrl+H foram removidos. Ele encerrava a
  execução sem deixar continuar e só servia para interromper antes do Reset,
  que agora interrompe sozinho (item 15).
- **Pausar** sem nada em execução não tem efeito. No original, o Executar
  seguinte não iniciava a execução (item 11).
- **Executar** sem programa mostra o aviso e deixa o semáforo vermelho. No
  original, ele ficava verde (item 12).
- O decodificador começa com `DI:NOP`. O formulário original trazia `ID:NOP`,
  e a caixa trocava de nome no primeiro Reset (item 10).

### 2026-10-17 — Correções da v1.1 no núcleo da CPU

- Deslocamentos e rotações com contador `00` mantêm o ACC e as flags. No
  original, o ACC recebia a saída antiga da ULA, de outra instrução (item 1).
- O `STO` escreve na memória uma única vez: a execução passa de 3 para 2
  pulsos de clock. O original animava a escrita duas vezes (item 3).
- No `NOT`, o pulso ACC → A aparece antes do cálculo da ULA, na ordem em que
  as coisas acontecem. O resultado não muda (item 14).
- A subtração da ULA (`SUB` e `CMP`) foi reescrita de forma explícita, com o
  carry igual a 1 quando A ≥ B. O resultado é o mesmo do original, conferido
  em todas as combinações de entrada (item 2).
- O simulador de referência em Pascal (`tools/referencia/cpu8e_ref.pas`)
  recebeu as mesmas correções em blocos `{$IFDEF CORRIGIDO}`; os testes
  continuam comparando o núcleo com ele pulso a pulso.

## [1.0.0] — 2026-10-13

Primeira versão: port funcional do CPU-8E v2.2.3 para o navegador, com
fidelidade total ao original e documentação em português e inglês.

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

### 2026-10-13 — Documentação no site

- Documentação de uso em português e inglês, dentro do próprio site
  (`src/docs/`): primeiros passos, a CPU, o ciclo de instrução, o conjunto de
  instruções, o uso do simulador, como escrever programas e as diferenças em
  relação ao original. Substitui o `CPU8E_Sim.txt` do original.
- A tabela de instruções é gerada a partir de `src/core/opcodes.ts`.
- Os programas de exemplo da documentação têm um botão para carregá-los no
  simulador e são executados pelos testes, que conferem o resultado anunciado.
- Botões "?" no simulador levam à seção correspondente da documentação.

### 2026-10-13 — Polimento para a versão 1.0

- Acessibilidade: diagrama utilizável com teclado e leitor de tela (estado da
  CPU em tabela, anúncio a cada parada, registradores focáveis), alvos de toque
  maiores, rótulos legíveis no tema escuro e dicas ao tocar no diagrama.
- No celular, o diagrama pode ser ampliado (com rolagem lateral) ou ajustado à
  tela.
- Execução na velocidade máxima mais leve: a tela é redesenhada uma vez por
  quadro, e só as linhas da memória que mudaram.
- Testes em Chromium, Firefox e WebKit, no computador, tablet e celular;
  Lighthouse e cobertura de testes no CI.
- Versão visível no rodapé e na página Sobre; ícone do simulador original como
  favicon.
- Toda menção ao [Prof. Joel Guilherme da Silva Filho](http://lattes.cnpq.br/7746085908957322),
  no site e no repositório, leva ao currículo Lattes dele. Um teste garante
  que nenhuma menção nova fique sem o link.

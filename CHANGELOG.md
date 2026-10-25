# Registro de modificações

Este arquivo registra, com data, as modificações feitas em relação ao
simulador original CPU-8E v2.2.3 (exigência da GPL-3.0, seção 5a) e a
evolução do próprio CPU-8E Web.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### 2026-10-25 — Revisão final da 2.0.0 (#23)

- README: captura nova (painel novo e memória por dentro), "O que dá para
  fazer" com a memória por dentro, as bases, o guia e o visual clássico, e o
  leitor de tela simulado em "Acessibilidade".
- Imagem de compartilhamento (`og.png`) refeita com a tela da 2.0.
- Diferenças do original: a introdução não diz mais que os testes comparam
  com o código Pascal (isso foi até a 1.1), e a nova seção "Novidades da
  série 2.x" lista o que mudou na tela, com a CPU igual à da 1.1.
- NOTICE.md: resumo das modificações até a série 2.x.
- Ajustes de texto em Simulador (pilha na grade e na tabela) e em Primeiros
  passos ("painel", e não "diagrama").

### 2026-10-25 — Leitor de tela simulado

- Testes com o leitor de tela virtual do Guidepup (#12), como no MEM-8E Web:
  ler a página inteira passa por uma célula só da grade; os registradores
  dizem o nome e o valor nas três bases; o visual clássico é lido pela
  descrição; cada seta na grade anuncia só a célula nova; o resumo da grade
  e o anúncio de cada pulso; a árvore de acessibilidade do painel e da
  memória.
- Correções que esses testes acharam: o visual clássico lia as dicas de cada
  parte do desenho (agora ocultas; o SVG é lido pela descrição); sem
  programa carregado, um parágrafo vazio era anunciado antes do painel.
- Grade da memória: o primeiro toque na célula 00 abria a edição, porque
  ela começa com o foco do teclado. Agora o primeiro toque em qualquer
  célula só escolhe, e o segundo edita.

### 2026-10-25 — Guia de primeiro acesso e ajuda "?"

- Na primeira visita, um guia de dez balões apresenta a tela: comandos,
  modo, fase, status, painel, ULA, memória e visual clássico. Cada balão
  destaca a sua parte, explica, sugere algo para experimentar e leva à
  documentação. Não é modal; Esc fecha, F6 alterna o foco entre o balão e a
  parte em destaque. Visto uma vez, fica guardado no navegador.
- Botão **Ver o guia**, embaixo do painel, para rever o guia.
- Memória por dentro: no celular, o decodificador de linha volta a mostrar a
  entrada (A7–A4 e o valor), na vertical, ao lado do nome.
- Os botões "?" (Modo, Fase, Status, painel e memória) abrem o balão da sua
  parte, no lugar do link direto para a documentação; o balão tem o link
  "Ler mais na documentação". O "?" da memória aparece nas duas vistas.
- O guia e o balão são copiados do MEM-8E Web, com os passos do CPU-8E Web.
- Documentação: seção "Guia e ajuda" em Simulador e menção em Primeiros
  passos.
- Testes: todo passo aponta para uma parte que existe e tem texto nos dois
  idiomas; os links "Ler mais" levam a seções que existem; ponta a ponta do
  guia (primeira visita, Esc, "?", Ver o guia, axe nos dois temas).

### 2026-10-25 — Memória por dentro (ADR 0006)

- A memória ganha a vista **Por dentro (linha × coluna)**, a nova vista
  padrão (#17): os 256 bytes numa grade 16 × 16, com o decodificador de linha
  (A7–A4) à esquerda e o de coluna (A3–A0) acima. A tabela de antes continua
  no seletor **Por dentro | Tabela**, e a escolha fica guardada no navegador.
- A linha e a coluna do MAR ficam marcadas o tempo todo, em verde (a cor do
  BE). Num pulso de leitura, a célula acessada acende em ciano (BD); num de
  escrita, em amarelo (controle). Uma faixa embaixo da grade diz o acesso em
  andamento.
- A grade marca a célula do PC, a pilha e os bytes que são dados; a célula
  escolhida mostra o endereço, o valor e o símbolo. Um toque escolhe, outro
  toque (dois cliques, Enter ou um dígito hexadecimal) edita, com a mesma
  validação da tabela; Enter segue para o endereço seguinte.
- Leitor de tela: só a célula escolhida é anunciada, e um resumo diz a linha
  e a coluna do MAR e o acesso.
- A grade e os decodificadores são copiados e adaptados do MEM-8E Web, sem o
  sinal CS (os decodificadores da CPU-8E estão sempre habilitados).
- Numa escrita, o valor novo aparece já no pulso do WR, nas duas vistas (antes,
  só no pulso seguinte).
- Documentação: seção "Por dentro" em Simulador, Primeiros passos e A CPU-8E.
- Painel: o fio IR → UC agora vai da borda do IR até a borda da UC; antes,
  parava no meio do caminho.

### 2026-10-23 — Painel novo e visual clássico (ADR 0005)

- Painel novo, no estilo do MEM-8E Web, como padrão (#16): registradores em
  caixas, o barramento interno no meio, fios coloridos por barramento (BI
  azul, BE verde, BD ciano, controle amarelo) com seta para onde o dado vai,
  e a borda da memória. Cresce com a tela e cabe em 320 px sem rolar de lado.
- O desenho do formulário original continua como **Visual: Clássico**. A
  escolha fica guardada no navegador e vale também para a documentação.
- Siglas com legenda ao apontar, focar ou tocar, e a página "Siglas" na
  documentação, geradas da mesma tabela. A legenda é copiada do MEM-8E Web.
- Bloco da ULA com rótulo próprio e borda mais forte: as entradas A e B
  ligadas à **Saída** (o antigo campo ULA), para mostrar que o resultado
  combina as duas, e o **Status Register** com as flags Z, N e C. As ligações
  acendem no pulso em que a ULA calcula.
- Borda verde no bloco da ULA (do verde do painel original, mais forte para o
  contraste) e fundo amarelo claro na UC, as duas unidades no mesmo padrão.
- As pontas das setas terminam na borda do fio e não ficam mais escondidas
  atrás das caixas (entrada dos registradores, IR → UC, flags → UC).
- O nome do programa carregado aparece na linha do seletor de visual, entre a
  barra de ferramentas e o painel: carregar um arquivo não empurra mais o
  painel (nem o rodapé) para baixo.
- No painel novo, os valores aparecem com o prefixo `0x`. Tocar num
  registrador troca a base: hexadecimal, decimal, binário (`0b…`) e de volta;
  cada registrador guarda a sua. Leitores de tela ouvem as três bases.
- Legenda do A mais precisa: "em geral, uma cópia do ACC" (no `LOD` e nos
  deslocamentos ele recebe outros valores).
- Testes: as três bases; cada caminho de dados acende os fios certos; toda sigla tem nome
  nos dois idiomas e é a mesma do visual clássico; ponta a ponta nos dois
  visuais; axe também no visual clássico e na página "Siglas".

### 2026-10-23 — ADRs 0005 e 0006

- ADR 0005 (#16): painel novo, no estilo do MEM-8E Web, como padrão, e o
  desenho original como "visual clássico".
- ADR 0006 (#17): memória por dentro (linha × coluna) como vista padrão,
  acompanhando o MAR, com a tabela como alternativa.

### 2026-10-23 — Validação por instrução e estado

- Novos testes por instrução (ADR 0003, #7): para os 35 códigos válidos, o
  estado antes e depois de uma única instrução (memória inteira, ACC, PC, SP,
  flags e saída da ULA), com os casos de borda: estouro de 8 bits e com sinal,
  empréstimo, zero, negativo, contador `00` e maior que 8, desvios tomados e
  não tomados, pilha que alcança o programa e código inválido.
- Testes próprios para as flags Z, N e C: cada instrução da ULA aparece com
  casos que ligam e que desligam cada flag (o teste começa com a flag no valor
  oposto, para provar que ela foi escrita), e as instruções que não passam
  pela ULA (HLT, NOP, desvios, CAL, RET e STO) mantêm as três flags, ligadas
  ou desligadas.
- Novo programa de teste "todas as instruções": passa pelas 23 instruções e
  pelos estouros, chama uma sub-rotina e grava os resultados de `80` a `8F`.
- Saíram a referência em Pascal (`tools/referencia/`), os gabaritos, o teste
  com programas aleatórios e o Free Pascal do CI; tudo continua no histórico e
  na tag `v1.1.0`. A tabela completa da ULA continua como teste de regressão.
- Saiu o ícone `Halt.png`, que ficou sem uso quando o botão Parar foi
  removido na 1.1.

### 2026-10-23 — Ordem da série 2.x

- A 2.0.0 passa a ser o primeiro lançamento da série 2.x: reúne o processo,
  os testes por instrução, o painel novo, a memória por dentro como vista
  padrão e o guia de primeiro acesso. A 2.1.0 traz os experimentos, o roteiro
  de aula e a revisão da documentação; o montador fica para a 2.2.0
  (`docs/PLANO.md`).
- Uma versão só ganha número quando traz algo novo para quem usa o site; até
  lá, as mudanças ficam aqui, em "Não lançado" (CONTRIBUTING).

### 2026-10-23 — Rodapé, página Sobre e traduções

- O rodapé mostra, ao lado da versão, o commit de onde o site foi gerado, com
  link para ele no GitHub.
- A página Sobre ganhou a seção "Acessibilidade", que explica como o site é
  testado e pede ajuda a quem usa leitor de tela (#12).
- Novo teste: português e inglês têm as mesmas chaves de tradução, e nenhuma
  mensagem está vazia.
- O CI gera em cada pull request uma prévia do site num único `index.html`,
  disponível nos artefatos da execução.

### 2026-10-23 — Plano e CONTRIBUTING

- O plano do projeto passa a morar no repositório, em `docs/PLANO.md`, com os
  objetivos de aprendizagem, o que a série 2.x traz e os marcos versão a
  versão. Ele muda por pull request, junto com o trabalho.
- O `CONTRIBUTING.md` ganhou as seções de ramos e pull requests, versões e
  lançamentos (ADR 0002), decisões de arquitetura (ADR 0001) e validação
  (ADR 0003), com a lista de verificações antes de um pull request e as metas
  de cobertura. A seção "Fidelidade ao original" deu lugar à validação por
  instrução e estado.
- O README voltou a ter as seções que tinha perdido na preparação da 1.0.0
  (o que dá para fazer, desenvolvimento e licença) e ganhou uma de
  acessibilidade, que pede ajuda a quem usa leitor de tela na issue #12.

### 2026-10-23 — Registros de decisões de arquitetura

- Nova pasta `docs/adr/`, com modelo, índice e as ADRs 0001 a 0004, como
  Proposta: registros de decisão com diagramas em Mermaid (#5), séries 1.x e
  2.x, ramos e regra de lançamentos (#6), validação por instrução e estado
  (#7) e código e estilo comuns com o MEM-8E Web (#8).
- Modelo de issue **Decisão de arquitetura (ADR)**, para qualquer pessoa
  propor uma decisão com a mesma estrutura.
- As ADRs 0001 a 0004 foram aceitas, com a aprovação registrada nas issues
  #5 a #8.

## [1.1.0] — 2026-10-23

Correções dos defeitos do simulador original que a versão 1.0 reproduzia de
propósito. Os itens citados são os da tabela de correções do plano do
projeto; o antes e o depois de cada um estão na página "Diferenças do
original" da documentação.

### 2026-10-23 — CI

- Os testes de ponta a ponta rodam na imagem oficial do Playwright, que já
  traz os navegadores e as bibliotecas de sistema, em vez de instalá-los a
  cada execução. `tests/ci.test.ts` confere que a versão da imagem é a mesma
  do `@playwright/test`, agora fixada sem `^`.
- O CI roda também a cada push na `dev`.

### 2026-10-17 — Documentação da v1.1

- A página "Diferenças do original" ganhou a seção "Corrigido na versão 1.1",
  com o comportamento antigo e o novo. As páginas Ciclo de instrução,
  Instruções e Usando o simulador foram atualizadas (STO com 2 pulsos,
  contador `00`, botões, edição, Gravar, coluna Símbolo e pilha).
- `CONTRIBUTING.md` explica como corrigir um defeito do original mantendo os
  testes de fidelidade.

### 2026-10-17 — Correções da v1.1 na tabela de memória

- A coluna **Símbolo** separa código de dados: o disassembler segue os
  caminhos que a execução pode tomar a partir de `00`, inclusive os desvios, e
  mostra como `DB 05` o que nenhum caminho alcança. O original lia toda a
  memória como código, e um byte de dado podia desalinhar as instruções
  seguintes (item 8).
- As posições ocupadas pela pilha (acima do SP) aparecem destacadas, com a
  palavra "pilha". Quando um `CAL` grava o endereço de retorno dentro do
  programa, a execução pausa com uma mensagem. No original, a pilha
  sobrescrevia o programa sem aviso (item 7).

### 2026-10-17 — Correções da v1.1 na memória e nos arquivos

- A tabela de memória só aceita valores hexadecimais de `00` a `FF`. Um valor
  inválido é recusado com um aviso, e a memória não muda. O original gravava
  `00` sem avisar e cortava valores acima de `FF` (item 5).
- **Gravar** salva até o último byte diferente de zero da memória, e nunca
  menos que o programa carregado. O original gravava só o tamanho do programa,
  deixando de fora os dados escritos depois dele, com `STO` ou pela pilha
  (item 4).

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

### 2026-10-14 — Siglas do painel no idioma da interface

- Na interface em inglês, as siglas portuguesas do desenho original aparecem
  em inglês: ULA → ALU, UC → CU, DI → ID, BI → IB, BD → DB e BE → AB, também
  no valor em binário, nos rótulos para leitores de tela e na documentação em
  inglês. Em português, o painel continua idêntico ao original.

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

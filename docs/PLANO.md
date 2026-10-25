# Plano — CPU-8E Web

> Versão para a web do simulador educacional
> [CPU-8E](https://github.com/wanderlan/cpu-8e) (IESB, v2.2.3). O painel mostra
> registradores, ULA, barramentos e memória enquanto um programa roda pulso a
> pulso. Projeto irmão do [MEM-8E Web](https://github.com/tropical-yetti/mem-8e-web),
> que abre a memória e mostra o que acontece dentro dela.

- **Série 1.x (encerrada):** reproduziu o simulador original com fidelidade
  total (1.0.0) e corrigiu os defeitos dele (1.1.0). A tag `v1.1.0` é a última
  versão conferida pulso a pulso contra o código Pascal original.
- **Série 2.x (atual):** recursos próprios do CPU-8E Web, com a mesma cara e os
  mesmos padrões do MEM-8E Web ([ADR 0004](adr/0004-codigo-e-estilo-comuns.md)).
- **Prioridade:** o que ajuda o aluno a entender a CPU: escrever programas em
  assembly, ver cada pulso de clock, enxergar a memória por dentro e provocar
  erros de propósito.
- **Licença:** GPL-3.0-or-later, com `NOTICE.md` e os créditos dos autores do
  original.

---

## 1. Objetivos de aprendizagem

Ao usar o simulador, o aluno deve conseguir explicar:

1. O **ciclo de instrução** (busca, operando, execução) e o que cada pulso de
   clock move entre registradores, ULA e memória.
2. Como um programa em **assembly** vira bytes na memória, e por que os
   rótulos e os comentários não chegam à memória.
3. O que fazem as **flags** Z, N e C, e a diferença entre comparar números com
   e sem sinal (JGT × JCY).
4. Como a **pilha** guarda os endereços de retorno, e o que acontece quando ela
   alcança o programa.
5. Como o endereço no **MAR** escolhe uma linha e uma coluna dentro da memória.
6. O que acontece nos casos de erro: estouro, código inválido, laço sem fim,
   programa que modifica o próprio código.

## 2. O que a 2.x traz

- **Painel novo** ([ADR 0005](adr/0005-painel-novo-e-visual-classico.md)): o mesmo estilo do
  MEM-8E Web como padrão, com fios coloridos por tipo de barramento e siglas
  com legenda. O desenho do formulário original continua como opção "visual
  clássico".
- **Memória por dentro (linha × coluna)** ([ADR 0006](adr/0006-memoria-por-dentro.md)): a vista padrão da memória, com os decodificadores de linha
  (A7–A4) e de coluna (A3–A0) e a grade 16 × 16; a tabela de antes continua
  como alternativa. A linha e a coluna acompanham o MAR; os pulsos de leitura
  e escrita mostram o acesso.
- **Guia de primeiro acesso** com balões e ajuda "?" que abre o mesmo balão.
- **Experimentos "e se…?"** ([ADR 0007](adr/README.md), a escrever): estouro na
  soma, comparação com e sem sinal, pilha que alcança o programa, código
  inválido, laço sem fim, programa que se modifica com `STO`, salto para o meio
  dos dados.
- **Documentação:** "Roteiro de aula" com exercícios e respostas e página
  "Siglas"; com o montador, a página "Do assembly ao binário".
- **Programas em assembly, com montador transparente**
  ([ADR 0008](adr/README.md), a escrever): o aluno escreve ou abre um `.asm`, e a
  janela Carregar mostra lado a lado o assembly e o código de máquina gerado
  (endereço, bytes em hex e em bits), atualizado enquanto se digita.
  - Sintaxe igual à do disassembler: `LOD 05` (imediato), `LOD [16]` (direto),
    comentários com `;`, rótulos (`laco:` … `JGT laco`), `DB 05` e `ORG 20`.
  - Erros apontados na linha, em português e inglês; o botão de carregar só
    fica disponível sem erros.
  - Binários `.bin` continuam aceitos, numa lista separada, e aparecem só
    como bytes, sem validação, para quem quer carregar uma instrução inválida
    de propósito.
  - Exemplos: `teste.bin` e `allopcodes.bin` desmontados em `.asm` comentados
    (os `.bin` originais continuam, sem modificação), e novos exemplos
    comentados.
  - Editar a memória não altera o arquivo carregado. **Gravar** cria um
    arquivo novo, em `.bin` ou `.asm`; em `.asm`, um aviso explica que o texto
    vem do disassembler, sem os comentários e os rótulos do original.

## 3. Validação

Por instrução e por estado ([ADR 0003](adr/0003-validacao-por-instrucao.md)):

- **Instruções:** para cada um dos 35 códigos (23 instruções), o estado antes
  e depois (memória, registradores, flags, PC e SP), com os casos de borda:
  carry, empréstimo, zero, negativo, contador `00` e maior que 8, desvios
  tomados e não tomados, pilha e código inválido.
- **Programa "todas as instruções":** passa por todas elas e pelos estouros, e
  um teste confere a memória e os registradores no fim.
- **ULA:** a tabela completa, gravada em `tests/fixtures/`, como regressão.
- **Montador:** montar e desmontar de volta dá os mesmos bytes; cada erro
  aponta a linha certa e não muda nada.
- **Experimentos e guia:** cada experimento prepara a situação e chega ao
  resultado esperado; o guia aponta partes que existem na tela.
- **Ponta a ponta:** Playwright nos seis perfis de navegador e aparelho, axe
  nos dois temas, teclado, refluxo em 320 px e um leitor de tela simulado.

## 4. Processo

- `main` ← `dev` ← um ramo por funcionalidade ou correção. A `main` só recebe
  lançamentos, que juntam várias versões menores já testadas na `dev`
  ([ADR 0002](adr/0002-versoes-e-lancamentos.md)). O passo a passo está no
  [CONTRIBUTING](../CONTRIBUTING.md).
- **ADRs** em Markdown, com diagramas em Mermaid, cada uma discutida numa
  issue ([ADR 0001](adr/0001-registros-de-decisao.md)).
- Este plano muda por pull request, antes ou junto do trabalho que descreve.

## 5. Marcos

| Versão | Entrega                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Situação |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1.0.0  | Port do CPU-8E v2.2.3 com fidelidade total, documentação em pt/en, acessibilidade.                                                                                                                                                                                                                                                                                                                                                                                                                                               | lançada  |
| 1.1.0  | Correções dos defeitos do original.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | lançada  |
| 2.0.0  | **Lançamento.** Processo (ADRs 0001–0004 [#5](https://github.com/tropical-yetti/cpu-8e-web/issues/5)–[#8](https://github.com/tropical-yetti/cpu-8e-web/issues/8), este plano, CONTRIBUTING, CI, commit no rodapé, teste das traduções); testes por instrução e programa "todas as instruções", sem a referência em Pascal; painel novo com o visual clássico como opção e siglas com legenda (ADR 0005); memória por dentro como vista padrão (ADR 0006); guia de primeiro acesso e ajuda "?"; revisão final numa issue própria. | lançada  |
| 2.1.0  | Experimentos "e se…?" (ADR 0007); Roteiro de aula com exercícios e respostas; revisão da documentação.                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| 2.2.0  | Montador transparente, vista lado a lado, binários separados, exemplos `.asm`, Gravar em `.bin` ou `.asm`, página "Do assembly ao binário" (ADR 0008).                                                                                                                                                                                                                                                                                                                                                                           |          |

A 2.0.0, lançada em 2026-10-25, é a primeira versão da série 2.x com número
e o primeiro lançamento: reúne tudo o que chegou à `dev` até o guia de
primeiro acesso, para o aluno
encontrar de uma vez a cara nova, a memória por dentro e o guia. O guia vem
depois do painel e da memória por dentro porque aponta para as partes da tela.
Os experimentos e o roteiro não dependem do montador; ele fica por último e,
quando chegar, os exemplos da documentação passam a ser escritos em assembly.

## 6. Ideias para depois

- Programas guardados no navegador ("Meus programas"), com a opção de reabrir
  o último.
- Descrição em texto de cada micro-operação; voltar um passo.
- Pontos de parada em endereços; programa compartilhado por link.
- Instalação como app (PWA) e outros idiomas.
- Integração com o MEM-8E Web: clicar no bloco Memória e abrir o MEM-8E Web na
  transação corrente.
- Exercícios e desafios verificados pelo próprio simulador.

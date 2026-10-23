# Como contribuir

Obrigado pelo interesse! Este projeto também é material de estudo, então o
código precisa ser fácil de ler.

## Ramos e pull requests

- `main` é o que está publicado no site. Ela só recebe **lançamentos**, para
  ficar estável e sem mudanças frequentes.
- `dev` recebe o trabalho em andamento e é o ramo padrão do repositório.
- Cada funcionalidade ou correção tem o próprio ramo, criado a partir de `dev`
  (`feat/…`, `fix/…`, `docs/…`, `test/…`, `ci/…`, `chore/…`), e volta para
  `dev` por pull request.

### Versões e lançamentos

As versões seguem o [versionamento semântico](https://semver.org/lang/pt-BR/).
A série 1.x reproduziu o simulador CPU-8E original e corrigiu os defeitos dele
(até a 1.1.0); a série 2.x traz os recursos próprios do CPU-8E Web
([ADR 0002](docs/adr/0002-versoes-e-lancamentos.md)).

- **Versões menores** (2.1.0, 2.2.0…) ficam na `dev`: cada uma ganha a sua
  seção no CHANGELOG e o número no `package.json`, num pull request
  `chore: versão X.Y.Z` para a `dev`.
- **Lançamento:** quando um conjunto de versões menores está estável e
  testado, um único pull request `dev` → `main` publica tudo de uma vez. O
  lançamento ganha uma tag (`v2.2.0`) e uma release no GitHub.
- **Correção urgente** (um erro no site publicado): o ramo `fix/…` sai da
  `main`, vira uma versão de correção (2.2.1) e entra direto na `main`. Em
  seguida, a `main` é integrada na `dev`, para a correção não se perder no
  próximo lançamento.

O plano das próximas versões está em [`docs/PLANO.md`](docs/PLANO.md) e muda
por pull request, junto com o trabalho que ele descreve.

## Decisões de arquitetura

Decisões de arquitetura são registradas como ADRs em [`docs/adr/`](docs/adr/).
Cada ADR é proposta e discutida numa issue antes de ser aceita. O processo
está em [`docs/adr/README.md`](docs/adr/README.md).

## Regras de código

- **Português no domínio:** nomes iguais aos da arquitetura da CPU-8E (`acc`,
  `mar`, `ula`, `buscarInstrucao`). Termos técnicos consagrados ficam como
  são (`opcode`, `flag`, `clock`).
- **Comentários explicam o porquê**, não o óbvio.
- **Núcleo sem interface:** nada em `src/core/` pode importar Vue, o DOM ou
  o navegador.
- **Uma fonte da verdade para as instruções:** `src/core/opcodes.ts`.
- **Textos da interface** sempre em `src/locales/` (português e inglês),
  nunca fixos nos componentes.
- TypeScript estrito, sem `any`.

## Documentação

A documentação do site fica em `src/docs/pt/` e `src/docs/en/`, uma página
Markdown por arquivo, com os mesmos nomes nos dois idiomas.

- Títulos que recebem links levam uma âncora fixa, igual nos dois idiomas:
  `## Modos {#modos}`.
- Programas de exemplo vão em blocos ` ```cpu8e `, uma linha por instrução
  (`00: D1 20   LOD [20]`), terminando com `; espera: ACC=0C M[22]=0C`
  (`; expect:` em inglês). Os testes executam cada exemplo e conferem o
  resultado.
- `{{tabela-instrucoes}}` e `{{diagrama}}`, sozinhos numa linha, inserem a
  tabela de instruções e o diagrama da CPU.

## Validação

A partir da série 2.x, o núcleo é validado por **instrução** e **estado**:
cada instrução é executada a partir de um estado conhecido, e a memória, os
registradores, as flags, o PC e o SP são comparados com o esperado. A tabela
completa da ULA, gravada em `tests/fixtures/`, é um teste de regressão
([ADR 0003](docs/adr/0003-validacao-por-instrucao.md)).

A comparação pulso a pulso com o código Pascal original, usada na série 1.x,
ainda está em `tools/referencia/` e sai na versão 2.1.0. Até lá, `npm test`
também roda essa comparação quando o Free Pascal está instalado.

Antes de abrir um pull request:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:cobertura   # os testes, com a meta de cobertura
npm run build
npm run test:e2e   # abre o site num navegador de verdade
```

Metas de cobertura (o CI falha abaixo delas): o núcleo (`src/core/`), com 95%
das linhas e 90% dos desvios; o controlador (`src/simulador/`), com 90% e 85%.
Os componentes são cobertos pelos testes de ponta a ponta, que também
conferem a acessibilidade (axe), o teclado e o refluxo em telas estreitas.

## Licença e autoria

O projeto é GPL-3.0-or-later. Ao contribuir, você concorda em licenciar sua
contribuição nos mesmos termos.

- Todo arquivo novo leva `SPDX-License-Identifier: GPL-3.0-or-later`.
- Um arquivo derivado de um arquivo do CPU-8E original leva no cabeçalho a
  origem, o aviso de copyright original e a data da modificação (veja
  `src/core/controle.ts`), e entra na lista `DERIVADOS` de
  `tests/licenca.test.ts`.
- Um arquivo copiado de um projeto irmão registra a origem no cabeçalho
  ([ADR 0004](docs/adr/0004-codigo-e-estilo-comuns.md)).
- Toda menção ao [Prof. Joel Guilherme da Silva Filho](http://lattes.cnpq.br/7746085908957322)
  leva ao currículo Lattes dele.
- Mudanças entram no `CHANGELOG.md`, com data.
- Novas dependências precisam ter licença compatível com a GPL-3.0
  (`npm run licencas` verifica isso no CI). MPL-2.0 e PSF-2.0 também são
  aceitas: as duas são compatíveis com a GPL.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`. Quando houver uma issue,
cite-a no fim da mensagem: `feat: memória por dentro (#12)`.

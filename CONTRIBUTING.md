# Como contribuir

Obrigado pelo interesse! Este projeto também é material de estudo, então o
código precisa ser fácil de ler.

## Regras de código

- **Português no domínio:** nomes iguais aos da arquitetura da CPU-8E (`acc`,
  `mar`, `ula`, `buscarInstrucao`). Termos técnicos consagrados ficam como
  são (`opcode`, `flag`).
- **Comentários explicam o porquê**, não o óbvio.
- **Núcleo sem interface:** nada em `src/core/` pode importar Vue, o DOM ou
  o navegador.
- **Uma fonte da verdade para as instruções:** `src/core/opcodes.ts`.
- **Textos da interface** sempre em `src/locales/` (português e inglês),
  nunca fixos nos componentes.
- TypeScript estrito, sem `any`.

## Fidelidade ao original

Até a v1.0, o comportamento da CPU deve ser idêntico ao do simulador
original. Qualquer mudança em `src/core/` precisa manter `npm test`
passando. Se um teste de fidelidade falhar, o núcleo TypeScript está
errado, não o gabarito.

Para acrescentar um programa de teste: inclua-o em
`tests/fixtures/programas.ts` e rode `npm run gabaritos` (requer o Free
Pascal: `sudo apt install fp-compiler`).

## Licença e autoria

O projeto é GPL-3.0-or-later. Ao contribuir, você concorda em licenciar sua
contribuição nos mesmos termos.

- Arquivos derivados de um arquivo do simulador original levam no
  cabeçalho o nome do arquivo de origem, o aviso de copyright original e a
  data da modificação (veja `src/core/controle.ts` como exemplo).
- Todo arquivo novo leva `SPDX-License-Identifier: GPL-3.0-or-later`.
- Mudanças de comportamento em relação ao original entram no
  `CHANGELOG.md`, com data.
- Novas dependências precisam ter licença compatível com a GPL-3.0
  (`npm run licencas` verifica isso no CI). MPL-2.0 é aceita: ela é
  compatível com a GPL e, aqui, só aparece em ferramentas de build.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
`feat:`, `fix:`, `docs:`, `test:`, `chore:`.

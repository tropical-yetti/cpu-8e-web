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

## Fidelidade ao original

O comportamento da CPU deve ser idêntico ao do simulador de referência,
`tools/referencia/cpu8e_ref.pas`: o código Pascal original com as correções
do CPU-8E Web, cada uma num bloco `{$IFDEF CORRIGIDO}` (veja o README dessa
pasta). Qualquer mudança em `src/core/` precisa manter `npm test` passando.
Se um teste de fidelidade falhar, o núcleo TypeScript está errado, não o
gabarito.

Para corrigir um defeito do original no núcleo: faça a mesma correção no
`cpu8e_ref.pas`, dentro de `{$IFDEF CORRIGIDO}`, rode `npm run gabaritos` e
marque o trecho em TypeScript com `CORRIGIDO NA vX.Y`, explicando o
comportamento antigo. A correção também entra no `CHANGELOG.md` e na página
"Diferenças do original".

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
  (`npm run licencas` verifica isso no CI). MPL-2.0 e PSF-2.0 também são
  aceitas: as duas são compatíveis com a GPL. Aqui, a MPL-2.0 só aparece em
  ferramentas de build, e a PSF-2.0 no `argparse`, usado apenas pela linha de
  comando do markdown-it (não entra no site).

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
`feat:`, `fix:`, `docs:`, `test:`, `chore:`.

# Simulador de referência

Esta pasta guarda uma cópia do núcleo do simulador CPU-8E original, em Free
Pascal, **sem a interface gráfica**. Ela serve só para gerar os gabaritos
dos testes de fidelidade; não faz parte do site.

| Arquivo              | Para que serve                                                                     |
| -------------------- | ---------------------------------------------------------------------------------- |
| `cpu8e_ref.pas`      | Executa um programa `.bin` e grava cada evento (pulso de clock, fase etc.) em JSON |
| `ula_tabela.pas`     | Grava o resultado da ULA para todas as operações e entradas                        |
| `gerar-gabaritos.ts` | Compila os dois e atualiza `tests/fixtures/` (`npm run gabaritos`)                 |

O código em `cpu8e_ref.pas` segue `CPU8E_Control.pas` linha a linha. As
únicas mudanças foram trocar os componentes visuais por nomes em texto e
as rotinas de desenho por gravação de eventos. A aritmética, os tipos e o
modo do compilador (`{$mode delphi}`, como no projeto Lazarus original)
foram mantidos.

### Variante corrigida (v1.1)

A partir da v1.1, o CPU-8E Web corrige defeitos do original. Para que os
testes continuem comparando pulso a pulso, cada correção também entra em
`cpu8e_ref.pas`, dentro de um bloco `{$IFDEF CORRIGIDO}`:

- `fpc -dCORRIGIDO cpu8e_ref.pas` gera a referência corrigida, usada pelos
  gabaritos e pelo teste com programas aleatórios;
- `fpc cpu8e_ref.pas` gera o simulador original, sem nenhuma correção (o
  comportamento da v1.0, guardado na tag `v1.0.0`).

Assim, cada correção fica visível como um trecho pequeno ao lado do código
original que ela substitui.

Copyright 2009/10 [Joel Guilherme da Silva Filho](http://lattes.cnpq.br/7746085908957322) e colaboradores (veja
`NOTICE.md`). Modificado em 2026-10-13 e 2026-10-17. GPL-3.0-or-later.

<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

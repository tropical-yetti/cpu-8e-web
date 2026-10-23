# Avisos de autoria e licença

**CPU-8E Web** é uma obra derivada do simulador **CPU-8E** (versão 2.2.3),
um simulador educacional de uma CPU de 8 bits criado no IESB – Instituto de
Educação Superior de Brasília.

## Obra original

```
CPU-8E Simulator
Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322)

Simulador para uma CPU Educacional de 8-bits.
Organização: IESB - Instituto de Educação Superior de Brasília
Local: Brasília/DF, Brasil
```

Colaboradores da obra original:

| Versão            | Contribuição                                               | Autores                                                                       |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 0.9 – 1.0b (2009) | Simulador original em Free Pascal, interface em modo texto | [Prof. Joel Guilherme da Silva Filho](http://lattes.cnpq.br/7746085908957322) |
| 2.0 (2009)        | Interface gráfica multiplataforma em Lazarus               | Wanderlan Santos dos Anjos, Bárbara A. B. dos Anjos                           |
| 2.1 (2009)        | Disassembler, edição e gravação de programas               | Wanderlan Santos dos Anjos, Bárbara A. B. dos Anjos                           |
| 2.2 (2010)        | Shifts, rotates, chamada de sub-rotina, revisão geral      | Anderson de Souza Freitas, Daniel Machado Vasconcelos                         |

Código-fonte original: <https://github.com/wanderlan/cpu-8e>

A obra original é distribuída sob a GNU General Public License, sem indicação
de versão. Conforme a própria GPL permite nesse caso, esta obra derivada adota
a **GPL versão 3 ou posterior** (GPL-3.0-or-later). O componente ShapeEx do
projeto original declara GPL 3.

## Obra derivada

```
CPU-8E Web
Copyright (C) 2026 Ansone e colaboradores do CPU-8E Web

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option)
any later version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
more details.
```

O texto integral da licença está em [LICENSE](LICENSE).

## Modificações em relação à obra original

Todas as modificações, com data, estão registradas em [CHANGELOG.md](CHANGELOG.md).
Em resumo: o simulador foi reescrito em TypeScript e Vue 3 para rodar no
navegador. A lógica da CPU segue o código Pascal original passo a passo,
inclusive os seus defeitos conhecidos (fidelidade total na versão 1.0).

Cada arquivo derivado diretamente de um arquivo do original traz no
cabeçalho o nome do arquivo de origem e o aviso de copyright correspondente.

Arquivos do original incluídos sem modificação:

- `src/assets/original/*.png` — ícones da barra de ferramentas e do semáforo
  (o `Halt.png`, do botão Parar removido na 1.1, saiu na série 2.x);
- `src/assets/programas/teste.bin` e `allopcodes.bin` — programas de exemplo;
- `tools/layout/CPU8E_Panel.lfm` — formulário do painel, fonte do desenho.

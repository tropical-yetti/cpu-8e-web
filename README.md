# CPU-8E Web

Simulador educacional de uma CPU de 8 bits, no navegador.

O **CPU-8E Web** é uma versão para a web do simulador
[CPU-8E](https://github.com/wanderlan/cpu-8e), criado no IESB – Instituto de
Educação Superior de Brasília pelo Prof. Joel Guilherme da Silva Filho e
colaboradores para o ensino de arquitetura de computadores. O painel mostra
os registradores, a ULA, os barramentos e a memória de 256 bytes enquanto um
programa é executado passo a passo.

> **Estado atual:** o núcleo da CPU, o painel do simulador e a documentação
> de uso (em português e inglês) estão prontos e testados. Falta o polimento
> final antes da versão 1.0.

## Como rodar

Requisitos: [Node.js](https://nodejs.org/) 22 ou mais recente.

```bash
npm install
npm run dev        # site em modo de desenvolvimento
npm test           # testes
npm run build      # versão de produção em dist/
```

Outros comandos úteis:

| Comando                | O que faz                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run lint`         | Verifica o estilo do código (ESLint)                               |
| `npm run format`       | Formata o código (Prettier)                                        |
| `npm run typecheck`    | Verifica os tipos (TypeScript)                                     |
| `npm run licencas`     | Confere se todas as dependências têm licença compatível com a GPL  |
| `npm run gabaritos`    | Regenera os gabaritos dos testes a partir do original (requer fpc) |
| `npm run test:e2e`     | Testes de ponta a ponta num navegador (Playwright)                 |
| `npm run layout`       | Regenera o desenho do painel a partir do formulário original       |
| `npm run build:previa` | Gera o site inteiro em um único arquivo HTML, para prévias         |

## Como o projeto está organizado

```text
src/core/          núcleo da CPU, em TypeScript puro (sem Vue)
src/simulador/     controlador: botões, modos de execução, pausa e clock
src/stores/        store Pinia que liga o controlador aos componentes
src/components/    diagrama da CPU, tabela de memória, barra de ferramentas
src/painel/        layout do painel extraído do formulário original
src/views/         páginas do site
src/locales/       textos da interface em português e inglês
src/docs/          documentação de uso em Markdown (pt/ e en/)
tests/core/        testes do núcleo
tests/simulador/   testes do controlador
tests/docs/        testes dos exemplos e links da documentação
tests/e2e/         testes de ponta a ponta (Playwright)
tests/fixtures/    programas de teste e gabaritos gerados pelo original
tools/referencia/  núcleo original em Pascal, sem interface, para gerar gabaritos
tools/layout/      formulário original e o extrator do layout do painel
src/assets/programas/  programas que acompanham o simulador original
```

O ponto central da arquitetura: a CPU **emite eventos** (um por pulso de
clock) e a interface decide quando mostrá-los. Assim o mesmo núcleo serve
para o modo passo a passo, ciclo a ciclo e execução contínua, e pode ser
testado sem interface. Detalhes em [`src/core/controle.ts`](src/core/controle.ts).

## Fidelidade ao original

A versão 1.0 reproduz o simulador original **exatamente**, inclusive seus
defeitos conhecidos (eles serão corrigidos na versão 1.1). Para garantir
isso, o núcleo Pascal original foi separado da interface gráfica
([`tools/referencia/cpu8e_ref.pas`](tools/referencia/cpu8e_ref.pas)) e
grava cada passo da execução. Os testes comparam esses registros com o
núcleo TypeScript:

- 9 programas de teste, evento por evento (registradores, flags, memória,
  barramentos acesos e textos do painel);
- 60 programas aleatórios, quando o Free Pascal está instalado (sempre no CI);
- a ULA em todas as 851.968 combinações de operação e entradas.

## Licença

Copyright 2009/10 Joel Guilherme da Silva Filho e colaboradores (CPU-8E).
Copyright 2026 colaboradores do CPU-8E Web.

Este programa é software livre, distribuído sob a
[GNU General Public License versão 3 ou posterior](LICENSE), **sem nenhuma
garantia**. A autoria original e as modificações estão descritas em
[NOTICE.md](NOTICE.md) e [CHANGELOG.md](CHANGELOG.md).

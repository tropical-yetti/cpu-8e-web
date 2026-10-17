/**
 * Controlador do simulador: liga os botões (Executar, Pausar, Reset,
 * Carregar...) à CPU e mantém o estado do painel que a interface desenha.
 *
 * Este arquivo reproduz a lógica de comando do original — a variável `Cmd`,
 * o laço RunProgram, PulseClock e Pause — com as mesmas regras, inclusive as
 * suas particularidades (fidelidade total na v1.0). A diferença é técnica:
 * onde o original parava num laço com Sleep, aqui o código espera com
 * `await`, sem travar a página.
 *
 * Não depende de Vue: a store (src/stores/simulador.ts) entrega um objeto
 * reativo como `painel`, e o controlador só escreve nele.
 *
 * Derivado de CPU8E_Control.pas (PulseClock, Pause, RunProgram),
 * CPU8E_Oper.pas (Run, ResetCPU, SetClock) e CPU8E_Panel.pas (tratadores dos
 * botões), CPU-8E v2.2.3
 * Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
 * Modificado em 2026-10-13: reescrito em TypeScript com async/await.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  bytesParaGravar,
  carregarPrograma,
  criarCpu,
  desmontar,
  editarMemoria,
  passo,
  resetarCpu,
  textoDoItem,
  type Byte,
  type Cpu,
  type Evento,
  type Fase,
  type ItemPainel,
  type SegmentoBarramento,
} from '@/core'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Modos de execução (combo "Mode" do original). */
export type Modo = 'passo' | 'ciclo' | 'continuo'

/** Semáforo de status: vermelho = parada, amarelo = pausa, verde = executando. */
export type Status = 'parada' | 'pausa' | 'execucao'

/** Último comando do usuário (variável `Cmd` do original). */
type Comando = 'go' | 'pause' | 'halt' | 'rst' | 'load'

/** Mensagens que o original mostrava em caixas de diálogo. */
export type Mensagem =
  | { chave: 'lidos'; bytes: number }
  | { chave: 'gravados'; bytes: number }
  | { chave: 'semPrograma' }
  | { chave: 'invalido' }

/** Tudo o que o painel mostra. A interface só lê; o controlador só escreve. */
export interface Painel {
  /** Texto de cada item, como "ACC:05" ou "DI:LOD 05". */
  textos: Record<ItemPainel, string>
  /** Itens com texto em vermelho (realçados pelo último pulso). */
  realcados: ItemPainel[]
  /** Segmentos de barramento acesos (vermelhos). */
  barramentos: SegmentoBarramento[]
  /** Lâmpada de fase acesa (nenhuma após reset ou parada). */
  fase: Fase | null
  status: Status
  modo: Modo
  /** Velocidade de 10 a 100 (combo "Clock"). */
  clock: number
  /** Piscada do clock ao mudar a velocidade. */
  clockPiscando: boolean
  /** Endereço selecionado na tabela de memória. */
  foco: Byte
  /** Coluna "Symbol" da tabela de memória (disassembly). */
  simbolos: string[]
  /** Muda a cada escrita na memória, para a interface redesenhar a tabela. */
  versaoMemoria: number
  habilitados: { executar: boolean; pausar: boolean; resetar: boolean }
  nomePrograma: string | null
  mensagem: Mensagem | null
}

/** Itens do painel e o prefixo que o original põe antes do valor. */
const PREFIXOS: Record<ItemPainel, string> = {
  ACC: 'ACC',
  PC: 'PC',
  MAR: 'MAR',
  MDR: 'MDR',
  IR: 'IR',
  SP: 'SP',
  A: 'A',
  B: 'B',
  ULA: 'ULA',
  DI: 'DI',
  Z: 'Z',
  N: 'N',
  C: 'C',
}

/**
 * Textos iniciais, como estão no formulário original.
 * CORRIGIDO NA v1.1 (item 10): o formulário original trazia "ID:NOP", com a
 * sigla em inglês, e o decodificador passava a "DI:…" no primeiro Reset.
 */
function textosIniciais(): Record<ItemPainel, string> {
  return {
    ACC: 'ACC:00',
    PC: 'PC:00',
    MAR: 'MAR:00',
    MDR: 'MDR:00',
    IR: 'IR:00',
    SP: 'SP:FF',
    A: 'A:00',
    B: 'B:00',
    ULA: 'ULA:00',
    DI: 'DI:NOP',
    Z: 'Z:0',
    N: 'N:0',
    C: 'C:0',
  }
}

export function criarPainel(): Painel {
  return {
    textos: textosIniciais(),
    realcados: [],
    barramentos: [],
    fase: null,
    status: 'parada',
    modo: 'passo',
    clock: 50,
    clockPiscando: false,
    foco: 0,
    simbolos: new Array<string>(256).fill(''),
    versaoMemoria: 0,
    habilitados: { executar: false, pausar: false, resetar: false },
    nomePrograma: null,
    mensagem: null,
  }
}

/** Interrompe a execução em andamento (o `Abort` do original). */
class Interrupcao extends Error {}

/** Funções de tempo, substituíveis nos testes. */
export interface Relogio {
  dormir(ms: number): Promise<void>
}

const relogioReal: Relogio = {
  dormir: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
}

// ---------------------------------------------------------------------------
// Controlador
// ---------------------------------------------------------------------------

export class Controlador {
  readonly cpu: Cpu = criarCpu()
  private cmd: Comando = 'rst' // CPU_Reset, chamado ao iniciar o original, deixa Cmd = _Rst
  private emExecucao = false
  /** Quem está esperando o comando mudar (laço de pausa). */
  private aoMudarComando: (() => void) | null = null
  /** Quem está esperando o usuário fechar uma mensagem. */
  private aoFecharMensagem: (() => void) | null = null
  private mensagemFechada: Promise<void> = Promise.resolve()

  readonly painel: Painel
  private readonly relogio: Relogio

  constructor(painel: Painel = criarPainel(), relogio: Relogio = relogioReal) {
    this.painel = painel
    this.relogio = relogio
  }

  /** Indica se há uma execução em andamento (útil para a interface e os testes). */
  get executando(): boolean {
    return this.emExecucao
  }

  // -------------------------------------------------------------------------
  // Botões
  // -------------------------------------------------------------------------

  /** Botão Executar / Go (sbGoClick). */
  async executar(): Promise<void> {
    this.painel.status = 'execucao'
    if (this.cmd === 'pause' && this.emExecucao) {
      // Retoma a execução pausada.
      this.definirComando('go')
      return
    }
    // DIFERENÇA DE PLATAFORMA: no original, apertar Go durante uma execução
    // contínua iniciava uma segunda execução dentro da primeira. Aqui o
    // pedido é ignorado, porque o navegador não permite esse aninhamento.
    if (this.emExecucao) return
    this.definirComando('go')
    await this.rodar()
  }

  /**
   * Botão Pausar (sbPauseClick).
   * CORRIGIDO NA v1.1 (item 11): sem nada em execução, Pausar não faz nada.
   * No original, ele deixava o comando em "pausa", e o Executar seguinte só
   * desfazia isso, sem iniciar a execução.
   */
  pausar(): void {
    if (!this.emExecucao) return
    this.definirComando('pause')
    this.painel.status = 'pausa'
  }

  // CORRIGIDO NA v1.1 (item 15): o botão Parar (Halt) foi removido. Ele
  // encerrava a execução sem deixar continuar, e só servia para interromper
  // antes do Reset, que agora interrompe sozinho (item 13).

  /** Botão Reset (sbResetClick + ResetCPU). A memória é preservada. */
  resetar(): void {
    this.painel.status = 'parada'
    this.painel.fase = null
    resetarCpu(this.cpu)
    this.definirComando('rst')
    this.painel.foco = this.cpu.pc
    this.mostrarCpu()
    this.painel.habilitados.executar = true
    this.painel.habilitados.pausar = true
  }

  /** Carregar um programa (acLoadExecute + LoadFile). */
  carregar(bytes: Uint8Array, nome: string): void {
    this.definirComando('halt')
    const lidos = carregarPrograma(this.cpu, bytes)
    this.resetar()
    this.painel.simbolos = desmontar(this.cpu.memoria, this.cpu.tamanhoPrograma)
    this.painel.versaoMemoria++
    this.painel.foco = this.cpu.pc
    this.painel.status = 'parada'
    this.painel.nomePrograma = nome
    Object.assign(this.painel.habilitados, {
      executar: true,
      pausar: true,
      resetar: true,
    })
    this.mostrarMensagem({ chave: 'lidos', bytes: lidos })
  }

  /** Bytes a gravar no arquivo (SaveFile); mostra a confirmação. */
  gravar(): Uint8Array {
    const bytes = bytesParaGravar(this.cpu)
    this.mostrarMensagem({ chave: 'gravados', bytes: bytes.length })
    return bytes
  }

  /**
   * Edição de uma célula da memória (sgMemoriaSetEditText).
   * Devolve false, sem mudar nada, se o texto não for um valor de 00 a FF.
   */
  editarMemoria(endereco: Byte, texto: string): boolean {
    if (editarMemoria(this.cpu, endereco, texto) === null) return false
    this.painel.versaoMemoria++
    // Como no original, o disassembly reescreve só as posições do programa
    // e deixa o resto da coluna como estava.
    const novos = desmontar(this.cpu.memoria, this.cpu.tamanhoPrograma)
    this.painel.simbolos = novos.map((novo, i) => novo || this.painel.simbolos[i]!)
    const temPrograma = this.cpu.tamanhoPrograma !== 0
    Object.assign(this.painel.habilitados, {
      executar: temPrograma,
      pausar: temPrograma,
      resetar: temPrograma,
    })
    return true
  }

  /** Mudança da velocidade do clock (ClockSelectChange). */
  async mudarClock(valor: number): Promise<void> {
    this.painel.clock = valor
    this.painel.clockPiscando = true
    await this.relogio.dormir(100)
    this.painel.clockPiscando = false
  }

  mudarModo(modo: Modo): void {
    this.painel.modo = modo
  }

  /** O usuário fechou a caixa de mensagem. */
  fecharMensagem(): void {
    this.painel.mensagem = null
    this.aoFecharMensagem?.()
    this.aoFecharMensagem = null
  }

  // -------------------------------------------------------------------------
  // Execução (Run e RunProgram)
  // -------------------------------------------------------------------------

  private async rodar(): Promise<void> {
    if (this.cpu.tamanhoPrograma === 0) {
      this.mostrarMensagem({ chave: 'semPrograma' })
      this.definirComando('halt')
      // CORRIGIDO NA v1.1 (item 12): no original, o semáforo ficava verde.
      this.painel.status = 'parada'
    } else {
      await this.rodarPrograma()
    }
    if (this.cpu.controle.s === 3) this.definirComando('halt')
  }

  private async rodarPrograma(): Promise<void> {
    this.emExecucao = true
    try {
      // repeat RunStep until Cmd = _Halt
      do {
        for (const evento of passo(this.cpu)) {
          // Só espera quando há motivo (pausa, clock, mensagem). Na velocidade
          // máxima, muitos eventos são tratados de uma vez e a tela é
          // redesenhada uma vez por quadro, não a cada evento.
          const espera = this.tratarEvento(evento)
          if (espera) await espera
          // CORRIGIDO NA v1.1 (item 13): Reset e Carregar interrompem também a
          // execução contínua. No original, ela seguia a partir do estado
          // zerado, recomeçando o programa. A verificação vem logo depois de
          // cada espera, que é quando um clique pode ter chegado, e antes de a
          // CPU dar o próximo passo.
          if (this.cmd === 'rst' || this.cmd === 'load') throw new Interrupcao()
        }
      } while (this.cmd !== 'halt')
      this.painel.status = 'parada'
    } catch (erro) {
      // Interrupção por Reset ou Carregar: a execução simplesmente
      // termina; a próxima recomeça a fase em que a CPU estava.
      if (!(erro instanceof Interrupcao)) throw erro
    } finally {
      this.emExecucao = false
    }
  }

  /** Trata um evento; devolve uma promessa só quando é preciso esperar. */
  private tratarEvento(evento: Evento): Promise<void> | void {
    if (this.painel.mensagem) {
      // Uma mensagem aberta congela a CPU, como as caixas de diálogo do original.
      return this.mensagemFechada.then(() => this.tratarEvento(evento))
    }
    switch (evento.tipo) {
      case 'fase':
        this.painel.fase = evento.fase
        return
      case 'valor':
        this.painel.textos[evento.item] = `${PREFIXOS[evento.item]}:${evento.valor}`
        return
      case 'foco':
        this.painel.foco = evento.endereco
        // A tabela de memória do original é redesenhada junto com a seleção.
        this.painel.versaoMemoria++
        return
      case 'pulso':
        return this.pulsarClock(evento)
      case 'fimInstrucao':
        return this.pausa('ciclo')
      case 'invalido':
        // O original mostrava "INVALID OpCode!" e esperava o OK.
        this.mostrarMensagem({ chave: 'invalido' })
        return this.mensagemFechada
      case 'halt':
        this.definirComando('halt')
        return
    }
  }

  /** PulseClock: realça, espera (modo passo), dorme o tempo do clock e apaga o realce. */
  private pulsarClock(evento: Extract<Evento, { tipo: 'pulso' }>): Promise<void> | void {
    for (const { item, valor } of evento.destaques) {
      this.painel.textos[item] = `${PREFIXOS[item]}:${valor}`
    }
    this.painel.realcados = evento.destaques.map((d) => d.item)
    this.painel.barramentos = [...evento.barramentos]

    const pausa = this.pausa('passo')
    const sono = pausa ? undefined : this.dormirClock()
    if (!pausa && !sono) {
      this.apagarRealces()
      return
    }
    return (async () => {
      await pausa
      await (sono ?? this.dormirClock())
      if (this.painel.mensagem) await this.mensagemFechada
      this.apagarRealces()
    })()
  }

  /**
   * Pause(Mode): espera se o modo atual pede uma parada aqui ou se o usuário
   * apertou Pausar. Reset e Carregar interrompem a execução.
   */
  private pausa(modo: Modo): Promise<void> | void {
    if (this.painel.modo !== modo && this.cmd !== 'pause' && this.cmd !== 'halt') return
    if (this.cmd !== 'halt') {
      this.cmd = 'pause'
      this.painel.status = 'pausa'
    }
    return this.esperarComando()
  }

  /** O laço de espera do Pause original: sai quando o comando deixa de ser "pause". */
  private async esperarComando(): Promise<void> {
    for (;;) {
      // O comando pode mudar enquanto esperamos, por isso é lido de novo a cada volta.
      const cmd = this.comandoAtual()
      if (cmd === 'rst' || cmd === 'halt' || cmd === 'load') {
        this.apagarRealces()
        throw new Interrupcao()
      }
      if (cmd !== 'pause') return
      await new Promise<void>((resolver) => (this.aoMudarComando = resolver))
    }
  }

  private comandoAtual(): Comando {
    return this.cmd
  }

  /**
   * Tempo de cada pulso: a "fórmula mágica" do original (SetClock).
   * Clock 100 = sem espera; clock 50 = 253 ms.
   */
  static milissegundosPorPulso(clock: number): number {
    return clock === 100 ? 0 : 510 - Math.trunc(5.144 * clock)
  }

  private ultimoRespiro = 0

  /** Espera o tempo do clock; devolve nada quando não há o que esperar. */
  private dormirClock(): Promise<void> | void {
    const ms = Controlador.milissegundosPorPulso(this.painel.clock)
    if (ms > 0) return this.relogio.dormir(ms)
    // Velocidade máxima: devolve o controle ao navegador uma vez por quadro
    // (cerca de 16 ms) para a página continuar respondendo e ser redesenhada.
    const agora = Date.now()
    if (agora - this.ultimoRespiro > 16) {
      this.ultimoRespiro = agora
      return this.relogio.dormir(0)
    }
  }

  // -------------------------------------------------------------------------
  // Auxiliares
  // -------------------------------------------------------------------------

  private definirComando(cmd: Comando): void {
    this.cmd = cmd
    this.aoMudarComando?.()
    this.aoMudarComando = null
  }

  private apagarRealces(): void {
    this.painel.realcados = []
    this.painel.barramentos = []
  }

  private mostrarMensagem(mensagem: Mensagem): void {
    this.painel.mensagem = mensagem
    this.mensagemFechada = new Promise((resolver) => (this.aoFecharMensagem = resolver))
  }

  /** ShowCPU: atualiza o texto de todos os itens com os valores atuais. */
  private mostrarCpu(): void {
    const { cpu, painel } = this
    const valores: Record<Exclude<ItemPainel, 'DI'>, Byte> = {
      ACC: cpu.acc,
      PC: cpu.pc,
      MAR: cpu.mar,
      MDR: cpu.mdr,
      IR: cpu.ir,
      SP: cpu.sp,
      A: cpu.a,
      B: cpu.b,
      ULA: cpu.ula.valor,
      Z: Number(cpu.ula.z),
      N: Number(cpu.ula.n),
      C: Number(cpu.ula.c),
    }
    for (const [item, valor] of Object.entries(valores) as [Exclude<ItemPainel, 'DI'>, Byte][]) {
      painel.textos[item] = `${PREFIXOS[item]}:${textoDoItem(item, valor)}`
    }
    painel.textos.DI = `DI:${cpu.opcode}`
  }
}

/** Valor de um registrador em binário, como mostra o original ao clicar nele. */
export function emBinario(valor: Byte): string {
  return valor.toString(2).padStart(8, '0')
}

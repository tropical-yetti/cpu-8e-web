program cpu8e_ref;
{
  Gerador de traços de referência para o CPU-8E Web.

  Este programa é DERIVADO do simulador original CPU-8E v2.2.3
  (arquivos CPU8E.pas e CPU8E_Control.pas):

    Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322)
    Contribuições: Wanderlan Santos dos Anjos, Barbara A.B. dos Anjos,
                   Anderson de Souza Freitas, Daniel Machado Vasconcelos
    Licença: GNU General Public License

  Modificações (2026-10-13, projeto CPU-8E Web):
    - Removida toda a interface gráfica (LCL). Componentes visuais viraram
      nomes em texto; PulseClock, SetValue, SetPhase e ShowMem passaram a
      registrar eventos em JSON (uma linha por evento) na saída padrão.
    - Removidas pausas (Sleep/Pause), sons e caixas de mensagem.
    - A ARITMÉTICA FOI MANTIDA IDÊNTICA: mesmos tipos (ACC shortint,
      A/B byte, R word), mesmas expressões, mesmo modo do compilador
      (Delphi), para que os traços reproduzam o comportamento original,
      inclusive os bugs.

  Uso:  cpu8e_ref <programa.bin> [maxEventos]  > traco.jsonl

  Este arquivo é distribuído sob a GPL-3.0-or-later, como o restante
  do projeto. Veja LICENSE e NOTICE.md na raiz do repositório.
  SPDX-License-Identifier: GPL-3.0-or-later
}

{$mode delphi}

uses SysUtils;

type
  OpCodeType = (_HLT,_NOP,_NOT,_JMP,_JEQ,_JGT,_JGE,_STO,_LOD,_CMP,_ADD,_SUB,
                _AND,_XOR,_ORL,_JCY,_SHL,_SHR,_SRA,_ROL,_ROR,_CAL,_RET,_Invalid);
  PhaseType = (_Fetch, _Operand, _Execute, _Reset);

const
  OpCodeStr: array[OpCodeType] of string[3]
             = ('HLT','NOP','NOT','JMP','JEQ','JGT','JGE','STO','LOD',
                'CMP','ADD','SUB','AND','XOR','ORL','JCY','SHL','SHR',
                'SRA','ROL','ROR','CAL','RET','XXX');
  DoubleMask = $80;
  DirectMask = $40;

var
  CPU: record
    ACC: shortint;
    PC:  byte;
    MAR: byte;
    MDR: byte;
    A:   byte;
    B:   byte;
    SP:  byte;
    ULA: record
      Value: Byte;
      Z, N, C: boolean;
    end;
    IR: byte;
    OpCode: OpCodeType;
    DW: boolean;
    ED: boolean;
    Mem: packed array[0..255] of byte;
    LenProg: integer;
  end;

  UControl: record
    S: byte;
    T: byte;
  end;

  Halted: boolean = false;
  DIDestaque: string = '';   // texto do DI realçado no próximo pulso
  Eventos: integer = 0;
  MaxEventos: integer = 5000;

{ ---------------------------------------------------------------------------
  Saída JSON
  --------------------------------------------------------------------------- }

function EstadoJSON(Completo: boolean): string; forward;

procedure Emit(const S: string);
begin
  WriteLn(S);
  Inc(Eventos);
  if Eventos >= MaxEventos then begin
    WriteLn('{"t":"limite","est":' + EstadoJSON(true) + '}');
    Halt(0);
  end;
end;

function Q(const S: string): string;
begin
  Result := '"' + S + '"';
end;

{ Nome lógico de um componente visual: 'stACC' -> 'ACC', 'sxZ' -> 'Z' }
function NomeItem(const Item: string): string;
begin
  Result := Copy(Item, 3, Length(Item));
end;

{ Igual a LenReg do original: flags têm 1 dígito, o resto 2 }
function LenReg(const Item: string): integer;
var N: string;
begin
  N := NomeItem(Item);
  if (N = 'Z') or (N = 'N') or (N = 'C') then Result := 1 else Result := 2;
end;

{ Hash FNV-1a de 32 bits da memória, para comparar sem gravar os 256 bytes
  em cada evento. }
function HashMemoria: longword;
var I: integer; H: longword;
begin
  H := 2166136261;
  for I := 0 to 255 do begin
    H := H xor CPU.Mem[I];
    H := longword(qword(H) * 16777619);
  end;
  Result := H;
end;

{ Estado dos registradores; com Completo, inclui a memória inteira em hex. }
function EstadoJSON(Completo: boolean): string;
var I: integer; M: string;
begin
  M := '';
  if Completo then
    for I := 0 to 255 do M := M + IntToHex(CPU.Mem[I], 2);
  with CPU do
    Result := Format('{"acc":%d,"pc":%d,"mar":%d,"mdr":%d,"a":%d,"b":%d,' +
      '"sp":%d,"ula":%d,"z":%d,"n":%d,"c":%d,"ir":%d,"s":%d,"memHash":%u,"mem":"%s"}',
      [Byte(ACC), PC, MAR, MDR, A, B, SP, ULA.Value, Ord(ULA.Z), Ord(ULA.N),
       Ord(ULA.C), IR, UControl.S, HashMemoria, M]);
end;

{ ---------------------------------------------------------------------------
  Substitutos das rotinas de interface do original
  --------------------------------------------------------------------------- }

procedure ShowMem(Current: byte);
begin
  Emit('{"t":"mem","foco":' + IntToStr(Current) + '}');
end;

procedure SetValue(R: Byte; const Item: string);
begin
  Emit('{"t":"valor","item":' + Q(NomeItem(Item)) + ',"v":' +
       Q(IntToHex(R, LenReg(Item))) + '}');
end;

procedure ShowRegStr(const Item, Val: string);
begin
  Emit('{"t":"valor","item":' + Q(NomeItem(Item)) + ',"v":' + Q(Val) + '}');
end;

procedure SetPhase(Phase: PhaseType);
const Nomes: array[PhaseType] of string = ('busca', 'operando', 'execucao', 'reset');
begin
  Emit('{"t":"fase","fase":' + Q(Nomes[Phase]) + '}');
end;

{ Equivale a Flash + Pause(_Step) + Sleep + UnFlash do original.
  Itens duplicados no painel (stZ/sxZ etc.) aparecem uma única vez. }
procedure PulseClock(R: array of byte; Item: array of string; DataFlow: array of string);
var
  I: integer;
  Itens, Bus, Nome, Vistos: string;
begin
  Itens := '';
  Vistos := '|';
  if DIDestaque <> '' then begin
    Itens := '[' + Q('DI') + ',' + Q(DIDestaque) + ']';
    DIDestaque := '';
  end;
  for I := 0 to High(Item) do begin
    Nome := NomeItem(Item[I]);
    if Pos('|' + Nome + '|', Vistos) = 0 then begin
      Vistos := Vistos + Nome + '|';
      if Itens <> '' then Itens := Itens + ',';
      Itens := Itens + '[' + Q(Nome) + ',' + Q(IntToHex(R[I], LenReg(Item[I]))) + ']';
    end;
  end;
  Bus := '';
  for I := 0 to High(DataFlow) do begin
    if Bus <> '' then Bus := Bus + ',';
    Bus := Bus + Q(DataFlow[I]);
  end;
  { Flash do original: realçar o PC também move o foco da memória
    (acontece antes da pausa, por isso é emitido antes do pulso) }
  for I := 0 to High(Item) do
    if Item[I] = 'stPC' then ShowMem(CPU.PC);
  Emit('{"t":"pulso","itens":[' + Itens + '],"bus":[' + Bus + '],"est":' +
       EstadoJSON(false) + '}');
  Inc(UControl.T);
end;

{ ---------------------------------------------------------------------------
  A partir daqui o código segue CPU8E_Control.pas linha a linha.
  Componentes visuais (stX, shX) viraram strings; nada mais mudou.
  --------------------------------------------------------------------------- }

procedure ProcessULA;
var
  R         : word;
  Values    : array of byte;
  Items     : array of string;
  DataFlows : array of string;

  procedure InsertReg(Value : array of byte; Item : array of string; DataFlow : array of string);
  var
    I: integer;
  begin
    for I := 0 to high(Value) do begin
      SetLength(Values, Length(Values) + 1);
      Values[high(Values)] := Value[I];
    end;
    for I := 0 to high(Item) do begin
      SetLength(Items, Length(Items) + 1);
      Items[high(Items)] := Item[I];
    end;
    for I := 0 to high(DataFlow) do begin
      SetLength(DataFlows, Length(DataFlows) + 1);
      DataFlows[high(DataFlows)] := DataFlow[I];
    end;
  end;

  procedure SetFlags;
  begin
    with CPU do begin
      ULA.Z := (ULA.Value = 0);
      InsertReg([byte(ULA.Z), byte(ULA.Z)], ['stZ', 'sxZ'], ['shZOut1', 'shZOut2', 'shZOut3', 'shZOut4', 'shZOut5', 'shZOut6']);
      ULA.N := (R and $80) = $80;
      InsertReg([byte(ULA.N), byte(ULA.N)], ['stN', 'sxN'], ['shNOut1', 'shNOut2', 'shNOut3', 'shNOut4']);
      ULA.C := (R and $100) = $100;
      InsertReg([byte(ULA.C), byte(ULA.C)], ['stC', 'sxC'], ['shCOut1', 'shCOut2', 'shCOut3', 'shCOut4']);
      with ULA do begin
        SetValue(Byte(Z),'stZ');
        SetValue(Byte(N),'stN');
        SetValue(Byte(C),'stC');
      end;
    end;
  end;

begin
  with CPU do begin
    case OpCode of
      _NOT: R := not A;
      _LOD: R := A;
      _CMP: begin
        R := (not B) + 1;
        R := R + A;
      end;
      _ADD: begin
        R := A;
        R := R + B;
      end;
      _SUB: begin
        R := (not B) + 1;
        R := R + A;
      end;
      _AND: begin
        R := A and B;
      end;
      _XOR: begin
        R := A xor B;
      end;
      _ORL: begin
        R := A or B;
      end;
      _SHL: begin;
        R := A;
        R := R shl 1;
      end;
      _SHR: begin
        R := A shr 1;
        if odd(A) then R := R or $100;
      end;
      _SRA: begin
        if (A and $80) > 0 then
          R := (A shr 1) or $80
        else
          R := A shr 1;
        if odd(A) then R := R or $100;
      end;
      _ROL: begin
        R := A shl 1;
        if (A and $80) > 0 then
          R := R or $101;
      end;
      _ROR: begin
         R := A shr 1;
         if odd(A) then
           R := R or $180
      end;
    end;
    SetLength(Values, 0);
    SetLength(Items, 0);
    SetLength(DataFlows, 0);
    ULA.Value := R and $FF;
    SetFlags;
    InsertReg([ULA.Value], ['stULA'], []);
    PulseClock(Values, Items, DataFlows);
  end;
end;

procedure MARToPC; begin
  with CPU do begin
    PC := MAR;
    PulseClock(PC, ['stPC'], ['shMAROut1', 'shMAROut2', 'shBI1', 'shBI2', 'shBI3', 'shPCIn1', 'shPCIn2']);
  end;
end;

procedure PCToMAR;  begin
  with CPU do begin
    MAR := PC;
    PulseClock(MAR, ['stMAR'], ['shPCOut1', 'shPCOut2', 'shBI1', 'shBI2', 'shBI3', 'shMARIn1', 'shMARIn2', 'shMAROut3', 'shMAROut4', 'shBE1', 'shBE2']);
  end;
end;

procedure MemToMDR; begin
  with CPU do begin
    MDR := Mem[MAR];
    PulseClock([MDR], ['stMDR'], ['shRD1', 'shRD2', 'shMDRIn3', 'shMDRIn4', 'shBD1', 'shBD2']);
  end;
end;

procedure MDRToMem; begin
  with CPU do begin
    Mem[MAR] := MDR;
    PulseClock([], [], ['shMDROut3', 'shMDROut4', 'shBD1', 'shBD2', 'shWR1', 'shWR2']);
    ShowMem(MAR);
  end;
end;

procedure Execute;
begin
  with CPU, UControl do begin
    SetPhase(_Execute);
    case OpCode of
      _HLT: begin
        S := 3;
        PulseClock([], [], []);
      end;
      _NOP: PulseClock([], [], []);
      _NOT: begin
        A := ACC;
        ProcessULA;
        PulseClock([A], ['stA'], ['shACCOut1', 'shACCOut2', 'shBI1', 'shBI2', 'shBI3', 'shAIn1', 'shAIn2']);
        ACC := ULA.Value;
        PulseClock([ACC], ['stACC'], ['shULAOut1', 'shULAOut2', 'shBI1', 'shBI2', 'shBI3', 'shACCIn1', 'shACCIn2']);
      end;
      _JMP: MARToPC;
      _JEQ: if ULA.Z then MARToPC;
      _JGT: if not (ULA.Z or ULA.N) then MARToPC;
      _JGE: if not ULA.N then MARToPC;
      _JCY: if ULA.C then MARToPC;
      _STO: begin
        MDR := ACC;
        PulseClock([MDR], ['stMDR'], ['shACCOut1', 'shACCOut2', 'shBI1', 'shBI2', 'shBI3', 'shMDRIn1', 'shMDRIn2']);
        MDRToMem;
        ShowMem(MAR);
        PulseClock([], [], ['shMDROut3', 'shMDROut4', 'shBD1', 'shBD2', 'shWR1', 'shWR2']);
        ShowMem(PC);
      end;
      _LOD: begin
        MemToMDR;
        A := MDR;
        PulseClock([A], ['stA'], ['shMDROut1', 'shMDROut2', 'shBI1', 'shBI2', 'shBI3', 'shAIn1', 'shAIn2']);
        ProcessULA;
        ACC := A;
        PulseClock([ACC], ['stACC'], ['shULAOut1', 'shULAOut2', 'shBI1', 'shBI2', 'shBI3', 'shACCIn1', 'shACCIn2']);
      end;
      _CMP: begin
        MemToMDR;
        A := ACC;
        PulseClock([A], ['stA'], ['shACCOut1', 'shACCOut2', 'shBI1', 'shBI2', 'shBI3', 'shAIn1', 'shAIn2']);
        B := MDR;
        PulseClock([B], ['stB'], ['shMDROut1', 'shMDROut2', 'shBI1', 'shBI2', 'shBI3', 'shBIn1', 'shBIn2']);
        ProcessULA;
      end;
      _ADD,
      _SUB,
      _AND,
      _XOR,
      _ORL: begin
        MemToMDR;
        A := ACC;
        PulseClock([A], ['stA'], ['shACCOut1', 'shACCOut2', 'shBI1', 'shBI2', 'shBI3', 'shAIn1', 'shAIn2']);
        B := MDR;
        PulseClock([B], ['stB'], ['shMDROut1', 'shMDROut2', 'shBI1', 'shBI2', 'shBI3', 'shBIn1', 'shBIn2']);
        ProcessULA;
        ACC := ULA.Value;
        PulseClock([ACC], ['stACC'], ['shULAOut1', 'shULAOut2', 'shBI1', 'shBI2', 'shBI3', 'shACCIn1', 'shACCIn2']);
      end;
      _CAL: begin
        MDR := PC;
        PulseClock([MDR], ['stMDR'], ['shPCOut1','shPCOut2','shBI1','shBI2','shBI3','shMDRIn1','shMDRIn2']);
        PC := MAR;
        PulseClock([PC], ['stPC'], ['shMAROut1','shMAROut2','shBI1','shBI2','shBI3','shPCIn1','shPCIn2']);
        MAR := SP;
        PulseClock([MAR], ['stMAR'], ['shSPOut1','shSPOut2','shBI1','shBI2','shBI3','shMARIn1','shMARIn2']);
        MDRToMem;
        SP := SP -1;
        SetValue(SP,'stSP');
      end;
      _RET: begin
         SP := SP + 1;
         SetValue(SP,'stSP');
         MAR := SP;
         PulseClock([MAR], ['stMAR'], ['shSPOut1','shSPOut2','shBI1','shBI2','shBI3','shMARIn1','shMARIn2']);
         MemToMDR;
         PC := MDR;
         PulseClock([PC], ['stPC'], ['shMDROut1','shMDROut2','shBI1','shBI2','shBI3','shPCIn1','shPCIn2']);
      end;
      _SHL,
      _SHR,
      _SRA,
      _ROL,
      _ROR: begin
        MemToMDR;
        B := MDR;
        PulseClock([B], ['stB'], ['shMDROut1', 'shMDROut2', 'shBI1', 'shBI2', 'shBI3', 'shBIn1', 'shBIn2']);
        A := ACC;
        PulseClock([A], ['stA'], ['shACCOut1', 'shACCOut2', 'shBI1', 'shBI2', 'shBI3', 'shAIn1', 'shAIn2']);
        while B>0 do
        begin
          ProcessULA;
          A :=ULA.Value;
          B := B - 1;
          SetValue(B,'stB');
          PulseClock([A], ['stA'], ['shULAOut1', 'shULAOut2', 'shBI1', 'shBI2', 'shBI3', 'shAIn1', 'shAIn2']);
        end;
        ACC := ULA.Value;
        PulseClock([ACC], ['stACC'], ['shULAOut1', 'shULAOut2', 'shBI1', 'shBI2', 'shBI3', 'shACCIn1', 'shACCIn2']);
      end;
    end;
  end;
  with UControl do begin
    if S < 3 then S := 0;
    T := 0;
  end;
  ShowMem(CPU.PC);
  Emit('{"t":"fimInstrucao"}');   // ponto onde o original faz Pause(_Cycle)
end;

procedure FetchOperandAddr;
begin
  with CPU do begin
    SetPhase(_Operand);
    if DW then begin
      PCToMAR;
      Inc(PC);
      SetValue(PC,'stPC');
      if ED then begin
        MemToMDR;
        MAR := MDR;
        PulseClock([MAR], ['stMAR'], ['shMDROut1', 'shMDROut2', 'shBI1', 'shBI2', 'shBI3', 'shMARIn1', 'shMARIn2', 'shMAROut3', 'shMAROut4', 'shBE1', 'shBE2']);
      end;
    end;
  end;
  with UControl do begin
    S := 2;
    T := 0;
  end;
end;

procedure DecodeOpCode(IR : byte; out OpCode : OpCodeType; out DW, ED : boolean); begin
  case IR of
    $00: OpCode      := _HLT;
    $01: OpCode      := _NOP;
    $02: OpCode      := _NOT;
    $03: OpCode      := _RET;
    $C4: OpCode      := _JMP;
    $C5: OpCode      := _JEQ;
    $C6: OpCode      := _JGT;
    $C7: OpCode      := _JGE;
    $C8: OpCode      := _JCY;
    $C9: OpCode      := _CAL;
    $8A, $CA: OpCode := _SHL;
    $8B, $CB: OpCode := _SHR;
    $8C, $CC: OpCode := _SRA;
    $8D, $CD: OpCode := _ROL;
    $8E, $CE: OpCode := _ROR;
    $D0: OpCode      := _STO;
    $91, $D1: OpCode := _LOD;
    $94, $D4: OpCode := _CMP;
    $95, $D5: OpCode := _ADD;
    $96, $D6: OpCode := _SUB;
    $9A, $DA: OpCode := _AND;
    $9B, $DB: OpCode := _XOR;
    $9C, $DC: OpCode := _ORL;
  else
    OpCode := _Invalid;
    DW := false;
    ED := false;
    exit;
  end;
  DW := boolean((IR and DoubleMask) shr 7);
  ED := boolean((IR and DirectMask) shr 6);
end;

procedure FetchOpCode;
var
  Operando: string;
begin
  with CPU do begin
    SetPhase(_Fetch);
    PCToMAR;
    Inc(PC);
    SetValue(PC,'stPC');
    MemToMDR;
    IR := MDR;
    PulseClock([IR], ['stIR'], ['shMDROut1', 'shMDROut2', 'shBI1', 'shBI2', 'shBI3', 'shIRIn1', 'shIRIn2']);
    DecodeOpCode(IR, OpCode, DW, ED);
    if DW then begin
      Operando := IntToHex(Mem[PC], 2);
      if ED then
        Operando := '[' + Operando + ']'
      else
        Operando := ' ' + Operando;
    end
    else
      Operando := '';
    ShowRegStr('stDI', OpCodeStr[OpCode] + Operando);
    DIDestaque := OpCodeStr[OpCode] + Operando;   // stDI.Font.Color := clRed
    PulseClock([], [], ['shIROut1', 'shIROut2', 'shIROut3', 'shIROut4', 'shIROut5', 'shIROut6', 'shIROut7', 'shIROut8', 'shIROut9', 'shIROut10',
      'shIROut11', 'shIROut12', 'shIROut13', 'shIROut14', 'shIROut15', 'shIROut16', 'shUCIn1', 'shUCIn2', 'shUCIn3', 'shUCIn4', 'shUCIn5', 'shUCIn6']);
  end;
  with UControl do begin
    if CPU.DW then
      S := 1
    else
      S := 2;
      T := 0;
  end;
  with CPU do
    if OpCode = _Invalid then begin
      Emit('{"t":"invalido"}');   // Buzz + ShowMessage('INVALID OpCode!')
      OpCode     := _HLT;
      UControl.S := 3;
    end;
end;

procedure RunStep; begin
  case UControl.S of
    0: begin
      ShowMem(CPU.PC);
      FetchOpCode;
    end;
    1: FetchOperandAddr;
    2: Execute;
    3: Halted := true;
  end;
end;

procedure CPU_Reset;
begin
  with CPU do begin
    ACC := 0; PC := 0; MAR := 0; MDR := 0; A := 0; B := 0; IR := 0;
    SP := 255;
    ULA.Value := 0; ULA.Z := false; ULA.N := false; ULA.C := false;
    OpCode := _HLT;
  end;
  UControl.S := 0;
  UControl.T := 0;
end;

var
  F: file;
begin
  if ParamCount < 1 then begin
    WriteLn(StdErr, 'uso: cpu8e_ref <programa.bin> [maxEventos]');
    Halt(1);
  end;
  if ParamCount >= 2 then MaxEventos := StrToInt(ParamStr(2));
  CPU_Reset;
  FillChar(CPU.Mem, SizeOf(CPU.Mem), 0);
  Assign(F, ParamStr(1));
  Reset(F, 1);
  BlockRead(F, CPU.Mem, SizeOf(CPU.Mem), CPU.LenProg);
  Close(F);
  repeat
    RunStep;
  until Halted;
  Emit('{"t":"halt","est":' + EstadoJSON(true) + '}');
end.

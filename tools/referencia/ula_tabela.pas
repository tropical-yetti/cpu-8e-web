program ula_tabela;
{
  Gera a tabela completa de resultados da ULA do simulador original, para
  conferir a ULA do CPU-8E Web em todas as combinações de entrada.

  Derivado de CPU8E_Control.pas (ProcessULA), CPU-8E v2.2.3
  Copyright 2009/10 Joel Guilherme da Silva Filho (http://lattes.cnpq.br/7746085908957322) e colaboradores (veja NOTICE.md)
  Modificado em 2026-10-13: só o cálculo de R foi mantido (idêntico ao original);
  a saída é binária: um word (16 bits, little-endian) por combinação.

  Ordem: para cada operação de OPS, para A de 0 a 255, para B de 0 a 255.
  SPDX-License-Identifier: GPL-3.0-or-later
}

{$mode delphi}

type
  OpCodeType = (_NOT,_LOD,_CMP,_ADD,_SUB,_AND,_XOR,_ORL,_SHL,_SHR,_SRA,_ROL,_ROR);

function Calcula(OpCode: OpCodeType; A, B: byte): word;
var
  R: word;
begin
  R := 0;
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
    _AND: R := A and B;
    _XOR: R := A xor B;
    _ORL: R := A or B;
    _SHL: begin
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
  Result := R;
end;

var
  Op: OpCodeType;
  A, B: integer;
  W: word;
  F: file;
begin
  Assign(F, ParamStr(1));
  Rewrite(F, 1);
  for Op := Low(OpCodeType) to High(OpCodeType) do
    for A := 0 to 255 do
      for B := 0 to 255 do begin
        W := Calcula(Op, A, B);
        BlockWrite(F, W, 2);
      end;
  Close(F);
end.

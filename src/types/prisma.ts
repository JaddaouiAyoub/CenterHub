/**
 * Stable type definitions for Prisma enums.
 * Used as a workaround when @prisma/client generation fails to export members 
 * or when the TypeScript server fails to resolve them.
 */

export type Role = "ADMIN" | "TEACHER" | "PARENT" | "SECRETARY" | "STUDENT";
export const Role = {
  ADMIN: "ADMIN" as Role,
  TEACHER: "TEACHER" as Role,
  PARENT: "PARENT" as Role,
  SECRETARY: "SECRETARY" as Role,
  STUDENT: "STUDENT" as Role,
} as const;

export type EvaluationType = "CONTROLE_1" | "CONTROLE_2" | "CONTROLE_3" | "DEVOIR" | "EXAMEN" | "AUTRE";
export const EvaluationType = {
  CONTROLE_1: "CONTROLE_1" as EvaluationType,
  CONTROLE_2: "CONTROLE_2" as EvaluationType,
  CONTROLE_3: "CONTROLE_3" as EvaluationType,
  DEVOIR: "DEVOIR" as EvaluationType,
  EXAMEN: "EXAMEN" as EvaluationType,
  AUTRE: "AUTRE" as EvaluationType,
} as const;

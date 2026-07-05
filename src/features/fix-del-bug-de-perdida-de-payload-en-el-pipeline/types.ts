/**
 * Tipos del fix de pérdida de payload en el pipeline (E1-T3).
 *
 * El bridge recibe la "idea" desde n8n y la reenvía a `claude -p`. En el camino,
 * los campos se perdían (title -> undefined, description -> "No provista") por
 * mismatch de nombres de campo, envelopes de n8n y placeholders que enmascaraban
 * la ausencia real de datos. Estos tipos modelan tanto el payload crudo/no confiable
 * como el payload normalizado y garantizado que consumen los agentes downstream.
 *
 * NOTA: `src/shared/types/index.ts` no existe todavía en este repo, por lo que los
 * tipos se definen acá de forma autocontenida. Cuando exista el módulo compartido,
 * `NormalizedIdeaPayload` debería promoverse a él y reexportarse desde acá.
 */

/** Payload tal como entra al bridge: forma y nombres de campo NO son confiables. */
export type RawIdeaPayload = Readonly<Record<string, unknown>>;

/** Motivo por el que un campo no pudo mapearse a un valor real. */
export type MappingIssueReason = "missing" | "empty" | "placeholder";

/** Detalle de un campo que no pudo resolverse a partir del payload crudo. */
export interface MappingIssue {
  /** Nombre canónico del campo afectado (p. ej. "title"). */
  readonly field: string;
  /** Por qué falló: ausente, vacío, o relleno con un placeholder ("No provista"). */
  readonly reason: MappingIssueReason;
  /** Aliases que se intentaron resolver, en orden de prioridad. */
  readonly aliasesTried: readonly string[];
}

/**
 * Payload validado: garantiza que los campos que los agentes downstream necesitan
 * (title, description) están presentes y no son placeholders. Los campos opcionales
 * son `null` cuando no vinieron, nunca un string placeholder.
 */
export interface NormalizedIdeaPayload {
  readonly title: string;
  readonly description: string;
  readonly icp: string | null;
  readonly market: string | null;
  readonly businessModel: string | null;
  readonly differentiator: string | null;
  /** Campos no reconocidos, preservados verbatim para no perder nada. */
  readonly extra: Readonly<Record<string, unknown>>;
}

/** Mapeo exitoso: título y descripción presentes; opcionales pueden faltar (warnings). */
export interface MappingSuccess {
  readonly ok: true;
  readonly payload: NormalizedIdeaPayload;
  readonly warnings: readonly MappingIssue[];
}

/** Mapeo fallido: falta al menos un campo obligatorio. Se expone lo que sí se pudo mapear. */
export interface MappingFailure {
  readonly ok: false;
  readonly issues: readonly MappingIssue[];
  readonly partial: Partial<NormalizedIdeaPayload>;
}

/** Resultado discriminado del mapeo del payload. */
export type MappingResult = MappingSuccess | MappingFailure;

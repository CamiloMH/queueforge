/** Caracteres válidos en un campo individual de una expresión cron. */
const CRON_FIELD = /^[0-9*?,\-/]+$/;

/**
 * Valida de forma ligera una expresión cron de 5 o 6 campos.
 *
 * No evalúa la semántica completa (rangos por campo), sino su estructura, suficiente
 * para rechazar entradas claramente inválidas antes de registrarlas en BullMQ.
 *
 * @param expression - Expresión cron a validar.
 * @returns `true` si la estructura es válida.
 */
export const isValidCronExpression = (expression: string): boolean => {
  const fields = expression.trim().split(/\s+/);
  if (fields.length < 5 || fields.length > 6) {
    return false;
  }
  return fields.every((field) => CRON_FIELD.test(field));
};

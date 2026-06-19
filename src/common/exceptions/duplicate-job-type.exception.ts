/**
 * Se lanza al iniciar la aplicación si dos handlers declaran el mismo `type`.
 *
 * Es un error de configuración del registro de estrategias (no llega al cliente HTTP),
 * por lo que extiende `Error` en lugar de {@link DomainException}.
 */
export class DuplicateJobTypeException extends Error {
  /**
   * @param type - Tipo de job duplicado.
   */
  constructor(type: string) {
    super(`More than one handler is registered for job type "${type}".`);
    this.name = 'DuplicateJobTypeException';
  }
}

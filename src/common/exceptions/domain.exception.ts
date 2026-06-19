import { HttpException } from '@nestjs/common';

/**
 * Base de todas las excepciones de dominio controladas.
 *
 * Cada excepción concreta define un **status HTTP personalizado**, un **código de error
 * legible por máquina** (`errorCode`) y un **mensaje en inglés**. El filtro global
 * ({@link AllExceptionsFilter}) las serializa de forma uniforme.
 */
export abstract class DomainException extends HttpException {
  /** Código de error estable y legible por máquina (p. ej. `JOB_NOT_FOUND`). */
  readonly errorCode: string;

  /**
   * @param status - Código de estado HTTP.
   * @param errorCode - Código de error legible por máquina.
   * @param message - Mensaje descriptivo en inglés.
   */
  constructor(status: number, errorCode: string, message: string) {
    super(message, status);
    this.errorCode = errorCode;
  }
}

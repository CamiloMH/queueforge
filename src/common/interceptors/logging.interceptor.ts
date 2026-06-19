import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * Interceptor que registra cada petición HTTP con su método, ruta y duración.
 *
 * Centraliza el logging de acceso como cross-cutting concern, evitando repetirlo en
 * cada controlador (DRY).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  /**
   * Envuelve la ejecución del handler para medir y registrar su duración.
   *
   * @param context - Contexto de ejecución.
   * @param next - Siguiente paso en la cadena.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const { method, url } = request;
    const startedAt = Date.now();

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(`${method} ${url} (${Date.now() - startedAt}ms)`),
        ),
      );
  }
}

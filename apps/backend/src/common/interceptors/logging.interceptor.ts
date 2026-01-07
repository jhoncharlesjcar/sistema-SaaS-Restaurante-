import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, url, ip } = request;
        const userAgent = request.get('user-agent') || '';
        const user = (request as any).user;

        const now = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const { statusCode } = response;
                    const contentLength = response.get('content-length') || 0;
                    const duration = Date.now() - now;

                    this.logger.log(
                        `${method} ${url} ${statusCode} ${contentLength} - ${duration}ms - ${ip} ${userAgent}${user ? ` [User: ${user.id}]` : ''}`,
                    );
                },
                error: (error) => {
                    const duration = Date.now() - now;
                    this.logger.error(
                        `${method} ${url} - ${duration}ms - ${ip} ${userAgent} - Error: ${error.message}`,
                    );
                },
            }),
        );
    }
}

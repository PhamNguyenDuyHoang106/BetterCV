import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Fields to strip from Sentry event extras to prevent PII leakage.
 */
const SENSITIVE_FIELDS = [
  'jobDescription',
  'resumeText',
  'fullResumeText',
  'coverLetter',
  'personalStatement',
];

/**
 * Recursively sanitize an object by replacing sensitive field values with '[REDACTED]'.
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitize(value);
    }
  }
  return result;
}

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let extraFields = {};

    if (exception instanceof HttpException) {
      const resObj = exception.getResponse();
      if (typeof resObj === 'object' && resObj !== null) {
        message = (resObj as any).message || exception.message;
        const { statusCode, error, message: _, ...rest } = resObj as any;
        extraFields = rest;
      } else {
        message = exception.message;
      }
    }

    // ── Extract correlation data ──
    const requestId =
      (request as any).id ?? // pino-http sets this
      request.headers['x-request-id'] ??
      null;
    const userId = (request as any).user?.sub ?? null;

    // ── Report to Sentry (only 5xx errors) ──
    if (status >= 500 && exception instanceof Error) {
      Sentry.withScope((scope) => {
        scope.setTag('requestId', requestId);
        scope.setTag('environment', process.env.NODE_ENV || 'development');
        scope.setUser({ id: userId ?? undefined });
        scope.setContext(
          'request',
          sanitize({
            method: request.method,
            url: request.url,
            query: request.query,
            body: request.body,
          }) as Record<string, unknown>,
        );
        Sentry.captureException(exception);
      });
    }

    // ── Log locally ──
    const logPayload = {
      requestId,
      userId,
      method: request.method,
      url: request.url,
      statusCode: status,
      errorMessage: message,
      errorStack:
        status >= 500 && exception instanceof Error
          ? exception.stack
          : undefined,
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logPayload));
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }

    // ── Response ──
    const errorResponse = {
      success: false,
      data: null,
      error: {
        statusCode: status,
        message,
        ...extraFields,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}

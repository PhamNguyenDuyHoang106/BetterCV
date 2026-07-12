import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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

    const errorResponse = {
      success: false,
      data: null,
      error: {
        statusCode: status,
        message,
        ...extraFields,
      },
      meta: {
        requestId: (request as any).requestId || null,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    const logPayload = {
      timestamp: new Date().toISOString(),
      requestId: (request as any).requestId || null,
      userId: (request as any).user?.sub || null,
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

    response.status(status).json(errorResponse);
  }
}

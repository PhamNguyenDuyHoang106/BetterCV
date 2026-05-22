import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

/**
 * Extracts the authenticated user payload from the request.
 *
 * Usage:
 *   @CurrentUser() user: JwtPayload
 *   @CurrentUser('sub') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    return data ? user?.[data] : user;
  },
);

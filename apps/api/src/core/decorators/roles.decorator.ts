import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/**
 * Restrict route access to users with specific roles.
 *
 * Usage:
 *   @Roles('ADMIN', 'PRO')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

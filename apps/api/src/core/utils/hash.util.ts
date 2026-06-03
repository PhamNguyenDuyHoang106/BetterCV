import * as crypto from 'crypto';

export function getLogHashSalt(): string {
  return (
    process.env.LOG_HASH_SALT ||
    'default-secret-salt-do-not-use-in-prod-1234567890'
  );
}

export function hashUser(userId: string, tenantId = 'default'): string {
  const salt = getLogHashSalt();
  return crypto
    .createHash('sha256')
    .update(`${tenantId}:${userId}:${salt}`)
    .digest('hex');
}

export function hashTenant(tenantId: string): string {
  const salt = getLogHashSalt();
  return crypto
    .createHash('sha256')
    .update(`${tenantId}:${salt}`)
    .digest('hex');
}

export function hashIp(ip: string): string {
  const secret = process.env.AUDIT_IP_HASH_SECRET || getLogHashSalt();
  return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}

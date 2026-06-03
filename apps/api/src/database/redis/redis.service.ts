import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  private redisEnabled = false;

  constructor(private readonly config: ConfigService) { }

  onModuleInit() {
    this.redisEnabled =
      this.config.get<string>('REDIS_ENABLED', 'true') === 'true';

    if (!this.redisEnabled) {
      this.logger.warn('Redis disabled by environment config');
      return;
    }

    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<number>('REDIS_PORT', 6379)),

      maxRetriesPerRequest: 3,

      retryStrategy(times) {
        if (times > 10) return null;

        return Math.min(100 * Math.pow(2, times - 1), 3000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection failed: ${err.message}`);
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  getClient(): Redis | undefined {
    return this.client;
  }

  private ensureClient(): Redis {
    if (!this.client) {
      throw new Error(
        'Redis client not initialized. Check REDIS_ENABLED or Redis server.',
      );
    }

    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;

    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    const client = this.ensureClient();

    if (ttlSeconds) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
  }

  async hset(
    key: string,
    field: string,
    value: string,
  ): Promise<number> {
    return this.ensureClient().hset(key, field, value);
  }

  async hget(
    key: string,
    field: string,
  ): Promise<string | null> {
    return this.ensureClient().hget(key, field);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.ensureClient().hincrby(
      key,
      field,
      increment,
    );
  }

  async hgetall(
    key: string,
  ): Promise<Record<string, string>> {
    return this.ensureClient().hgetall(key);
  }

  async del(key: string): Promise<number> {
    return this.ensureClient().del(key);
  }
}
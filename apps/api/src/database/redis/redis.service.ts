import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        // Capped exponential backoff retry strategy with a maximum cap of 3 seconds
        const delay = Math.min(100 * Math.pow(2, times - 1), 3000);
        return delay;
      },
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  // Common Redis Operations Wrappers
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.client.hincrby(key, field, increment);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }
}

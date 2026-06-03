import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userHash?: string;
  tenantHash?: string;
  ipHash?: string;
  traceId?: string;
}

export class RequestContextStore {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  static run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  static getStore(): RequestContext | undefined {
    return this.storage.getStore();
  }

  static get<K extends keyof RequestContext>(
    key: K,
  ): RequestContext[K] | undefined {
    const store = this.getStore();
    return store ? store[key] : undefined;
  }

  static set<K extends keyof RequestContext>(
    key: K,
    value: RequestContext[K],
  ): void {
    const store = this.getStore();
    if (store) {
      store[key] = value;
    }
  }
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import redis, { RedisClient } from 'redis';
import { promisify } from 'util';

export interface RedisCacheClient {
  get: (key: string) => Promise<string | null>;
  mGet: (keys: string[]) => Promise<(string | null)[]>;
  hmGet: (key: string, fields: string[]) => Promise<(string | null)[]>;
  set: (key: string, value: string) => Promise<boolean>;
  mSet: (keyAndValues: string[]) => Promise<boolean>;
  hmSet: (key: string, fieldValues: Record<string, string>) => Promise<boolean>;
  sAdd: (key: string, members: string[]) => Promise<boolean>;
  sInter: (keys: string[]) => Promise<string[]>;
  del: (keys: string[]) => Promise<number>;
}

export class RealRedisCacheClient implements RedisCacheClient {
  static readonly realInstance = new RealRedisCacheClient();

  private readonly client: RedisClient;

  private readonly fetchFromCache: (key: string) => Promise<string | null>;

  private readonly fetchManyFromCache: (keys: string[]) => Promise<(string | null)[]>;

  private readonly fetchFromCacheMap: (key: string, fields: string[]) => Promise<(string | null)[]>;

  private readonly fetchFromCacheSet: (key: string) => Promise<string[]>;

  private readonly fetchFromCacheSetIntersection: (keys: string[]) => Promise<string[]>;

  private readonly deleteFromCache: (keys: string[]) => Promise<number>;

  private constructor() {
    this.client = redis.createClient();
    this.fetchFromCache = promisify(this.client.get).bind(this.client);
    this.fetchManyFromCache = promisify(this.client.mget).bind(this.client);
    this.fetchFromCacheMap = promisify(this.client.hmget).bind(this.client);
    this.fetchFromCacheSet = promisify(this.client.smembers).bind(this.client);
    this.fetchFromCacheSetIntersection = promisify(this.client.sinter).bind(this.client);
    this.deleteFromCache = promisify(this.client.del).bind(this.client);
  }

  public static getInstance() {
    return RealRedisCacheClient.realInstance;
  }

  public async get(key: string) {
    return this.fetchFromCache(key);
  }

  public async mGet(keys: string[]) {
    return this.fetchManyFromCache(keys);
  }

  public async hmGet(key: string, fields: string[]) {
    return this.fetchFromCacheMap(key, fields);
  }

  public async set(key: string, value: string) {
    return this.client.set(key, value);
  }

  public async mSet(keyAndValues: string[]) {
    return this.client.mset(keyAndValues);
  }

  public async hmSet(key: string, fieldValues: Record<string, string>) {
    return this.client.hmset(key, fieldValues);
  }

  public async sAdd(key: string, values: string[]) {
    return this.client.sadd(key, values);
  }

  public async sMembers(key: string) {
    return this.fetchFromCacheSet(key);
  }

  public async sInter(keys: string[]) {
    return this.fetchFromCacheSetIntersection(keys);
  }

  public async del(keys: string[]) {
    return this.deleteFromCache(keys);
  }
}

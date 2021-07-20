/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { AnalyticValue } from '../types';

import { RedisCacheClient, RealRedisCacheClient } from './RedisCacheClient';
import { IndicatorAnalytic, IndicatorCacheEntry } from './types';

const ANALYTIC_PREFIX = 'ANALYTIC';
const RELATION_PREFIX = 'RELATION';
const KEY_JOINER = '|';

const NO_DATA = 'NO_DATA';

export class IndicatorCache {
  private readonly redisClient: RedisCacheClient;

  constructor(redisClient: RedisCacheClient = RealRedisCacheClient.getInstance()) {
    this.redisClient = redisClient;
  }

  public async getAnalytics(indicatorCode: string, cacheEntries: IndicatorCacheEntry[]) {
    const start = Date.now();
    const cacheKeys = cacheEntries.map(entry => this.buildAnalyticKey(entry));
    const resultsFromCache = await this.redisClient.hmGet(indicatorCode, cacheKeys);
    const resultsForAnalytics = cacheEntries.map((entry, index) => ({
      ...entry,
      value: resultsFromCache[index],
    }));

    const end = Date.now();
    console.log(`Reading ${cacheEntries.length} items from cache took: ${end - start}ms`);

    const hitResults: AnalyticValue[] = [];
    const missResults: IndicatorCacheEntry[] = [];
    resultsForAnalytics.forEach(cacheResult => {
      const { value, period, organisationUnit, hierarchy } = cacheResult;
      if (value !== null) {
        if (value !== NO_DATA) {
          hitResults.push({ organisationUnit, period, value: this.parseCacheValue(value) });
        }
      } else {
        missResults.push({ period, organisationUnit, hierarchy });
      }
    });

    return { hits: hitResults, misses: missResults };
  }

  public async storeAnalytics(
    indicatorCode: string,
    requestedAnalytics: IndicatorCacheEntry[],
    returnedAnalytics: AnalyticValue[],
  ) {
    const resultsFromAnalytics = requestedAnalytics.map(requested => ({
      ...requested,
      value: `${
        returnedAnalytics.find(
          returned =>
            returned.organisationUnit === requested.organisationUnit &&
            returned.period === requested.period,
        )?.value || NO_DATA
      }`,
    }));

    const resultByAnalytic = resultsFromAnalytics.reduce((object, analytic) => {
      // eslint-disable-next-line no-param-reassign
      object[this.buildAnalyticKey(analytic)] = analytic.value;
      return object;
    }, {} as Record<string, string>);

    this.redisClient.hmSet(indicatorCode, resultByAnalytic);
  }

  public async storeRelations(
    indicatorCode: string,
    indicatorAnalyticRelations: IndicatorAnalytic[],
  ) {
    const relationsAsSets = indicatorAnalyticRelations.map(analytic => {
      const relationValue = this.buildRelationValue(indicatorCode, analytic);
    });
  }

  private parseCacheValue(cacheValue: string) {
    const parsedValue = parseFloat(cacheValue);
    if (isNaN(parsedValue)) {
      throw new Error('analyticArithmetic indicator cache values must be numeric');
    }

    return parsedValue;
  }

  private buildAnalyticKey(dimension: IndicatorCacheEntry) {
    return [
      ANALYTIC_PREFIX,
      dimension.period,
      dimension.organisationUnit,
      dimension.hierarchy,
    ].join(KEY_JOINER);
  }

  private buildRelationKey(dataElementCode: string, dimension: IndicatorCacheEntry) {
    return [RELATION_PREFIX, dataElementCode, dimension.period, dimension.organisationUnit].join(
      KEY_JOINER,
    );
  }

  private buildRelationValue(indicatorCode: string, dimension: IndicatorCacheEntry) {
    return [indicatorCode, dimension.period, dimension.organisationUnit].join(KEY_JOINER);
  }
}

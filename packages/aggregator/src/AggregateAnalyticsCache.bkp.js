/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

const redis = require('redis');
const { promisify } = require('util');

import sortby from 'lodash.sortby';
import {
  adjustOptionsToAggregationList,
  constructAggregateAnalyticsForFetch,
  runAggregation,
} from './analytics';

const NO_DATA = 'no_data';

export class AggregateAnalyticsCache {
  constructor(aggregator) {
    this.aggregator = aggregator;
    this.cacheClient = redis.createClient();
  }

  async fetchAnalytics(dataElementCodes, fetchOptions, aggregationOptions = {}) {
    const fetchFromCache = promisify(this.cacheClient.get).bind(this.cacheClient);

    const [adjustedFetchOptions, adjustedAggregationOptions] = await adjustOptionsToAggregationList(
      this.aggregator.context,
      fetchOptions,
      aggregationOptions,
    );

    const { aggregations } = adjustedAggregationOptions;

    const aggregateAnalyticsByLevel = constructAggregateAnalyticsForFetch(
      dataElementCodes,
      adjustedFetchOptions,
      aggregations,
    );

    const cachedResultsByLevel = [];
    const uncachedResultsByLevel = [];
    for (let i = 0; i < aggregateAnalyticsByLevel.length; i++) {
      const aggregateAnalyticsForLevel = aggregateAnalyticsByLevel[i];
      const results = await Promise.all(
        aggregateAnalyticsForLevel.map(async aggregateAnalytic => ({
          aggregateAnalytic,
          value: await fetchFromCache(cacheKey).then(parseCacheValue),
        })),
      );
      const cachedResults = results.filter(cacheResult => cacheResult.value !== null);
      cachedResultsByLevel.push(cachedResults);

      const uncachedResults = results.filter(cacheResult => cacheResult.value === null);
      uncachedResultsByLevel.push(uncachedResults);
      if (uncachedResults.length === 0) {
        break;
      }
    }

    if (uncachedResultsByLevel.every(level => level.length === 0)) {
      return { results: toAnalytics(cachedResultsByLevel[0]) };
    }

    const aggregatedResultsByLevel = [];
    const reverseSortedAggregations = aggregations.slice().reverse();
    for (let i = uncachedResultsByLevel.length - 1; i >= 0; i--) {
      const uncachedResults = uncachedResultsByLevel[i];
      const cachedResults = cachedResultsByLevel[i];

      if (uncachedResults.length === 0) {
        // no uncached results, end early
        aggregatedResultsByLevel.push(cachedResults);
        continue;
      }

      const aggregation = reverseSortedAggregations[i];

      const analyticsForLevel = aggregation
        ? runAggregation(
            toAnalytics(uncachedResultsByLevel[i + 1]),
            aggregation.type,
            aggregation.config,
          )
        : await this.fetchFromAggregator(uncachedResults, adjustedFetchOptions, {
            ...adjustedAggregationOptions,
            aggregations: [aggregations[0]],
          });
    }

    uncachedResults.forEach(({ dataElementCode, aggregateAnalytic, cacheKey }) => {
      const matchingResult = results.find(
        result =>
          result.dataElement === dataElementCode &&
          result.period === aggregateAnalytic.getAggregatePeriod() &&
          result.organisationUnit === aggregateAnalytic.getAggregateEntity(),
      );

      if (matchingResult) {
        this.cacheClient.set(cacheKey, createCacheValue(matchingResult.value), redis.print);
      } else {
        this.cacheClient.set(cacheKey, createCacheValue(NO_DATA), redis.print);
      }
    });

    return {
      results: sortby([...analyticsFromCache, ...results], ['period']),
    };
  }

  async fetchFromAggregator(uncachedResults, fetchOptions, aggregationOptions) {
    const uncachedDataElements = new Set();
    const uncachedPeriods = new Set();
    const uncachedEntities = new Set();

    uncachedResults.forEach(({ aggregateAnalytic }) => {
      uncachedDataElements.add(aggregateAnalytic.dataElement);
      aggregateAnalytic.inputPeriods.forEach(uncachedPeriods.add, uncachedPeriods);
      aggregateAnalytic.inputEntities.forEach(uncachedEntities.add, uncachedEntities);
    });

    console.log(
      'fetching for uncached values',
      [...uncachedDataElements],
      [...uncachedPeriods],
      [...uncachedEntities],
    );

    const { results } = await this.aggregator.fetchAnalytics(
      [...uncachedDataElements],
      {
        ...fetchOptions,
        period: [...uncachedPeriods].join(';'),
        organisationUnitCodes: [...uncachedEntities],
      },
      aggregationOptions,
    );
    return results;
  }

  attachAnalyticValuesToUncachedResults(uncachedResults, analytics) {
    uncachedResults.forEach(result => {
      const matchingAnalytic = analytics.find(
        analytic =>
          analytic.dataElement === result.aggregateAnalytic.dataElement &&
          analytic.period === result.aggregateAnalytic.outputPeriod &&
          analytic.organisationUnit === result.aggregateAnalytic.outputEntity,
      );

      result.value = matchingAnalytic ? matchingAnalytic.value : NO_DATA;
    });
  }
}

const createCacheValue = value => `${value}::${typeof value}`;

const parseCacheValue = cacheValue => {
  if (cacheValue === null) {
    return null;
  }

  const [value, valueType] = cacheValue.split('::');
  if (valueType === 'number') {
    return parseFloat(value);
  }
  return value;
};

const toAnalytics = cacheResults =>
  sortby(
    cacheResults
      .filter(({ value }) => value !== null)
      .filter(({ value }) => value !== NO_DATA)
      .map(({ value, aggregateAnalytic }) => {
        return {
          dataElement: aggregateAnalytic.dataElement,
          period: aggregateAnalytic.outputPeriod,
          organisationUnit: aggregateAnalytic.outputEntity,
          value,
        };
      }),
    ['period'],
  );

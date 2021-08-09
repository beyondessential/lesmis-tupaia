/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { lower } from 'case';
import groupBy from 'lodash.groupby';

import { ModelRegistry, TupaiaDatabase } from '@tupaia/database';
import { countDistinct, toArray } from '@tupaia/utils';
import { createService } from './services';

let modelRegistry;

const getModelRegistry = () => {
  if (!modelRegistry) {
    modelRegistry = new ModelRegistry(new TupaiaDatabase());
  }
  return modelRegistry;
};

export class DataBroker {
  constructor(context = {}) {
    this.context = context;
    this.models = getModelRegistry();
    this.resultMergers = {
      [this.getDataSourceTypes().DATA_ELEMENT]: this.mergeAnalytics,
      [this.getDataSourceTypes().DATA_GROUP]: this.mergeEvents,
    };
  }

  async close() {
    return this.models.closeDatabaseConnections();
  }

  getDataSourceTypes() {
    return this.models.dataSource.getTypes();
  }

  async fetchDataSources(dataSourceSpec) {
    const { code, type } = dataSourceSpec;
    if (!code || (Array.isArray(code) && code.length === 0)) {
      throw new Error('Please provide at least one existing data source code');
    }
    const dataSources = await this.models.dataSource.find(dataSourceSpec);
    const typeDescription = `${lower(type)}s`;
    if (dataSources.length === 0) {
      throw new Error(`None of the following ${typeDescription} exist: ${code}`);
    }

    const codesRequested = toArray(code);
    const codesFound = dataSources.map(ds => ds.code);
    const codesNotFound = codesRequested.filter(c => !codesFound.includes(c));
    if (codesNotFound.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Could not find the following ${typeDescription}: ${codesNotFound}`);
    }

    return dataSources;
  }

  createService(serviceType) {
    return createService(this.models, serviceType, this);
  }

  async push(dataSourceSpec, data) {
    const dataSources = await this.fetchDataSources(dataSourceSpec);
    if (countDistinct(dataSources, 'service_type') > 1) {
      throw new Error('Cannot push data belonging to different services');
    }
    const service = this.createService(dataSources[0].service_type);
    return service.push(dataSources, data);
  }

  async delete(dataSourceSpec, data, options) {
    const dataSources = await this.fetchDataSources(dataSourceSpec);
    const [dataSource] = dataSources;
    const service = this.createService(dataSource.service_type);
    return service.delete(dataSource, data, options);
  }

  async pull(dataSourceSpec, options) {
    const dataSources = await this.fetchDataSources(dataSourceSpec);
    if (countDistinct(dataSources, 'type') > 1) {
      throw new Error('Cannot pull multiple types of data in one call');
    }

    const dataSourcesByService = groupBy(dataSources, 'service_type');
    const dataSourceFetches = Object.values(dataSourcesByService);
    const nestedResults = await Promise.all(
      dataSourceFetches.map(dataSourceForFetch =>
        this.pullForServiceAndType(dataSourceForFetch, {
          ...options,
          canProcessAggregations: dataSourceFetches.length === 1,
        }),
      ),
    );
    const mergeResults = this.resultMergers[dataSources[0].type];

    return nestedResults.reduce(
      (results, resultsForService) => mergeResults(results, resultsForService),
      undefined,
    );
  }

  pullForServiceAndType = async (dataSources, options) => {
    const { type, service_type: serviceType } = dataSources[0];
    const service = this.createService(serviceType);
    return service.pull(dataSources, type, options);
  };

  mergeAnalytics = (target = { results: [], metadata: {}, aggregationsProcessed: [] }, source) => ({
    results: target.results.concat(source.results),
    metadata: {
      dataElementCodeToName: {
        ...target.metadata.dataElementCodeToName,
        ...source.metadata.dataElementCodeToName,
      },
    },
    aggregationsProcessed: target.aggregationsProcessed.concat(source.aggregationsProcessed || []),
  });

  mergeEvents = (target = [], source) => target.concat(source);

  async pullMetadata(dataSourceSpec, options) {
    const dataSources = await this.fetchDataSources(dataSourceSpec);
    if (countDistinct(dataSources, 'service_type') > 1) {
      throw new Error('Cannot pull metadata for data sources belonging to different services');
    }
    const service = this.createService(dataSources[0].service_type);
    // `dataSourceSpec` is defined  for a single `type`
    const { type } = dataSources[0];
    return service.pullMetadata(dataSources, type, options);
  }
}

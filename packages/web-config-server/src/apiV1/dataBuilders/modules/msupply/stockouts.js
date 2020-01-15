/**
 * Tupaia Config Server
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd
 */

import keyBy from 'lodash.keyby';

import { stripFromStart } from '@tupaia/utils';
import { DataBuilder } from '/apiV1/dataBuilders/DataBuilder';
import { ENTITY_TYPES } from '/models/Entity';

class StockoutsDataBuilder extends DataBuilder {
  async build() {
    const { results, metadata } = await this.getAnalytics({
      outputIdScheme: 'code',
      ...this.config,
    });
    const stockoutData = this.entity.isFacility()
      ? this.getStockoutsList(results, metadata)
      : await this.getStockoutsByFacility(results, metadata);

    if (stockoutData.length === 0)
      return { data: [{ value: 'Vaccine Stockouts' }, { name: 'No stockouts', value: '' }] };

    return {
      data: [{ value: 'Vaccine Stockouts' }, ...stockoutData],
    };
  }

  getStockoutsByFacility = async (results, metadata) => {
    const { dataElementCodeToName } = metadata;
    const facilities = await this.entity.getDescendantsOfType(ENTITY_TYPES.FACILITY);
    const facilitiesByCode = keyBy(facilities, 'code');
    const stockoutsByOrgUnit = results.reduce((stockouts, vaccine) => {
      const orgUnitName = facilitiesByCode[vaccine.organisationUnit].name;
      const stockout =
        vaccine.value === 0 &&
        stripFromStart(
          dataElementCodeToName[vaccine.dataElement],
          this.config.stripFromDataElementNames,
        );

      if (stockout) {
        stockouts[orgUnitName] = [...(stockouts[orgUnitName] || []), stockout];
      }

      return stockouts;
    }, {});

    const buildStockoutString = ([facility, items]) => ({
      name: facility,
      value: items.join('\n'),
    });

    return Object.entries(stockoutsByOrgUnit).map(buildStockoutString);
  };

  getStockoutsList = (results, metadata) => {
    return results
      .filter(({ value }) => value === 0)
      .map(({ dataElement: dataElementCode }) => ({
        value: stripFromStart(
          metadata.dataElementCodeToName[dataElementCode],
          this.config.stripFromDataElementNames,
        ),
      }));
  };
}

export const stockouts = async ({ dataBuilderConfig, query, entity }, dhisApi) => {
  const builder = new StockoutsDataBuilder(dhisApi, dataBuilderConfig, query, entity);
  return builder.build();
};

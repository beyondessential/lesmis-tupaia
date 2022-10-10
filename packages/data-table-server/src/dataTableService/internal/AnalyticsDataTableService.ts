/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Aggregator } from '@tupaia/aggregator';
import { TupaiaApiClient } from '@tupaia/api-client';
import { DataBroker } from '@tupaia/data-broker';
import { EARLIEST_DATA_DATE_STRING, yup } from '@tupaia/utils';
import { DataTableService } from '../DataTableService';
import { yupSchemaToDataTableParams } from '../utils';

const paramsSchema = yup.object().shape({
  hierarchy: yup.string().default('explore'),
  dataElementCodes: yup.array().of(yup.string().required()).required(),
  organisationUnitCodes: yup.array().of(yup.string().required()).required(),
  startDate: yup.date().default(new Date(EARLIEST_DATA_DATE_STRING)),
  endDate: yup.date().default(() => new Date()),
  aggregations: yup.array().of(
    yup.object().shape({
      type: yup.string().required(),
      config: yup.object(),
    }),
  ),
});

const configSchema = yup.object();

type Analytic = { period: string; organisationUnit: string; dataElement: string; value: unknown };

/**
 * DataTableService for pulling data from data-broker's fetchAnalytics() endpoint
 */
export class AnalyticsDataTableService extends DataTableService<
  typeof paramsSchema,
  typeof configSchema,
  Analytic
> {
  public constructor(apiClient: TupaiaApiClient, config: unknown) {
    super(paramsSchema, configSchema, apiClient, config);
  }

  protected async pullData(params: {
    hierarchy: string;
    dataElementCodes: string[];
    organisationUnitCodes: string[];
    startDate: Date;
    endDate: Date;
    aggregations?: { type: string; config?: Record<string, unknown> }[];
  }) {
    const {
      hierarchy,
      dataElementCodes,
      organisationUnitCodes,
      startDate,
      endDate,
      aggregations,
    } = params;

    const startDateString = startDate.toISOString();
    const endDateString = endDate.toISOString();

    const aggregator = new Aggregator(new DataBroker({ services: this.apiClient }));

    const { results } = await aggregator.fetchAnalytics(
      dataElementCodes,
      {
        organisationUnitCodes,
        hierarchy,
        startDate: startDateString,
        endDate: endDateString,
        detectDataServices: true,
      },
      { aggregations },
    );

    return results as Analytic[];
  }

  public getParameters() {
    // Not including aggregations, as they are a hidden parameter
    const {
      hierarchy,
      organisationUnitCodes,
      dataElementCodes,
      startDate,
      endDate,
    } = yupSchemaToDataTableParams(paramsSchema);

    return [
      { name: 'hierarchy', config: hierarchy },
      {
        name: 'organisationUnitCodes',
        config: organisationUnitCodes,
      },
      { name: 'dataElementCodes', config: dataElementCodes },
      {
        name: 'startDate',
        config: startDate,
      },
      {
        name: 'endDate',
        config: endDate,
      },
    ];
  }
}

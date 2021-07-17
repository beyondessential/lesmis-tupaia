/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Aggregator } from '@tupaia/aggregator';
import { ObjectValidator } from '@tupaia/utils';
import { ExpressionParser } from '@tupaia/expression-parser';
import groupBy from 'lodash.groupby';
import { Aggregation, Analytic, DataValues, FetchOptions } from '../types';

export function validateConfig<T extends Record<string, unknown>>(
  config: Record<string, unknown>,
  validators = {},
): asserts config is T {
  new ObjectValidator(validators).validateSync(
    config,
    (error: string, field: string) => new Error(`Error in field '${field}': ${error}`),
  );
}

export const groupKeysByValueJson = (object: Record<string, unknown>) =>
  groupBy(Object.keys(object), code => JSON.stringify(object[code]));

export const fetchAnalytics = async (
  aggregator: Aggregator,
  aggregationListByElement: Record<string, Aggregation[]>,
  fetchOptions: FetchOptions,
): Promise<Analytic[]> => {
  // A different aggregationList may be applied for each data element,
  // but only one aggregationList can be provided in an aggregator call
  // Group data elements per aggregationList to minimise aggregator calls
  const aggregationJsonToElements = groupKeysByValueJson(aggregationListByElement);

  const analytics: Analytic[] = [];
  await Promise.all(
    Object.entries(aggregationJsonToElements).map(async ([aggregationJson, elements]) => {
      const aggregations = JSON.parse(aggregationJson);
      const { results } = await aggregator.fetchAnalytics(elements, fetchOptions, { aggregations });
      analytics.push(...results);
    }),
  );

  return analytics;
};

export const evaluateFormulaToNumber = (
  parser: ExpressionParser,
  formula: string,
  dataValues: DataValues,
) => {
  parser.setScope(dataValues);
  const value = parser.evaluateToNumber(formula);
  parser.clearScope();
  return value;
};

export const replaceDataValuesWithDefaults = (
  dataValues: DataValues,
  defaultValues: DataValues,
) => {
  const newDataValues = { ...dataValues };
  Object.keys(defaultValues).forEach(code => {
    newDataValues[code] = newDataValues[code] ?? defaultValues[code];
  });
  return newDataValues;
};

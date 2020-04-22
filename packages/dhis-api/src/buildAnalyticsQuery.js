/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { getUniqueEntries } from '@tupaia/utils';

import { DHIS2_RESOURCE_TYPES } from './types';

const { DATA_ELEMENT, ORGANISATION_UNIT } = DHIS2_RESOURCE_TYPES;

const DX_BATCH_SIZE = 400;
const OU_BATCH_SIZE = 400;

const formatGroupCodes = groupCodes =>
  groupCodes.map(groupCode => `DE_GROUP-${groupCode}`).join(';');

const getDxDimension = query => {
  const { dataElementCodes, dataElementGroupCodes, dataElementGroupCode } = query;

  return getUniqueEntries(
    dataElementCodes ||
      formatGroupCodes(dataElementGroupCodes) ||
      formatGroupCodes([dataElementGroupCode]),
  );
};

const getOuDimension = query => {
  const { organisationUnitCode, organisationUnitCodes } = query;
  return organisationUnitCode ? [organisationUnitCode] : getUniqueEntries(organisationUnitCodes);
};

const addTemporalDimension = (query, { period, startDate, endDate }) =>
  period
    ? { ...query, dimension: (query.dimension || []).concat(`pe:${period}`) }
    : { ...query, startDate, endDate };

const buildDataValueAnalyticsQuery = queryInput => {
  const {
    dx,
    ou,
    inputIdScheme = 'code',
    outputIdScheme = 'uid',
    includeMetadataDetails = true,
  } = queryInput;

  const query = {
    inputIdScheme,
    outputIdScheme,
    includeMetadataDetails,
    dimension: [`dx:${dx.join(';')}`, `ou:${ou.join(';')}`, 'co'],
  };
  return addTemporalDimension(query, queryInput);
};

export const buildDataValueAnalyticsQueries = queryInput => {
  const dx = getDxDimension(queryInput);
  const ou = getOuDimension(queryInput);

  // Fetch data in batches to avoid "Request-URI Too Large" errors
  const queries = [];
  for (let i = 0; i < dx.length; i += DX_BATCH_SIZE) {
    for (let j = 0; j < ou.length; j += OU_BATCH_SIZE) {
      queries.push(
        buildDataValueAnalyticsQuery({
          ...queryInput,
          dx: dx.slice(i, i + DX_BATCH_SIZE),
          ou: ou.slice(i, i + OU_BATCH_SIZE),
        }),
      );
    }
  }

  return queries;
};

export const buildEventAnalyticsQuery = async (dhisApi, queryInput) => {
  const { dataElementCodes = [], organisationUnitCodes } = queryInput;
  if (!organisationUnitCodes || organisationUnitCodes.length === 0) {
    throw new Error('Event analytics require at least one organisation unit code');
  }

  const dxDimensions = await dhisApi.codesToIds(DATA_ELEMENT, dataElementCodes);
  const orgUnitIds = await dhisApi.codesToIds(ORGANISATION_UNIT, organisationUnitCodes);

  const query = { dimension: [...dxDimensions, `ou:${orgUnitIds.join(';')}`] };
  return addTemporalDimension(query, queryInput);
};

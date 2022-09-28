/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import { format, differenceInYears, addDays, isDate } from 'date-fns';
import keyBy from 'lodash.keyby';
import { createAggregator } from '@tupaia/aggregator';
import { ReportServerAggregator } from '../../aggregator';
import { FetchReportQuery, Event } from '../../types';
import { ReqContext } from '../context';
import SURVEYS from './data/tongaCovidRawData.json';

interface RelationshipsOptions {
  hierarchy: string;
  entityCodes: string[];
  queryOptions?: any;
  ancestorOptions?: any;
  descendantOptions?: any;
}

interface Options {
  programCode: string;
  dataElementCodes: string[];
}

const getRelationships = (reqContext: ReqContext, options: RelationshipsOptions) => {
  const { hierarchy, entityCodes, queryOptions, ancestorOptions, descendantOptions } = options;
  return reqContext.services.entity.getRelationshipsOfEntities(
    hierarchy,
    entityCodes,
    'descendant',
    queryOptions,
    ancestorOptions,
    descendantOptions,
  ) as Promise<Record<string, string>>;
};

const fetchEntities = async (reqContext: ReqContext, hierarchy: string, entityCodes: string[]) => {
  const villageOptions: RelationshipsOptions = {
    hierarchy,
    entityCodes,
    queryOptions: {},
    ancestorOptions: { filter: { type: 'village' } },
    descendantOptions: { filter: { type: 'individual' } },
  };

  const islandOptions: RelationshipsOptions = {
    hierarchy,
    entityCodes,
    queryOptions: {},
    ancestorOptions: { field: 'name', filter: { type: 'district' } },
    descendantOptions: { filter: { type: 'individual' } },
  };
  const [villageCodeByIndividualCodes, islandNameByIndividualCodes] = await Promise.all(
    [villageOptions, islandOptions].map(options => getRelationships(reqContext, options)),
  );

  const individualCodes = Object.keys(villageCodeByIndividualCodes);
  const villageCodes = new Set<string>();
  Object.values(villageCodeByIndividualCodes).forEach((code: string) => {
    villageCodes.add(code);
  });
  const includedVillageCodes = [...villageCodes];
  const villageCodesAndNames = (await reqContext.services.entity.getEntities(
    hierarchy,
    includedVillageCodes,
    {
      fields: ['code', 'name'],
    },
  )) as { code: string; name: string }[];
  const individualCodeByVillageNameAndCode: Record<string, { code: string; name: string }> = {};
  Object.keys(villageCodeByIndividualCodes).forEach(individualCode => {
    const villageCode = villageCodeByIndividualCodes[individualCode];
    const villageWithCode = villageCodesAndNames.find(village => village.code === villageCode);

    if (!villageWithCode) {
      throw new Error(`Could not find village with code: ${villageCode}`);
    }

    const { name } = villageWithCode;
    individualCodeByVillageNameAndCode[individualCode] = {
      code: villageCode,
      name,
    };
  });

  return {
    individualCodes,
    villageByIndividual: individualCodeByVillageNameAndCode,
    islandByIndividual: islandNameByIndividualCodes,
  };
};

const fetchEvents = async (
  reqContext: ReqContext,
  entityCodes: string[],
  hierarchy: string,
  startDate?: string,
  endDate?: string,
  period?: string,
) => {
  const registrationOptions = {
    programCode: 'C19T_Registration',
    dataElementCodes: SURVEYS.C19T_Registration.dataElementCodes,
  };
  const resultsOptions = {
    programCode: 'C19T_Results',
    dataElementCodes: SURVEYS.C19T_Results.dataElementCodes,
  };

  const aggregator = new ReportServerAggregator(createAggregator(undefined, reqContext));
  const fetch = async (options: Options) => {
    const { programCode, dataElementCodes } = options;
    return aggregator.fetchEvents(
      programCode,
      undefined,
      entityCodes,
      hierarchy,
      { startDate, endDate, period },
      dataElementCodes,
    );
  };

  const [registrationEvents, resultsEvents] = await Promise.all(
    [registrationOptions, resultsOptions].map(fetch),
  );

  return { registrationEvents, resultsEvents };
};

const combineAndFlatten = (registrationEvents: Event[], resultEvents: Event[]) => {
  const registrationEventsByOrgUnit = keyBy(registrationEvents, 'orgUnit');
  const matchedData: Record<string, any>[] = resultEvents.map(resultEvent => {
    const { dataValues: resultDataValues, orgUnit: resultOrgUnit, eventDate } = resultEvent;
    const matchingRegistration = registrationEventsByOrgUnit[resultEvent.orgUnit];

    if (!matchingRegistration) {
      return {
        orgUnit: resultOrgUnit,
        eventDate,
        ...resultDataValues,
      };
    }
    const { dataValues: registrationDataValues, orgUnit } = matchingRegistration;

    return {
      orgUnit,
      eventDate,
      ...registrationDataValues,
      ...resultDataValues,
    };
  });
  const now = new Date();
  const dataWithUpdatesAndAddOns = matchedData.map(event => {
    const {
      orgUnit,
      C19T033: result,
      C19T042: onsetDate,
      C19T004: dob,
      eventDate: dateSpecimenCollected,
    } = event;

    const age = getAge(dob, now);
    return {
      'Test ID': orgUnit,
      'Estimated Recovery Date': getEstimatedRecoveryDate(result, dateSpecimenCollected, onsetDate),
      dateSpecimenCollected,
      Age: age,
      ...event,
    };
  });

  return dataWithUpdatesAndAddOns;
};

const getAge = (dob: string | undefined, now: Date) => {
  if (!dob) {
    return 'unknown';
  }
  const dobDate = new Date(dob);
  const age = isDate(dobDate) && differenceInYears(now, dobDate);
  return age;
};

const getEstimatedRecoveryDate = (
  result: string,
  collectionDate: string,
  onsetDate: string | undefined,
) => {
  if (result !== 'Positive') {
    return 'Not applicable';
  }

  if (onsetDate) {
    const recoveryDate = addDays(new Date(onsetDate), 13);

    return isDate(recoveryDate) && format(recoveryDate, 'yyy-mm-dd');
  }

  const recoveryDate = addDays(new Date(collectionDate), 13);
  return isDate(recoveryDate) && format(recoveryDate, 'yyyy-mm-dd');
};

const parseRowData = (rowData: Record<string, any>) => {
  const formattedRow: Record<string, any> = {};
  const { codesToNames } = SURVEYS;
  Object.keys(rowData).forEach(fieldKey => {
    switch (fieldKey) {
      case 'dateSpecimenCollected': {
        formattedRow['Date of Test'] = rowData[fieldKey];
        break;
      }
      case 'C19T004': {
        if (!rowData[fieldKey]) {
          formattedRow['Date of Birth'] = 'Unknown';
        }
        const rawDate = new Date(rowData[fieldKey]);
        const dobValue = isDate(rawDate) && format(rawDate, 'yyyy-mm-dd');
        formattedRow['Date of Birth'] = dobValue;
        break;
      }
      case 'Test ID':
      case 'Age':
      case 'Estimated Recovery Date':
        formattedRow[fieldKey] = rowData[fieldKey];
        break;
      default: {
        const name = codesToNames[fieldKey as keyof typeof codesToNames];
        if (!name) {
          formattedRow[fieldKey] = rowData[fieldKey];
        } else {
          formattedRow[name] = rowData[fieldKey];
        }
      }
    }
  });
  return formattedRow;
};

const addVillageAndIsland = (
  rows: Record<string, any>[],
  villageByIndividual: Record<string, { code: string; name: string }>,
  islandByIndividual: Record<string, string>,
) => {
  return rows.map(row => {
    const { orgUnit } = row;
    const { code: villageCode, name: villageName } = villageByIndividual[orgUnit];
    const islandName = islandByIndividual[orgUnit];
    return {
      ...row,
      'Village Code': villageCode,
      Address: villageName,
      'Island Group': islandName,
    };
  });
};

export const tongaCovidRawData = async (reqContext: ReqContext, query: FetchReportQuery) => {
  const { organisationUnitCodes: entityCodes, hierarchy, startDate, endDate, period } = query;

  const { individualCodes, villageByIndividual, islandByIndividual } = await fetchEntities(
    reqContext,
    hierarchy,
    entityCodes,
  );

  const { registrationEvents, resultsEvents } = await fetchEvents(
    reqContext,
    individualCodes,
    hierarchy,
    startDate,
    endDate,
    period,
  );

  const builtEvents: Record<string, any>[] = combineAndFlatten(registrationEvents, resultsEvents);
  const rows = builtEvents.map(rowData => parseRowData(rowData));

  const rowsWithVillageAndIsland = addVillageAndIsland(
    rows,
    villageByIndividual,
    islandByIndividual,
  );

  const columns: Record<string, string>[] = SURVEYS.columns.map(key => {
    return { title: key, key };
  });

  return { columns, rows: rowsWithVillageAndIsland };
};

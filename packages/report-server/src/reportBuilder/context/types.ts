/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export interface Context {
  orgUnits?: { code: string; name: string; id: string, attributes: Record<string, any> }[];
  facilityCountByOrgUnit?: Record<string, number>; // { TO: 14, PG: 9 }
  dataElementCodeToName?: Record<string, string>;
  ancestorVillagesMap?: Record<string, string>;
  ancestorVillages?: { code: string; name: string }[];
  ancestorDistricts?: { code: string; name: string }[];
  ancestorDistrictsMap?: Record<string, string>;
}

export type ContextDependency = keyof Context;

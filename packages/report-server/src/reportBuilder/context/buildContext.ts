/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { MicroServiceRequestContext } from '@tupaia/server-boilerplate';
import { getUniqueEntries } from '@tupaia/utils';

import { FetchResponse } from '../fetch';
import { extractContextProps } from './extractContextProps';
import { Context, ContextProp } from './types';

export type ReqContext = {
  hierarchy: string;
  services: MicroServiceRequestContext['services'];
};

type ContextBuilder<K extends ContextProp> = (
  reqContext: ReqContext,
  data: FetchResponse,
) => Promise<Context[K]>;

const isEventResponse = (data: FetchResponse) => data.results.some(result => 'event' in result);

const buildOrgUnits = async (reqContext: ReqContext, data: FetchResponse) => {
  const orgUnitCodes = isEventResponse(data)
    ? data.results.map(d => d.orgUnit)
    : data.results.map(d => d.organisationUnit);

  return reqContext.services.entity.getEntities(
    reqContext.hierarchy,
    getUniqueEntries(orgUnitCodes),
    { fields: ['code', 'name'] },
  );
};

const buildDataElementCodeToName = async (reqContext: ReqContext, data: FetchResponse) => {
  return data.metadata?.dataElementCodeToName || {};
};

const contextBuilders: Record<ContextProp, ContextBuilder<ContextProp>> = {
  orgUnits: buildOrgUnits,
  dataElementCodeToName: buildDataElementCodeToName,
};

function validateContextProp(key: string): asserts key is keyof typeof contextBuilders {
  if (!(key in contextBuilders)) {
    throw new Error(
      `Invalid context dependency: ${key}, must be one of ${Object.keys(contextBuilders)}`,
    );
  }
}

const setContextValue = <Key extends ContextProp>(
  context: Context,
  key: Key,
  value: Context[Key],
) => {
  context[key] = value;
};

export const buildContext = async (
  transform: unknown,
  reqContext: ReqContext,
  data: FetchResponse,
): Promise<Context> => {
  const contextProps = extractContextProps(transform);

  const context: Context = {};

  for (const key of contextProps) {
    validateContextProp(key);
    setContextValue(context, key, await contextBuilders[key](reqContext, data));
  }

  return context;
};

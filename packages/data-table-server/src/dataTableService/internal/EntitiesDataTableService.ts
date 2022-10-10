/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { yup } from '@tupaia/utils';
import { DataTableService } from '../DataTableService';
import { yupSchemaToDataTableParams } from '../utils';

const paramsSchema = yup.object().shape({
  hierarchy: yup.string().default('explore'),
  entityCodes: yup.array().of(yup.string().required()).required(),
  filter: yup.object(),
  fields: yup.array().of(yup.string().required()).default(['code']),
  includeDescendants: yup.boolean().default(false),
});

const configSchema = yup.object();

type Entity = Record<string, unknown>;

/**
 * DataTableService for pulling data entityApi.getEntities() and entityApi.getDescendantsOfEntities()
 */
export class EntitiesDataTableService extends DataTableService<
  typeof paramsSchema,
  typeof configSchema,
  Entity
> {
  public constructor(apiClient: TupaiaApiClient, config: unknown) {
    super(paramsSchema, configSchema, apiClient, config);
  }

  protected async pullData(params: {
    hierarchy: string;
    entityCodes: string[];
    filter?: Record<string, unknown>;
    fields: string[];
    includeDescendants: boolean;
  }) {
    const { hierarchy, entityCodes, filter, fields, includeDescendants } = params;

    const entities = await this.apiClient.entity.getEntities(hierarchy, entityCodes, {
      fields,
      filter,
    });

    if (!includeDescendants) {
      return entities;
    }

    const descendants = await this.apiClient.entity.getDescendantsOfEntities(
      hierarchy,
      entityCodes,
      {
        fields,
        filter,
      },
    );

    return entities.concat(descendants);
  }

  public getParameters() {
    const {
      hierarchy,
      entityCodes,
      filter,
      fields,
      includeDescendants,
    } = yupSchemaToDataTableParams(paramsSchema);

    return [
      { name: 'hierarchy', config: hierarchy },
      {
        name: 'entityCodes',
        config: entityCodes,
      },
      { name: 'filter', config: filter },
      { name: 'fields', config: fields },
      { name: 'includeDescendants', config: includeDescendants },
    ];
  }
}

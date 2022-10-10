/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { DataTableService } from '../DataTableService';
import { AnalyticsDataTableService } from './AnalyticsDataTableService';
import { EventsDataTableService } from './EventsDataTableService';
import { EntityRelationsDataTableService } from './EntityRelationsDataTableService';
import { EntitiesDataTableService } from './EntitiesDataTableService';

export const internalDataTableServices: Record<
  string,
  new (apiClient: TupaiaApiClient, config: unknown) => DataTableService
> = {
  analytics: AnalyticsDataTableService,
  events: EventsDataTableService,
  entity_relations: EntityRelationsDataTableService,
  entities: EntitiesDataTableService,
};

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { DataTableType as DataTableTypeClass } from '@tupaia/database';
import { createDataTableService } from '../../../dataTableService';
import { DataTableType } from '../../../models';

const entityRelationsDataTable = new DataTableTypeClass(
  {},
  { type: 'internal', code: 'entity_relations' },
) as DataTableType;

describe('EntityRelationsDataTableService', () => {
  describe('parameter validation', () => {
    const testData: [string, unknown, string][] = [
      [
        'missing entityCodes',
        { ancestorType: 'district', descendantType: 'sub_district' },
        'entityCodes is a required field',
      ],
      [
        'missing ancestorType',
        { entityCodes: ['TO'], descendantType: 'sub_district' },
        'ancestorType is a required field',
      ],
      [
        'missing descendantType',
        { entityCodes: ['TO'], ancestorType: 'district' },
        'descendantType is a required field',
      ],
    ];

    it.each(testData)('%s', (_, parameters: unknown, expectedError: string) => {
      const entityRelationsDataTableService = createDataTableService(
        entityRelationsDataTable,
        {} as TupaiaApiClient,
      );

      expect(() => entityRelationsDataTableService.fetchData(parameters)).toThrow(expectedError);
    });
  });

  it('getParameters', () => {
    const entityRelationsDataTableService = createDataTableService(
      entityRelationsDataTable,
      {} as TupaiaApiClient,
    );
    const parameters = entityRelationsDataTableService.getParameters();
    expect(parameters).toEqual([
      { config: { defaultValue: 'explore', type: 'string' }, name: 'hierarchy' },
      {
        config: { innerType: { required: true, type: 'string' }, required: true, type: 'array' },
        name: 'entityCodes',
      },
      { config: { type: 'string', required: true }, name: 'ancestorType' },
      { config: { type: 'string', required: true }, name: 'descendantType' },
    ]);
  });

  describe('fetchData', () => {
    // TODO: Implement these tests when RN-685 is done
    // it('can fetch entities', async () => {});
    // it('can fetch entities and descendants', async () => {});
  });
});

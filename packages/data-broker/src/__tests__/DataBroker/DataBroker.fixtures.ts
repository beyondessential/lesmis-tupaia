/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { DataElement, DataGroup } from '../../types';
import { ServiceResult } from './DataBroker.stubs';

// Data elements and groups share the same codes on purpose, to assert that
// `DataBroker` can still distinguish them using their type
export const DATA_ELEMENTS: Record<string, DataElement> = {
  TEST_01: { code: 'TEST_01', service_type: 'test', config: {}, permission_groups: ['*'] },
  TEST_02: { code: 'TEST_02', service_type: 'test', config: {}, permission_groups: ['*'] },
  OTHER_01: { code: 'OTHER_01', service_type: 'other', config: {}, permission_groups: ['*'] },
};
export const DATA_GROUPS: Record<string, DataGroup> = {
  TEST_01: { code: 'TEST_01', service_type: 'test', config: {} },
  TEST_02: { code: 'TEST_02', service_type: 'test', config: {} },
  OTHER_01: { code: 'OTHER_01', service_type: 'other', config: {} },
};

export const DATA_BY_SERVICE: Record<string, ServiceResult[]> = {
  test: [
    { code: 'TEST_01', type: 'dataElement', name: 'Test element 1', value: 1 },
    { code: 'TEST_01', type: 'dataGroup', name: 'Test group 1', value: 10 },
    { code: 'TEST_02', type: 'dataElement', name: 'Test element 2', value: 2 },
    { code: 'TEST_02', type: 'dataGroup', name: 'Test group 2', value: 20 },
  ],
  other: [
    { code: 'OTHER_01', type: 'dataElement', name: 'Other element 1', value: 3 },
    { code: 'OTHER_01', type: 'dataGroup', name: 'Other group 1', value: 30 },
  ],
};

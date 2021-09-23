/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { Row, PeriodMetadata } from '../types';

export interface FetchResponse extends PeriodMetadata {
  results: Row[];
}

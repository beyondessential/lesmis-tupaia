/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { QueryParameters, ApiConnection, RequestBody } from '@tupaia/server-boilerplate';

const { REPORT_API_URL = 'http://localhost:8030/v2' } = process.env;

export class ReportConnection extends ApiConnection {
  baseUrl = REPORT_API_URL;

  async testReport(query: QueryParameters, body: RequestBody) {
    return this.post('testReport', query, body);
  }
}

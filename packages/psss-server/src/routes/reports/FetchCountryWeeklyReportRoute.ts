/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { Route } from '../Route';

export class FetchCountryWeeklyReportRoute extends Route {
  async buildResponse() {
    const { startWeek, endWeek } = this.req.query;
    const { organisationUnitCode: countryCode } = this.req.params;

    const entityCodes = this.req.useSites
      ? await this.entityConnection.fetchSiteCodes(countryCode)
      : [countryCode];
    const reportData = await this.reportConnection?.fetchReport('PSSS_Weekly_Report', entityCodes, [
      startWeek,
      endWeek,
    ]);

    return {
      startWeek,
      endWeek,
      country: countryCode,
      data: reportData,
    };
  }
}

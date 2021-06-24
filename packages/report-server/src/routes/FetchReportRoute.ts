/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { Request } from 'express';

import { createAggregator } from '@tupaia/aggregator';
import { Route } from '@tupaia/server-boilerplate';

import { Aggregator } from '../aggregator';
import { ReportBuilder, BuiltReport } from '../reportBuilder';
import { ReportType } from '../models';
import { ReportRouteQuery } from './types';

export type FetchReportRequest = Request<{ reportCode: string }, BuiltReport, {}, ReportRouteQuery>;

export class FetchReportRoute extends Route<FetchReportRequest> {
  async findReport() {
    const { models, params } = this.req;
    const { reportCode } = params;
    const report = await models.report.findOne({ code: reportCode });
    if (!report) {
      throw new Error(`No report found with code ${reportCode}`);
    }

    return report;
  }

  async checkUserHasAccessToReport(
    report: ReportType,
    requestedOrgUnitCodes: string[],
    hierarchy: string,
  ) {
    const { accessPolicy, ctx } = this.req;
    const { entityApi } = ctx.microServices;
    const permissionGroupName = await report.permissionGroupName();

    const foundOrgUnits = await entityApi.getEntities(hierarchy, requestedOrgUnitCodes, {
      fields: ['code', 'country_code'],
    });

    const foundOrgUnitCodes = foundOrgUnits.map(orgUnit => orgUnit.code);

    const missingOrgUnitCodes = requestedOrgUnitCodes.filter(
      orgUnitCode => !foundOrgUnitCodes.includes(orgUnitCode),
    );
    if (missingOrgUnitCodes.length > 0) {
      throw new Error(`No entities found with codes ${missingOrgUnitCodes}`);
    }

    const countryCodes = new Set(foundOrgUnits.map(orgUnit => orgUnit.country_code));
    countryCodes.forEach(countryCode => {
      if (countryCode == null || !accessPolicy.allows(countryCode, permissionGroupName)) {
        throw new Error(`No ${permissionGroupName} access for user to ${countryCode}`);
      }
    });
  }

  async buildResponse() {
    const { query, ctx } = this.req;
    const { organisationUnitCodes, hierarchy = 'explore', ...restOfQuery } = query;
    if (!organisationUnitCodes || typeof organisationUnitCodes !== 'string') {
      throw new Error('Must provide organisationUnitCodes URL parameter');
    }
    const report = await this.findReport();

    await this.checkUserHasAccessToReport(report, organisationUnitCodes.split(','), hierarchy);

    const aggregator = createAggregator(Aggregator, ctx);
    return new ReportBuilder()
      .setConfig(report.config)
      .build(aggregator, { organisationUnitCodes, hierarchy, ...restOfQuery });
  }
}

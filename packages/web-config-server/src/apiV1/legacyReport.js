/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import ViewRouteHandler from './view';
import { DashboardItemPermissionChecker } from './permissions';

export default class extends ViewRouteHandler {
  static PermissionsChecker = DashboardItemPermissionChecker;

  fetchReport = async ({ itemCode }) => {
    const dashboardItem = await this.models.dashboardItem.findOne({
      code: itemCode,
      legacy: true,
    });
    if (!dashboardItem) {
      throw new Error(`No dashboard item exists with the code ${itemCode}`);
    }
    const legacyReport = await this.models.legacyReport.findOne({ id: dashboardItem.report_code });
    if (!legacyReport) {
      throw new Error(`No legacy report exists with id ${dashboardItem.report_code}`);
    }
    return {
      viewJson: dashboardItem.config,
      dataBuilder: legacyReport.dataBuilder,
      dataBuilderConfig: legacyReport.dataBuilderConfig,
      dataServices: legacyReport.dataServices,
    };
  };
}
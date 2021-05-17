/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { DatabaseModel } from '../DatabaseModel';
import { DatabaseType } from '../DatabaseType';
import { TYPES } from '../types';

class DashboardItemType extends DatabaseType {
  static databaseType = TYPES.DASHBOARD_ITEM;
}

export class DashboardItemModel extends DatabaseModel {
  get DatabaseTypeClass() {
    return DashboardItemType;
  }

  async fetchItemsInDashboard(dashboardId, userGroups, criteria) {
    return this.find(
      {
        ...criteria,
        dashboard_id: dashboardId,
        permission_groups: {
          comparator: '&&', // User has ANY of the permission groups
          comparisonValue: userGroups,
        },
      },
      {
        joinWith: TYPES.DASHBOARD_RELATION,
        joinCondition: ['child_id', 'dashboard_item.id'],
      },
    );
  }
}

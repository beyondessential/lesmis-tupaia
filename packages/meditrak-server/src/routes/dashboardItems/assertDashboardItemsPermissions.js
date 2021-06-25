/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */
import { hasBESAdminAccess } from '../../permissions';
import { mergeFilter } from '../utilities';
import {
  hasDashboardRelationGetPermissions,
  hasDashboardRelationEditPermissions,
  createDashboardRelationsDBFilter,
} from '../dashboardRelations';

export const hasDashboardItemGetPermissions = async (accessPolicy, models, dashboardItemId) => {
  const dashboards = await models.dashboard.findDashboardsByItemId(dashboardItemId);

  // To view a dashboard item, the user has to have access to the relation between the
  // dashboard item and ANY of the dashboards it is in
  for (const dashboard of dashboards) {
    if (
      await hasDashboardRelationGetPermissions(
        accessPolicy,
        models,
        dashboard.permissionGroups,
        dashboard.rootEntityCode,
      )
    ) {
      return true;
    }
  }

  return false;
};

export const hasDashboardItemEditPermissions = async (accessPolicy, models, dashboardItemId) => {
  const dashboards = await models.dashboard.findDashboardsByItemId([dashboardItemId]);

  // To edit a dashboard item, the user has to have access to the relation between the
  // dashboard item and ALL of the dashboards it is in
  for (const dashboard of dashboards) {
    if (
      !(await hasDashboardRelationEditPermissions(
        accessPolicy,
        models,
        dashboard.permissionGroups,
        dashboard.root_entity_code,
      ))
    ) {
      return false;
    }
  }

  return true;
};

export const assertDashboardItemGetPermissions = async (accessPolicy, models, dashboardItemId) => {
  if (hasDashboardItemGetPermissions(accessPolicy, models, dashboardItemId)) {
    return true;
  }

  throw new Error(
    'Requires access to the dashboard item in one of the dashboards this dashboard item is in',
  );
};

export const assertDashboardItemEditPermissions = async (accessPolicy, models, dashboardItemId) => {
  if (hasDashboardItemEditPermissions(accessPolicy, models, dashboardItemId)) {
    return true;
  }

  throw new Error(
    `Requires access to the dashboard item in all of the dashboards this dashboard item is in, and have Tupaia Admin Panel access to connected dashboard's root_entity_code`,
  );
};

export const createDashboardItemsDBFilter = async (accessPolicy, models, criteria) => {
  if (hasBESAdminAccess(accessPolicy)) {
    return criteria;
  }

  const dbConditions = { ...criteria };

  // Pull the list of dashboard items we have access to, then pull the dashboards
  // we have permission to from that
  const dashboardRelations = createDashboardRelationsDBFilter(accessPolicy);
  const permittedDashboardRelations = await models.dashboardRelation.find(dashboardRelations);
  const permittedDashboardItems = await models.dashboardItem.find({
    id: permittedDashboardRelations.map(dr => dr.child_id),
  });
  const permittedDashboardItemIds = [...new Set(permittedDashboardItems.map(d => d.id))];

  dbConditions['dashboard_item.id'] = mergeFilter(
    permittedDashboardItemIds,
    dbConditions['dashboard_item.id'],
  );

  return dbConditions;
};

/*
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ResourcePage } from './ResourcePage';

const FIELDS = [
  {
    Header: 'Code',
    source: 'code',
    type: 'tooltip',
  },
  {
    Header: 'Name',
    source: 'name',
  },
  {
    Header: 'Organisation Unit Code',
    source: 'root_entity_code',
    editConfig: {
      optionsEndpoint: 'entities',
      optionLabelKey: 'code',
      optionValueKey: 'code',
      sourceKey: 'root_entity_code',
    },
  },
  {
    Header: 'Sort Order',
    source: 'sort_order',
  },
];

const COLUMNS = [
  ...FIELDS,
  {
    Header: 'Edit',
    type: 'edit',
    source: 'id',
    actionConfig: {
      editEndpoint: 'dashboards',
      fields: [...FIELDS],
    },
  },
];

const RELATION_FIELDS = [
  {
    Header: 'Dashboard Item Code',
    source: 'dashboard_item.code',
    editConfig: {
      optionsEndpoint: 'dashboardItems',
      optionLabelKey: 'code',
      optionValueKey: 'code',
      sourceKey: 'code',
    },
  },
  {
    Header: 'Permission Groups',
    source: 'permission_groups',
    editConfig: {
      optionsEndpoint: 'permissionGroups',
      optionLabelKey: 'name',
      optionValueKey: 'name',
      sourceKey: 'permission_groups',
      allowMultipleValues: true,
    },
  },
  {
    Header: 'Entity Types',
    source: 'entity_types',
  },
  {
    Header: 'Project Codes',
    source: 'project_codes',
    editConfig: {
      optionsEndpoint: 'projects',
      optionLabelKey: 'code',
      optionValueKey: 'code',
      sourceKey: 'projectCodes',
      allowMultipleValues: true,
    },
  },
  {
    Header: 'Sort Order',
    source: 'sort_order',
  },
];

export const ANSWER_COLUMNS = [
  ...RELATION_FIELDS,
  {
    Header: 'Edit',
    type: 'edit',
    source: 'id',
    actionConfig: {
      editEndpoint: 'dashboardRelations',
      fields: RELATION_FIELDS,
    },
  },
];

const EXPANSION_CONFIG = [
  {
    title: 'Dashboard Relations',
    columns: ANSWER_COLUMNS,
    endpoint: 'dashboards/{id}/dashboardRelations',
  },
];

export const DashboardsPage = ({ getHeaderEl }) => (
  <ResourcePage
    title="Dashboards"
    endpoint="dashboards"
    columns={COLUMNS}
    expansionTabs={EXPANSION_CONFIG}
    editConfig={{
      title: 'Edit Dashboard',
    }}
    getHeaderEl={getHeaderEl}
  />
);

DashboardsPage.propTypes = {
  getHeaderEl: PropTypes.func.isRequired,
};

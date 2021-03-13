'use strict';

import { insertObject } from '../utilities/migration';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const REPORT_ID = 'Laos_EOC_Malaria_Stock_Availability';

const DATA_BUILDER_CONFIG = {
  rows: [
    {
      rows: ['ACT 6x1 (Coartem)', 'ACT 6x2 (Coartem)', 'ACT 6x3 (Coartem)', 'ACT 6x4 (Coartem)'],
      category: 'ACT',
    },
    {
      rows: ['G6PD RDT'],
      category: 'G6PD',
    },
    {
      rows: ['ORS (Closing stock)'],
      category: 'ORS',
    },
    {
      rows: ['Primaquine 15 mg', 'Primaquine 7.5 mg'],
      category: 'Primaquine',
    },
    {
      rows: ['Malaria Rapid Diagnostic Test (RDT)'],
      category: 'RDT',
    },
    {
      rows: ['Artesunate 60mg'],
      category: 'Artesunate',
    },
    {
      rows: ['Paracetamol'],
      category: 'Paracetamol',
    },
  ],
  cells: [
    'MAL_ACT_6x1',
    'MAL_ACT_6x2',
    'MAL_ACT_6x3',
    'MAL_ACT_6x4',
    'MAL_G6PD_RDT',
    'MAL_ORS',
    'MAL_Primaquine_15_mg',
    'MAL_Primaquine_7_5_mg',
    'MAL_RDT',
    'MAL_Artesunate',
    'MAL_Paracetamol',
  ],
  columns: '$orgUnit',
  entityAggregation: {
    dataSourceEntityType: 'facility',
  },
};

const VIEW_JSON = {
  name: 'Malaria Stock Availability',
  type: 'matrix',
  placeholder: '/static/media/PEHSMatrixPlaceholder.png',
  presentationOptions: {
    type: 'condition',
    conditions: [
      {
        key: 'red',
        color: '#b71c1c',
        label: '',
        condition: 0,
        description: 'Stock number: ',
        legendLabel: 'Stock out',
      },
      {
        key: 'green',
        color: '#33691e',
        label: '',
        condition: {
          '>': 0,
        },
        description: 'Stock number: ',
        legendLabel: 'In stock',
      },
    ],
    showRawValue: true,
  },
  periodGranularity: 'one_month_at_a_time',
};

const REPORT = {
  id: REPORT_ID,
  dataBuilder: 'tableOfValuesForOrgUnits',
  dataBuilderConfig: DATA_BUILDER_CONFIG,
  viewJson: VIEW_JSON,
  dataServices: [{ isDataRegional: false }],
};

const DASHBOARD_GROUP = {
  organisationLevel: 'SubDistrict',
  userGroup: 'Laos EOC User',
  organisationUnitCode: 'LA',
  dashboardReports: `{${REPORT.id}}`,
  name: 'Dengue',
  code: 'LAOS_EOC_Malaria_Sub_District',
  projectCodes: '{laos_eoc}',
};

exports.up = async function (db) {
  await insertObject(db, 'dashboardReport', REPORT);
  await insertObject(db, 'dashboardGroup', DASHBOARD_GROUP);
};

exports.down = function (db) {
  return db.runSql(`
    DELETE FROM "dashboardReport" WHERE id = '${REPORT.id}';
    DELETE FROM "dashboardGroup" WHERE code = '${DASHBOARD_GROUP.code}';
  `);
};

exports._meta = {
  version: 1,
};

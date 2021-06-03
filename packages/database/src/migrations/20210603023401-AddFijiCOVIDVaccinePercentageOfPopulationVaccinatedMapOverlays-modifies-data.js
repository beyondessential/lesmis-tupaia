'use strict';

import { insertObject, generateId, codeToId } from '../utilities';

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

const getOverlayId = (doseNum, level) =>
  `FJ_COVID_TRACKING_Dose_${doseNum}_${level}_Percentage_Vaccinated`;

const createMapOverlay = (doseNum, aggregationEntityType, level, overlayLevelName) => {
  const numeratorDataElementCode = doseNum === 1 ? 'COVIDVac4' : 'COVIDVac8';
  const denominatorAggregationEntityType =
    aggregationEntityType === 'sub_district' ? undefined : aggregationEntityType;
  const denominatorAggregationType =
    aggregationEntityType === 'sub_district' ? undefined : 'SUM_PER_ORG_GROUP';

  return {
    id: getOverlayId(doseNum, level),
    name: `% of Population Vaccinated COVID-19 Dose ${doseNum} (${overlayLevelName})`,
    userGroup: 'COVID-19',
    dataElementCode: 'value',
    measureBuilderConfig: {
      dataSourceType: 'custom',
      measureBuilders: {
        numerator: {
          measureBuilder: 'sumAllPerOrgUnit',
          measureBuilderConfig: {
            aggregations: [
              {
                type: 'FINAL_EACH_DAY',
              },
            ],
            dataElementCodes: [numeratorDataElementCode],
            entityAggregation: {
              dataSourceEntityType: 'facility',
              aggregationEntityType,
            },
          },
        },
        denominator: {
          measureBuilder: 'sumLatestPerOrgUnit',
          measureBuilderConfig: {
            dataElementCodes: ['population_FJ001'],
            entityAggregation: {
              dataSourceEntityType: 'sub_district',
              aggregationType: denominatorAggregationType,
              aggregationEntityType: denominatorAggregationEntityType,
            },
          },
        },
      },
    },
    measureBuilder: 'sumAllPerOrgUnit',
    presentationOptions: {
      scaleType: 'neutral',
      scaleColorScheme: 'default-reverse',
      displayType: 'shaded-spectrum',
      scaleBounds: {
        left: {
          min: 0,
          max: 0,
        },
      },
      measureLevel: level,
      hideByDefault: {
        null: true,
      },
    },
    countryCodes: '{FJ}',
    projectCodes: '{supplychain_fiji}',
  };
};

const insertOverlay = async (db, overlay, mapOverlayGroupId) => {
  await insertObject(db, 'mapOverlay', overlay);
  await insertObject(db, 'map_overlay_group_relation', {
    id: generateId(),
    map_overlay_group_id: mapOverlayGroupId,
    child_id: overlay.id,
    child_type: 'mapOverlay',
  });
};

const deleteOverlay = async (db, overlayId) => {
  return db.runSql(`
    delete from "mapOverlay" where "id" = '${overlayId}';
    delete from "map_overlay_group_relation" where "child_id" = '${overlayId}';
  `);
};

exports.up = async function (db) {
  const mapOverlayGroupId = await codeToId(db, 'map_overlay_group', 'COVID19_Vaccine_Fiji');

  await insertOverlay(
    db,
    createMapOverlay(1, 'sub_district', 'SubDistrict', 'Sub-Division'),
    mapOverlayGroupId,
  );
  await insertOverlay(
    db,
    createMapOverlay(1, 'district', 'District', 'Division'),
    mapOverlayGroupId,
  );
  await insertOverlay(
    db,
    createMapOverlay(2, 'sub_district', 'SubDistrict', 'Sub-Division'),
    mapOverlayGroupId,
  );
  await insertOverlay(
    db,
    createMapOverlay(2, 'district', 'District', 'Division'),
    mapOverlayGroupId,
  );
};

exports.down = async function (db) {
  await deleteOverlay(db, getOverlayId(1, 'SubDistrict'));
  await deleteOverlay(db, getOverlayId(1, 'District'));
  await deleteOverlay(db, getOverlayId(2, 'SubDistrict'));
  await deleteOverlay(db, getOverlayId(2, 'District'));
};

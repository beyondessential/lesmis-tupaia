'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const mapOverlayId = 'COVID_AU_HOSPITALS_AND_TESTING_SITES';
const defaultMapOverlayId = 'COVID_AU_State_Total_Number_Confirmed_Cases';

exports.up = function(db) {
  return db.runSql(`
    UPDATE "mapOverlay" SET "sortOrder" = 1 WHERE id = '${mapOverlayId}';
    UPDATE "project" SET "default_measure" = '${defaultMapOverlayId}' WHERE "code" = 'covidau'; 
  `);
};

exports.down = function(db) {
  return db.runSql(`
    UPDATE "mapOverlay" SET "sortOrder" = 0 WHERE id = '${mapOverlayId}'; 
    UPDATE "project" SET "default_measure" = '126,171' WHERE "code" = 'covidau';
  `);
};

exports._meta = {
  version: 1,
};

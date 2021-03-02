'use strict';

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

exports.up = async function (db) {
  await db.runSql(`
    UPDATE indicator
    SET builder = 'analyticArithmetic'
    WHERE builder = 'arithmetic';
  `);
};

exports.down = async function (db) {
  await db.runSql(`
    UPDATE indicator
    SET builder = 'arithmetic'
    WHERE builder = 'analyticArithmetic';
  `);
};

exports._meta = {
  version: 1,
};

'use strict';

import { TupaiaDatabase } from '../TupaiaDatabase';

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

exports.up = async function () {
  const db = new TupaiaDatabase();
  await db.executeSql(`
    ALTER TYPE public.entity_type ADD VALUE 'medical_area';
  `);
  await db.executeSql(`
  ALTER TYPE public.entity_type ADD VALUE 'nursing_zone';
`);
  return db.closeConnections();
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};

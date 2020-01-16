/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import DBMigrate from 'db-migrate';
import {} from 'dotenv/config'; // Load the environment variables into process.env
import { constructMigratorCallback } from './constructMigratorCallback';
import { getConnectionConfig } from './getConnectionConfig';

const exitWithError = error => {
  console.error(`Migration error: ${error.message}`);
  process.exit(1);
};

const migrationInstance = DBMigrate.getInstance(
  true,
  {
    cwd: `${__dirname}/migrations`,
    config: {
      defaultEnv: 'tupaia',
      tupaia: {
        driver: 'pg',
        ...getConnectionConfig(),
      },
    },
  },
  async migrator => {
    const { driver } = migrator;
    const callback = constructMigratorCallback(driver);

    try {
      await callback();
      console.log('Migration complete');
    } catch (error) {
      exitWithError(error);
    }
  },
);

try {
  migrationInstance.run();
} catch (error) {
  exitWithError(error);
}

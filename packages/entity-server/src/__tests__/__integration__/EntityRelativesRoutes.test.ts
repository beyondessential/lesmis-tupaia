/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { TestableEntityServer, setupTestApp } from '../testUtilities';
import { getEntitiesWithFields, sortedByCode, COUNTRIES } from './fixtures';

describe('relatives', () => {
  let app: TestableEntityServer;

  beforeAll(async () => {
    app = await setupTestApp();
    app.grantAccessToCountries(COUNTRIES);
  });

  afterAll(() => app.revokeAccess());

  describe('/hierarchy/<hierarchyName>/<entityCode>/relatives', () => {
    it('can fetch relatives an entity', async () => {
      const { text } = await app.get('hierarchy/redblue/LAVENDER/relatives', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(['KANTO', 'LAVENDER', 'PKMN_TOWER'], ['code', 'name', 'type']),
        ),
      );
    });

    it('can fetch descendants of a alternate project entity', async () => {
      const { text } = await app.get('hierarchy/goldsilver/LAVENDER/relatives', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            ['KANTO', 'LAVENDER', 'LAVENDER_RADIO_TOWER'],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });
  });

  describe('/hierarchy/<hierarchyName>/relatives', () => {
    it('can fetch relatives of multiple entities', async () => {
      const { text } = await app.post('hierarchy/redblue/relatives', {
        query: { fields: 'code,name,type' },
        body: { entities: ['CINNABAR', 'CELADON', 'LAVENDER'] },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            [
              'KANTO',
              'CINNABAR',
              'CELADON',
              'LAVENDER',
              'CELADON_GAME',
              'PKMN_MANSION',
              'PKMN_TOWER',
            ],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });

    it('can fetch relatives of multiple entities for an alternate hierarchy', async () => {
      const { text } = await app.post('hierarchy/goldsilver/relatives', {
        query: { fields: 'code,name,type' },
        body: { entities: ['CINNABAR', 'CELADON', 'LAVENDER', 'ECRUTEAK'] },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            [
              'KANTO',
              'JOHTO',
              'CINNABAR',
              'CELADON',
              'LAVENDER',
              'ECRUTEAK',
              'CELADON_GAME',
              'LAVENDER_RADIO_TOWER',
              'BELL_TOWER',
              'BURNED_TOWER',
            ],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });
  });
});

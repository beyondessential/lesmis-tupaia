/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { TestableEntityServer, setupTestApp } from '../testUtilities';
import { getEntitiesWithFields, sortedByCode, COUNTRIES } from './fixtures';

describe('descendants', () => {
  let app: TestableEntityServer;

  beforeAll(async () => {
    app = await setupTestApp();
    app.grantAccessToCountries(COUNTRIES);
  });

  afterAll(() => app.revokeAccess());

  describe('/hierarchy/<hierarchyName>/<entityCode>/descendants', () => {
    it('can include the root entity', async () => {
      const { text } = await app.get('hierarchy/redblue/LAVENDER/descendants', {
        query: { fields: 'code,name,type', includeRootEntity: 'true' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(getEntitiesWithFields(['LAVENDER', 'PKMN_TOWER'], ['code', 'name', 'type'])),
      );
    });

    it('can fetch descendants of a project entity', async () => {
      const { text } = await app.get('hierarchy/redblue/redblue/descendants', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            [
              'KANTO',
              'PALLET',
              'BLUE',
              'VIRIDIAN',
              'PEWTER',
              'CERULEAN',
              'CERULEAN_CAVE',
              'VERMILLION',
              'LAVENDER',
              'PKMN_TOWER',
              'CELADON',
              'CELADON_GAME',
              'FUCHSIA',
              'SAFARI',
              'SAFFRON',
              'SILPH',
              'CINNABAR',
              'PKMN_MANSION',
            ],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });

    it('can fetch descendants of a alternate project entity', async () => {
      const { text } = await app.get('hierarchy/goldsilver/goldsilver/descendants', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            [
              'SPROUT_TOWER',
              'OLIVINE_LIGHTHOUSE',
              'LAVENDER_RADIO_TOWER',
              'CELADON_GAME',
              'SLOWPOKE_WELL',
              'DRAGONS_DEN',
              'BELL_TOWER',
              'CERULEAN_CAVE',
              'BURNED_TOWER',
              'GOLDENROD',
              'NEWBARK',
              'VERMILLION',
              'MAHOGANY',
              'CHERRYGROVE',
              'VIOLET',
              'CIANWOOD',
              'CELADON',
              'AZALEA',
              'BLACKTHORN',
              'PALLET',
              'SAFFRON',
              'ECRUTEAK',
              'PEWTER',
              'OLIVINE',
              'CERULEAN',
              'SILPH',
              'VIRIDIAN',
              'BLUE',
              'FUCHSIA',
              'LAVENDER',
              'KANTO',
              'JOHTO',
            ],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });

    it('can fetch descendants of a country entity', async () => {
      const { text } = await app.get('hierarchy/redblue/KANTO/descendants', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            [
              'PALLET',
              'BLUE',
              'VIRIDIAN',
              'PEWTER',
              'CERULEAN',
              'CERULEAN_CAVE',
              'VERMILLION',
              'LAVENDER',
              'PKMN_TOWER',
              'CELADON',
              'CELADON_GAME',
              'FUCHSIA',
              'SAFARI',
              'SAFFRON',
              'SILPH',
              'CINNABAR',
              'PKMN_MANSION',
            ],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });

    it('can fetch descendants of a city entity', async () => {
      const { text } = await app.get('hierarchy/redblue/CELADON/descendants', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(getEntitiesWithFields(['CELADON_GAME'], ['code', 'name', 'type'])),
      );
    });

    it('can fetch descendants of a facility entity', async () => {
      const { text } = await app.get('hierarchy/redblue/CELADON_GAME/descendants', {
        query: { fields: 'code,name,type' },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(getEntitiesWithFields([], ['code', 'name', 'type'])),
      );
    });
  });

  describe('/hierarchy/<hierarchyName>/descendants', () => {
    it('can fetch descendants of multiple entities', async () => {
      const { text } = await app.post('hierarchy/redblue/descendants', {
        query: { fields: 'code,name,type' },
        body: { entities: ['CINNABAR', 'CELADON', 'LAVENDER'] },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            ['CELADON_GAME', 'PKMN_MANSION', 'PKMN_TOWER'],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });

    it('can fetch descendants of multiple entities for an alternate hierarchy', async () => {
      const { text } = await app.post('hierarchy/goldsilver/descendants', {
        query: { fields: 'code,name,type' },
        body: { entities: ['CINNABAR', 'CELADON', 'LAVENDER', 'ECRUTEAK'] },
      });

      const entities = JSON.parse(text);
      expect(sortedByCode(entities)).toEqual(
        sortedByCode(
          getEntitiesWithFields(
            ['CELADON_GAME', 'LAVENDER_RADIO_TOWER', 'BELL_TOWER', 'BURNED_TOWER'],
            ['code', 'name', 'type'],
          ),
        ),
      );
    });
  });
});

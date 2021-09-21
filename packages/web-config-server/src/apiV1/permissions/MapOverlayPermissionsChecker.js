/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { PermissionsError } from '@tupaia/utils';
import { PermissionsChecker } from './PermissionsChecker';

export class MapOverlayPermissionsChecker extends PermissionsChecker {
  getMapOverlayIds() {
    const { mapOverlayIds } = this.query;
    if (!mapOverlayIds) {
      throw new Error('No map overlay id was provided');
    }
    return mapOverlayIds.split(',');
  }

  async fetchAndCacheOverlays() {
    if (!this.overlays) {
      this.overlays = await this.models.mapOverlay.find({ id: this.getMapOverlayIds() });
    }
    return this.overlays;
  }

  async fetchPermissionGroups() {
    const overlays = await this.fetchAndCacheOverlays();
    return overlays.map(o => o.userGroup);
  }

  async checkPermissions() {
    // run standard permission checks against entity
    await super.checkPermissions();

    // get measure by id from db, check it matches user permissions
    if (this.entity.getOrganisationLevel() === 'World') {
      throw new PermissionsError('Measures data not allowed for world');
    }

    const overlays = await this.fetchAndCacheOverlays();
    if (overlays.length !== this.getMapOverlayIds().length) {
      throw new Error('Not all overlays requested could be found in the database');
    }

    await this.checkHasEntityAccess(this.entity.code);
  }
}

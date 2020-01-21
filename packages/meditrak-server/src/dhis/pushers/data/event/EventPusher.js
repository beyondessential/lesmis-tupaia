/**
 * Tupaia MediTrak
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd
 */
import { EventBuilder } from './EventBuilder';

import { DataPusher } from '../DataPusher';

export class EventPusher extends DataPusher {
  /**
   * @returns {Promise<PushResults>}
   */
  async createOrUpdate() {
    await this.delete(); // delete any existing record from dhis2, as events can't handle update
    const surveyResponse = await this.models.surveyResponse.findById(this.recordId);
    if (!surveyResponse) {
      throw new Error(`No survey response found for ${this.recordId}`);
    }

    let data;
    try {
      data = await new EventBuilder(this.api, this.models, surveyResponse).build();
    } catch (error) {
      return { wasSuccessful: false, errors: [error.message] };
    }

    const survey = await surveyResponse.survey();
    const { serverName, ...diagnostics } = await this.dataBroker.push(
      { type: this.dataBroker.dataSourceTypes.survey, code: survey.code },
      data,
    );
    // If any errors or ignored, mark this push as a failure so it is reattempted
    const { wasSuccessful, errors = [], counts = {} } = diagnostics;
    const wasFullySuccessful = wasSuccessful && errors.length === 0 && counts.ignored === 0;

    return {
      ...diagnostics,
      wasSuccessful: wasFullySuccessful,
      data: { ...data, serverName: this.api.getServerName() },
    };
  }

  /**
   * @returns {Promise<PushResults>}
   */
  async delete() {
    const syncLogRecord = await this.fetchSyncLogRecord();
    if (!this.checkExistsOnDhis2(syncLogRecord)) {
      // if it doesn't exist on DHIS, don't worry about attempting to delete
      return { wasSuccessful: true };
    }

    const { serverName, dhis_reference: dhisReference } = this.extractDataFromSyncLog(
      syncLogRecord,
    );
    if (!dhisReference) {
      throw new Error(`No reference for record ${this.recordId}`);
    }
    const diagnostics = await this.dataBroker.deleteEvent({ dhisReference }, serverName);
    return { ...diagnostics, dhisReference: null };
  }
}

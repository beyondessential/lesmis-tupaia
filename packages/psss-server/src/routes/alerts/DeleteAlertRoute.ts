/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { RespondingError, UnauthenticatedError } from '@tupaia/utils';
import { Route } from '../Route';

export class DeleteAlertRoute extends Route {
  async buildResponse() {
    if (!this.meditrakConnection) throw new UnauthenticatedError('Unauthenticated');

    const { alertId } = this.req.params;

    // Just to validate if the alert exists
    const surveyResponse = await this.meditrakConnection.findSurveyResponseById(alertId);

    if (!surveyResponse) {
      throw new RespondingError('Alert cannot be found', 500);
    }

    return this.meditrakConnection.deleteSurveyResponse(surveyResponse.id);
  }
}

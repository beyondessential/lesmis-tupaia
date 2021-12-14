/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Request, Response, NextFunction } from 'express';
import { Route } from '@tupaia/server-boilerplate';
import { sleep } from '@tupaia/utils';
import { MeditrakConnection } from '../connections';

export type ApproveSurveyResponseRequest = Request<{ id: string }, any, any, any>;

export class ApproveSurveyResponse extends Route<ApproveSurveyResponseRequest> {
  private readonly meditrakConnection: MeditrakConnection;

  constructor(req: ApproveSurveyResponseRequest, res: Response, next: NextFunction) {
    super(req, res, next);

    this.meditrakConnection = new MeditrakConnection(req.session);
  }

  async buildResponse() {
    const { id } = this.req.params;
    console.log('Approve Survey Response. Id: ', id);
    await sleep(2000);
    return true;
  }
}

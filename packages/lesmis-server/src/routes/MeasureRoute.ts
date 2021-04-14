/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */

import { Request, Response, NextFunction } from 'express';
import { Route } from '@tupaia/server-boilerplate';
import { WebConfigConnection } from '../connections';
import { LESMIS_PROJECT_NAME } from '../constants';

export type MeasuresRequest = Request<{ entityCode: string }>;
export class MeasuresRoute extends Route<MeasuresRequest> {
  private readonly webConfigConnection: WebConfigConnection;

  constructor(req: MeasuresRequest, res: Response, next: NextFunction) {
    super(req, res, next);

    this.webConfigConnection = new WebConfigConnection(req.session);
  }

  async buildResponse() {
    const { entityCode } = this.req.params;
    return this.webConfigConnection.fetchMeasures({
      organisationUnitCode: entityCode,
      projectCode: LESMIS_PROJECT_NAME,
    });
  }
}

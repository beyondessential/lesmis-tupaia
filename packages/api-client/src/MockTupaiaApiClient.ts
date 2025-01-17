/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import {
  AuthApiInterface,
  CentralApiInterface,
  EntityApiInterface,
  ReportApiInterface,
} from './connections';

import { MockAuthApi, MockCentralApi, MockEntityApi, MockReportApi } from './connections/mocks';

export class MockTupaiaApiClient {
  public readonly entity: EntityApiInterface;
  public readonly central: CentralApiInterface;
  public readonly auth: AuthApiInterface;
  public readonly report: ReportApiInterface;

  public constructor({
    auth = new MockAuthApi(),
    central = new MockCentralApi(),
    entity = new MockEntityApi(),
    report = new MockReportApi(),
  }) {
    this.auth = auth;
    this.central = central;
    this.entity = entity;
    this.report = report;
  }
}

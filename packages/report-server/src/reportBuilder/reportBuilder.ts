/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { StandardOrCustomReportConfig } from '../types';
import { configValidator } from './configValidator';
import { buildContext, ReqContext } from './context';
import { buildTransform } from './transform';
import { buildOutput } from './output';
import { Row } from './types';
import { OutputType } from './output/functions/outputBuilders';
import { CustomReportOutputType, customReports } from './customReports';

export interface BuiltReport {
  results: OutputType | CustomReportOutputType;
}

export class ReportBuilder {
  private readonly reqContext: ReqContext;
  private config?: StandardOrCustomReportConfig;
  private testData?: Row[];

  public constructor(reqContext: ReqContext) {
    this.reqContext = reqContext;
  }

  public setConfig = (config: Record<string, unknown>) => {
    this.config = configValidator.validateSync(config);
    return this;
  };

  public setTestData = (testData: Row[]) => {
    this.testData = testData;
    return this;
  };

  public build = async (): Promise<BuiltReport> => {
    if (!this.config) {
      throw new Error('Report requires a config be set');
    }

    if ('customReport' in this.config) {
      const customReportBuilder = customReports[this.config.customReport];
      if (!customReportBuilder) {
        throw new Error(`Custom report ${this.config.customReport} does not exist`);
      }

      const customReportData = await customReportBuilder(this.reqContext);
      return { results: customReportData };
    }

    const data = this.testData || [];

    const context = await buildContext(this.config.transform, this.reqContext);
    const transform = buildTransform(this.config.transform, context);
    const transformedData = transform(data);

    const outputContext = { ...this.config.fetch };
    const output = buildOutput(this.config.output, outputContext, this.reqContext.aggregator);
    const outputData = await output(transformedData);

    return { results: outputData };
  };
}

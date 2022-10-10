/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { yup } from '@tupaia/utils';
import { DataTableParameter } from './types';

export abstract class DataTableService<
  ParamsSchema extends yup.AnyObjectSchema = yup.AnyObjectSchema,
  ConfigSchema extends yup.AnyObjectSchema = yup.AnyObjectSchema,
  RecordSchema = unknown
> {
  protected readonly paramsSchema: ParamsSchema;
  protected readonly configSchema: ConfigSchema;
  protected readonly apiClient: TupaiaApiClient;
  protected readonly config: yup.InferType<ConfigSchema>;

  protected constructor(
    paramsSchema: ParamsSchema,
    configSchema: ConfigSchema,
    apiClient: TupaiaApiClient,
    config: unknown,
  ) {
    this.paramsSchema = paramsSchema;
    this.configSchema = configSchema;
    this.apiClient = apiClient;
    this.config = this.configSchema.validateSync(config);
  }

  protected validateParams(params: unknown) {
    return this.paramsSchema.validateSync(params);
  }

  /**
   * Implement in concrete class
   */
  protected abstract pullData(params: yup.InferType<ParamsSchema>): Promise<RecordSchema[]>;

  public fetchData(params: unknown) {
    const validatedParams = this.validateParams(params);
    return this.pullData(validatedParams);
  }

  public abstract getParameters(): DataTableParameter[];
}

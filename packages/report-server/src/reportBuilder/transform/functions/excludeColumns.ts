/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { TransformParser } from '../parser';
import { buildWhere } from './where';
import { starSingleOrMultipleColumnsValidator } from './transformValidators';
import { getColumnMatcher } from './helpers';
import { TransformTable } from '../table';

type ExcludeColumnsParams = {
  shouldIncludeColumn: (field: string) => boolean;
  where: (parser: TransformParser) => boolean;
};

export const paramsValidator = yup.object().shape({
  columns: starSingleOrMultipleColumnsValidator,
  where: yup.string(),
});

const excludeColumns = (table: TransformTable, params: ExcludeColumnsParams) => {
  const columnsToDelete = table
    .getColumns()
    .filter(columnName => !params.shouldIncludeColumn(columnName));
  return table.dropColumns(columnsToDelete);
};

const buildParams = (params: unknown): ExcludeColumnsParams => {
  const { columns } = paramsValidator.validateSync(params);
  if (!columns) {
    throw new Error('columns must be defined');
  }

  const columnMatcher = getColumnMatcher(columns);
  const shouldIncludeColumn = (column: string) => !columnMatcher(column);

  return { shouldIncludeColumn, where: buildWhere(params) };
};

export const buildExcludeColumns = (params: unknown) => {
  const builtParams = buildParams(params);
  return (table: TransformTable) => excludeColumns(table, builtParams);
};

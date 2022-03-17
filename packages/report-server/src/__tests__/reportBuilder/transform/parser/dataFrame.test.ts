/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { buildTransform } from '../../../../reportBuilder/transform';

const TABLE = [
  { name: 'Bob', afr_cases: 3, ili_cases: 12, dia_cases: 23 },
  { name: 'Cat', afr_cases: 0, ili_cases: 2, dia_cases: 34 },
  { name: 'Gill', afr_cases: 4, ili_cases: 7, dia_cases: 13 },
];

describe('dataFrame', () => {
  it('can add a total column', () => {
    const transform = buildTransform([
      {
        transform: 'insertColumns',
        columns: {
          total_cases: "= sum(@table.row(@index).columns(@columnNames - 'name'))",
        },
      },
    ]);
    expect(transform(TABLE)).toStrictEqual([
      { name: 'Bob', afr_cases: 3, ili_cases: 12, dia_cases: 23, total_cases: 38 },
      { name: 'Cat', afr_cases: 0, ili_cases: 2, dia_cases: 34, total_cases: 36 },
      { name: 'Gill', afr_cases: 4, ili_cases: 7, dia_cases: 13, total_cases: 24 },
    ]);
  });

  it('can add a total row', () => {
    const transform = buildTransform([
      {
        transform: 'insertRows',
        columns: {
          name: 'Total',
          "= @columnNames - 'name'": '= sum(@table.column(@columnName))',
        },
        where: '= @index == length(@table)',
      },
    ]);
    expect(transform(TABLE)).toStrictEqual([
      { name: 'Bob', afr_cases: 3, ili_cases: 12, dia_cases: 23 },
      { name: 'Cat', afr_cases: 0, ili_cases: 2, dia_cases: 34 },
      { name: 'Gill', afr_cases: 4, ili_cases: 7, dia_cases: 13 },
      { name: 'Total', afr_cases: 7, ili_cases: 21, dia_cases: 70 },
    ]);
  });

  it('can add a grand total', () => {
    const transform = buildTransform([
      {
        transform: 'insertRows',
        columns: {
          name: 'Grand Total',
          grand_total: "= sum(@table.columns(@columnNames - 'name'))",
        },
        where: '= @index == length(@table)',
      },
    ]);
    expect(transform(TABLE)).toStrictEqual([
      { name: 'Bob', afr_cases: 3, ili_cases: 12, dia_cases: 23 },
      { name: 'Cat', afr_cases: 0, ili_cases: 2, dia_cases: 34 },
      { name: 'Gill', afr_cases: 4, ili_cases: 7, dia_cases: 13 },
      { name: 'Grand Total', grand_total: 98 },
    ]);
  });
});

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import groupBy from 'lodash.groupby';
import { periodToType } from '@tupaia/utils';
import { DataFetchQuery, ANSWER_SPECIFIC_FIELDS } from './DataFetchQuery';

/**
 *
 * @param {string} periodString
 * @returns {[string, string[]][]} [periodField, periods[]], eg. [['day_period', ['20210101', '20210102']], ['week_period', ['2021W02', '2021W03']], ...]
 */
const convertPeriodStringIntoWhereClauseParts = periodString => {
  const individualPeriods = periodString
    .split(';') // Split into parts
    .map(periodStringPart => periodStringPart.split(',')) // split periods in parts
    .flat();
  return Object.entries(groupBy(individualPeriods, periodToType)).map(([periodType, periods]) => [
    `${periodType.toLowerCase()}_period`,
    periods,
  ]);
};

const AGGREGATION_SWITCHES = {
  FINAL_EACH_DAY: {
    groupByPeriodField: 'day_period',
    getLatestPerPeriod: true,
  },
  FINAL_EACH_WEEK: {
    groupByPeriodField: 'week_period',
    getLatestPerPeriod: true,
  },
  FINAL_EACH_MONTH: {
    groupByPeriodField: 'month_period',
    getLatestPerPeriod: true,
  },
  FINAL_EACH_YEAR: {
    groupByPeriodField: 'year_period',
    getLatestPerPeriod: true,
  },
  MOST_RECENT: {
    getLatestPerPeriod: true,
  },
  MOST_RECENT_PER_ORG_GROUP: {
    getLatestPerPeriod: true,
    aggregateEntities: true,
  },
  SUM_PER_ORG_GROUP: {
    sum: true,
    aggregateEntities: true,
  },
  SUM_PER_PERIOD_PER_ORG_GROUP: {
    sum: true,
    aggregateEntities: true,
    groupByPeriodField: 'day_period', // can assume first internal aggregation period type is daily
  },
};

export class AnalyticsFetchQuery extends DataFetchQuery {
  constructor(database, options) {
    super(database, options);

    const firstAggregation = options.aggregations?.[0];
    this.aggregation = { type: firstAggregation?.type };
    this.aggregation.switches = AGGREGATION_SWITCHES[firstAggregation?.type]; // add internal switches
    this.aggregation.config = firstAggregation?.config; // add external config, supplied by client
    this.isAggregating = !!this.aggregation.switches;

    this.validate();
  }

  validate() {
    if (this.aggregation.switches?.aggregateEntities && !this.aggregation.config?.orgUnitMap) {
      throw new Error('When using entity aggregation you must provide an org unit map');
    }
  }

  getEntityCodeField() {
    return this.aggregation.switches?.aggregateEntities ? 'aggregation_entity_code' : 'entity_code';
  }

  getPeriodField() {
    return this.aggregation.switches?.groupByPeriodField
      ? this.aggregation.switches?.groupByPeriodField
      : 'day_period';
  }

  getCommonFields() {
    return [this.getEntityCodeField(), this.getPeriodField(), 'data_element_code'];
  }

  getEntityCommonTableExpression() {
    // if mapping from one set of entities to another, include the mapped codes as "aggregation_entity_code"
    const isAggregatingEntities = this.isAggregating && this.aggregation.switches.aggregateEntities;
    const entityMap = isAggregatingEntities && this.aggregation.config.orgUnitMap;
    const columns = isAggregatingEntities ? ['code', 'aggregation_entity_code'] : ['code'];
    const rows = isAggregatingEntities
      ? Object.entries(entityMap).map(([key, value]) => [key, value.code])
      : this.entityCodes.map(entityCode => [entityCode]);

    return `
      WITH entity_codes_and_relations (${columns.join(', ')})
      AS (${this.parameteriseValues(rows)})
    `;
  }

  getAliasedColumns() {
    return [
      `${this.getEntityCodeField()} AS "entityCode"`,
      `${this.getPeriodField()} AS "period"`,
      'data_element_code AS "dataElementCode"',
      'value',
      'type',
    ].join(', ');
  }

  getA1Select() {
    if (!this.isAggregating) {
      return `SELECT ${[...this.getCommonFields(), ...ANSWER_SPECIFIC_FIELDS].join(', ')}`;
    }
    const { sum, getLatestPerPeriod } = this.aggregation.switches;
    const fields = [...this.getCommonFields()];

    if (sum) {
      fields.push('SUM(value::NUMERIC)::text as value');
      fields.push('MAX(type) as type');
      if (!getLatestPerPeriod) {
        fields.push('MAX(date) as date');
      }
    }
    return `SELECT ${fields.join(', ')}`;
  }

  getA1InnerJoins() {
    const joins = [
      'INNER JOIN entity_codes_and_relations ON entity_codes_and_relations.code = analytics.entity_code',
      this.createInnerJoin(this.dataElementCodes, 'data_element_code'),
    ];
    if (this.period) {
      const periodWhereClauseParts = convertPeriodStringIntoWhereClauseParts(this.period);
      periodWhereClauseParts.forEach(([periodField, periods]) =>
        joins.push(this.createInnerJoin(periods, periodField)),
      );
    }
    return joins.join('\n');
  }

  getPeriodConditionsAndParams() {
    const periodConditions = [];
    const periodParams = [];
    if (this.startDate) {
      periodConditions.push('date >= ?');
      periodParams.push(this.startDate);
    }
    if (this.endDate) {
      periodConditions.push('date <= ?');
      periodParams.push(this.endDate);
    }
    return { periodConditions, periodParams };
  }

  getA1WhereClause() {
    const { periodConditions, periodParams } = this.getPeriodConditionsAndParams();

    if (periodConditions.length === 0) return '';

    this.paramsArray.push(...periodParams);
    return `WHERE ${periodConditions.join(' AND ')}`;
  }

  getA1GroupByClause = () => {
    if (!this.isAggregating) return '';

    const groupByFields = [...this.getCommonFields()];
    return `GROUP BY ${groupByFields.join(', ')}`;
  };

  getLatestPerPeriodClause() {
    if (!this.isAggregating || !this.aggregation.switches.getLatestPerPeriod) return '';

    // add where condition for each non-calculated table selected in a1
    const joinFields = [...this.getCommonFields()];
    const joinConditions = joinFields.map(field => `${field} = a1.${field}`);

    // add start/end date clauses to limit results and speed things up
    const { periodConditions, periodParams } = this.getPeriodConditionsAndParams();
    this.paramsArray.push(...periodParams);

    const conditions = [...joinConditions, ...periodConditions];

    const fields = this.aggregation.switches.sum
      ? ANSWER_SPECIFIC_FIELDS.filter(field => field !== 'value')
      : ANSWER_SPECIFIC_FIELDS;

    return `
      CROSS JOIN LATERAL (
        SELECT ${fields}
        FROM analytics
        INNER JOIN entity_codes_and_relations ON entity_codes_and_relations.code = analytics.entity_code
        WHERE ${conditions.join('\n      AND ')}
        ORDER BY date DESC
        LIMIT 1
      ) as latestPerPeriod
    `;
  }

  build() {
    this.query = `
      ${this.getEntityCommonTableExpression()}
      SELECT ${this.getAliasedColumns()}
      FROM (
        ${this.getA1Select()}
        FROM analytics
          ${this.getA1InnerJoins()}
          ${this.getA1WhereClause()}
          ${this.getA1GroupByClause()}
      ) as a1
      ${this.getLatestPerPeriodClause()}
      ORDER BY date;
     `;
  }
}

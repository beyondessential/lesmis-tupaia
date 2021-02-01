/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

export class SqlQuery {
  static parameteriseArray = arr => `(${arr.map(() => '?').join(',')})`;

  static parameteriseValues = arr => `VALUES (${arr.map(() => `?`).join('), (')})`;

  constructor(baseQuery, baseParameters = []) {
    this.query = baseQuery;
    this.parameters = baseParameters;
    this.orderByClause = null;
    this.hasWhereClause = false;
  }

  wrapAs(tableDefinition) {
    this.query = `
    WITH ${tableDefinition}
    AS (${this.query})
    `;
  }

  addSelectClause(clause) {
    this.query = `
      ${this.query}
      ${clause}
    `;
  }

  addWhereClause(clause, parameters) {
    this.query = `
      ${this.query}
      ${this.hasWhereClause ? 'AND' : 'WHERE'} ${clause}
    `;
    this.parameters = this.parameters.concat(parameters);
    this.hasWhereClause = true;
  }

  addOrderByClause(orderByClause) {
    this.query = `
      ${this.query}
      ORDER BY ${orderByClause}
    `;
  }

  async executeOnDatabase(database) {
    return database.executeSql(
      `
      ${this.query}
      ${this.orderByClause ? `ORDER BY ${this.orderByClause}` : ''};
    `,
      this.parameters,
    );
  }
}

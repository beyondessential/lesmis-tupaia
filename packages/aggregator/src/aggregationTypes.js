/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

export const AGGREGATION_TYPES = {
  COUNT_PER_ORG_GROUP: 'COUNT_PER_ORG_GROUP',
  COUNT_PER_PERIOD_PER_ORG_GROUP: 'COUNT_PER_PERIOD_PER_ORG_GROUP',
  FINAL_EACH_DAY_FILL_EMPTY_DAYS: 'FINAL_EACH_DAY_FILL_EMPTY_DAYS',
  FINAL_EACH_DAY: 'FINAL_EACH_DAY',
  FINAL_EACH_MONTH_FILL_EMPTY_MONTHS: 'FINAL_EACH_MONTH_FILL_EMPTY_MONTHS',
  FINAL_EACH_MONTH_PREFER_DAILY_PERIOD: 'FINAL_EACH_MONTH_PREFER_DAILY_PERIOD', // I.e. use 20180214 over 201802
  FINAL_EACH_MONTH: 'FINAL_EACH_MONTH',
  FINAL_EACH_QUARTER_FILL_EMPTY_QUARTERS: 'FINAL_EACH_QUARTER_FILL_EMPTY_QUARTERS',
  FINAL_EACH_QUARTER: 'FINAL_EACH_QUARTER',
  FINAL_EACH_WEEK_FILL_EMPTY_WEEKS: 'FINAL_EACH_WEEK_FILL_EMPTY_WEEKS',
  FINAL_EACH_WEEK: 'FINAL_EACH_WEEK',
  FINAL_EACH_YEAR_FILL_EMPTY_YEARS: 'FINAL_EACH_YEAR_FILL_EMPTY_YEARS',
  FINAL_EACH_YEAR: 'FINAL_EACH_YEAR',
  MOST_RECENT_PER_ORG_GROUP: 'MOST_RECENT_PER_ORG_GROUP',
  MOST_RECENT: 'MOST_RECENT',
  OFFSET_PERIOD: 'OFFSET_PERIOD',
  RAW: 'RAW',
  REPLACE_ORG_UNIT_WITH_ORG_GROUP: 'REPLACE_ORG_UNIT_WITH_ORG_GROUP',
  SUM_EACH_QUARTER: 'SUM_EACH_QUARTER',
  SUM_EACH_YEAR: 'SUM_EACH_YEAR',
  SUM_EACH_MONTH: 'SUM_EACH_MONTH',
  SUM_EACH_WEEK: 'SUM_EACH_WEEK',
  SUM_MOST_RECENT_PER_FACILITY: 'SUM_MOST_RECENT_PER_FACILITY',
  SUM_PER_ORG_GROUP: 'SUM_PER_ORG_GROUP',
  SUM_PER_PERIOD_PER_ORG_GROUP: 'SUM_PER_PERIOD_PER_ORG_GROUP',
  SUM_PREVIOUS_EACH_DAY: 'SUM_PREVIOUS_EACH_DAY',
  SUM_UNTIL_CURRENT_DAY: 'SUM_UNTIL_CURRENT_DAY',
  SUM: 'SUM',
};

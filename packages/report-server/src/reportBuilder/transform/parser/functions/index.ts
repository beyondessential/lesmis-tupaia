/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { value, eq, notEq, exists, notExists, gt, length, any, all } from './basic';
import {
  orgUnitCodeToName,
  dataElementCodeToName,
  orgUnitIdToCode,
  orgUnitAttribute,
} from './context';
import {
  convertToPeriod,
  dateStringToPeriod,
  periodToTimestamp,
  periodToDisplayString,
  formatAsFractionAndPercentage,
} from './utils';
import { add, divide, equal, unequal } from './math';
import { orderedSet, bitOr, sum, subtract, range, mean, last } from './factory';

/**
 * Custom functions to be imported into mathjs
 */
export const customFunctions = {
  value,
  eq,
  notEq,
  gt,
  exists,
  notExists,
  length,
  convertToPeriod,
  dateStringToPeriod,
  periodToTimestamp,
  periodToDisplayString,
  formatAsFractionAndPercentage,
  any,
  all,
};

export const contextFunctions = {
  orgUnitIdToCode: orgUnitIdToCode.func,
  orgUnitCodeToName: orgUnitCodeToName.func,
  dataElementCodeToName: dataElementCodeToName.func,
  orgUnitAttribute: orgUnitAttribute.func,
};

export const contextFunctionDependencies = {
  orgUnitIdToCode: orgUnitIdToCode.dependencies,
  orgUnitCodeToName: orgUnitCodeToName.dependencies,
  dataElementCodeToName: dataElementCodeToName.dependencies,
  orgUnitAttribute: orgUnitAttribute.dependencies,
};

/**
 * Functions to extend existing mathjs functions
 */
export const functionExtensions = {
  add,
  divide,
};

/**
 * Functions to override existing mathjs functions
 */
export const functionOverrides = {
  equal,
  unequal,
};

/**
 * Functions to override existing mathjs functions
 */
export const factoryFunctions = {
  orderedSet,
  sum,
  bitOr,
  subtract,
  range,
  mean,
  last,
};

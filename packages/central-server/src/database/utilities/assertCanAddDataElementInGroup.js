/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

const areBothDefinedAndDifferent = (a, b) => a !== undefined && b !== undefined && a !== b;

const areDifferentAllowingNull = (a, b) => {
  if (a === null && b === null) return false;
  if (a === null && b !== null) return true;
  if (a !== null && b === null) return true;
  return a !== b;
};

const constructErrorMessage = ({
  property,
  newValue,
  dataElementCode,
  otherGroupCode,
  otherValue,
}) =>
  `Cannot set ${property} to '${newValue}': data element '${dataElementCode}' is included in data group '${otherGroupCode}', which has ${property}: '${otherValue}'. These must match.`;

export const assertCanAddDataElementInGroup = async (
  models,
  dataElementCode,
  dataGroupCode,
  updatedFields = {},
) => {
  const { service_type: newServiceType, config: newConfig = {} } = updatedFields;

  const dataElement = await models.dataSource.findOne({ code: dataElementCode });
  const dataGroups = await models.dataSource.getDataGroupsThatIncludeElement({
    code: dataElementCode,
  });
  const otherDataGroups = dataGroups.filter(({ code }) => code !== dataGroupCode);
  otherDataGroups.forEach(otherDataGroup => {
    const { service_type: otherServiceType, config: otherConfig } = otherDataGroup;

    // Tupaia data elements can be in either dhis or tupaia data groups
    if (
      dataElement.service_type !== 'tupaia' &&
      areBothDefinedAndDifferent(otherServiceType, newServiceType)
    ) {
      throw new Error(
        constructErrorMessage({
          property: 'service type',
          newValue: newServiceType,
          dataElementCode,
          otherGroupCode: otherDataGroup.code,
          otherValue: otherServiceType,
        }),
      );
    }

    if (areDifferentAllowingNull(otherConfig.dhisInstanceCode, newConfig.dhisInstanceCode)) {
      throw new Error(
        constructErrorMessage({
          property: 'DHIS server',
          newValue: newConfig.dhisInstanceCode,
          dataElementCode,
          otherGroupCode: otherDataGroup.code,
          otherValue: otherConfig.dhisInstanceCode,
        }),
      );
    }
  });
};

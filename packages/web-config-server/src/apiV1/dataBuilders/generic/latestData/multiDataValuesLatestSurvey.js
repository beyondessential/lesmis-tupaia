import { getDataElementFromId, getOptionSetOptions, findLatestPeriod } from '/apiV1/utils';

export const multiDataValuesLatestSurvey = async (
  { dataBuilderConfig, query },
  aggregator,
  dhisApi,
) => {
  const { surveyDataElementCode } = dataBuilderConfig;
  const surveyDatesResponseDataValues = await dhisApi.getDataValuesInSets(
    { dataElementGroupCode: surveyDataElementCode },
    query,
  );
  const latestPeriod = findLatestPeriod(surveyDatesResponseDataValues);
  if (!latestPeriod) {
    return null;
  }
  const dataValues = await dhisApi.getDataValuesInSets(dataBuilderConfig, {
    ...query,
    period: latestPeriod,
  });
  const returnData = [];
  if (dataValues) {
    await Promise.all(
      dataValues.map(async ({ dataElement: dataElementId, value, period }) => {
        const { name: dataElementName, optionSet } = await getDataElementFromId(
          dhisApi,
          dataElementId,
        );
        let valueToUse = value;
        if (optionSet && optionSet.id) {
          const options = await getOptionSetOptions(dhisApi, { id: optionSet.id });
          valueToUse = options[value];
        }

        // There could be multiple surveys completed within the given period,
        // should find the most recent one and use that.
        const duplicateIndex = returnData.findIndex(data => data.dataElement === dataElementId);
        if (duplicateIndex > -1 && returnData[duplicateIndex].period < period) {
          returnData[duplicateIndex] = {
            name: dataElementName || dataElementId,
            dataElement: dataElementId,
            value: valueToUse,
            period,
          };
        } else if (duplicateIndex === -1) {
          // no duplicate, push this value.
          returnData.push({
            name: dataElementName || dataElementId,
            dataElement: dataElementId,
            value: valueToUse,
            period,
          });
        }
      }),
    );
  }
  return { data: returnData };
};

/*
FROM:

{
  "dataValues": [
    {
      "dataElement": "IjcqInEsg7L",
      "period": "20180214",
      "orgUnit": "HbaYGfQtD4Q",
      "categoryOptionCombo": "HllvX50cXC0",
      "attributeOptionCombo": "HllvX50cXC0",
      "value": "https://tupaia.s3.amazonaws.com/uploads/images/1518645718357_317304.png",
      "storedBy": "TupaiaApp",
      "created": "2018-02-14T22:59:44.000+0000",
      "lastUpdated": "2018-02-14T22:59:44.000+0000",
      "followUp": false
    },
    {
      "dataElement": "LcWFBuWRA5A",
      "period": "20180214",
      "orgUnit": "HbaYGfQtD4Q",
      "categoryOptionCombo": "HllvX50cXC0",
      "attributeOptionCombo": "HllvX50cXC0",
      "value": "https://tupaia.s3.amazonaws.com/uploads/images/1518645718376_359169.png",
      "storedBy": "TupaiaApp",
      "created": "2018-02-14T22:59:44.000+0000",
      "lastUpdated": "2018-02-14T22:59:44.000+0000",
      "followUp": false
    },
    {
      "dataElement": "bjX5sjEWsyE",
      "period": "20180214",
      "orgUnit": "HbaYGfQtD4Q",
      "categoryOptionCombo": "HllvX50cXC0",
      "attributeOptionCombo": "HllvX50cXC0",
      "value": "https://tupaia.s3.amazonaws.com/uploads/images/1518645718379_14885.png",
      "storedBy": "TupaiaApp",
      "created": "2018-02-14T22:59:44.000+0000",
      "lastUpdated": "2018-02-14T22:59:44.000+0000",
      "followUp": false
    }
  ]
}

TO:

"data": [
  { "dataElement": IjcqInEsg7L, "value": "https://tupaia.s3.amazonaws.com/uploads/images/1518645718357_317304.png" },
  { "dataElement": LcWFBuWRA5A, "value": "https://tupaia.s3.amazonaws.com/uploads/images/1518645718376_359169.png" },
  { "dataElement": bjX5sjEWsyE, "value": "https://tupaia.s3.amazonaws.com/uploads/images/1518645718379_14885.png" },
]

*/

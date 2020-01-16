import xlsx from 'xlsx';
import { respond } from '../respond';
import { DatabaseError } from '../errors';
import { ObjectValidator, fieldHasContent } from '../validation';
import { generateId } from '@tupaia/database';

const TAB_NAMES = {
  DISASTER: 'Disaster',
  DISASTER_EVENT: 'DisasterEvent',
  ENTITY: 'Entity',
};

const disasterFieldValidators = {
  id: [fieldHasContent],
  type: [fieldHasContent],
  description: [fieldHasContent],
  name: [fieldHasContent],
  countryCode: [fieldHasContent],
};

const entityFieldValidators = {
  id: [],
  point: [fieldHasContent],
  bounds: [fieldHasContent],
};

const disasterEventFieldValidators = {
  id: [fieldHasContent],
  date: [fieldHasContent],
  type: [fieldHasContent],
  organisationUnitCode: [fieldHasContent],
  disasterId: [fieldHasContent],
};

export async function importDisaster(req, res) {
  const { models } = req;

  try {
    const workbook = xlsx.readFile(req.file.path);

    const getDataAndValidate = async (sheet, validater) => {
      const sheetData = xlsx.utils.sheet_to_json(sheet);
      const createDisasterValidater = new ObjectValidator(validater);

      await createDisasterValidater.validate(sheetData[0]);
      return sheetData;
    };

    await models.wrapInTransaction(async transactingModels => {
      for (const disasterSheet of Object.entries(workbook.Sheets)) {
        const [tabName, sheet] = disasterSheet;

        switch (tabName) {
          case TAB_NAMES.DISASTER: {
            const sheetData = await getDataAndValidate(sheet, disasterFieldValidators);

            await transactingModels.disaster.updateOrCreate(
              {
                id: sheetData[0].id,
              },
              sheetData[0],
            );
            break;
          }
          case TAB_NAMES.DISASTER_EVENT: {
            const sheetData = await getDataAndValidate(sheet, disasterEventFieldValidators);
            await transactingModels.disasterEvent.updateOrCreate(
              {
                id: sheetData[0].id,
              },
              sheetData[0],
            );

            break;
          }
          case TAB_NAMES.ENTITY: {
            const sheetData = await getDataAndValidate(sheet, entityFieldValidators);
            const initialUpdate = sheetData;

            await transactingModels.entity.updateOrCreate(
              {
                id: sheetData[0].id,
              },
              sheetData[0],
            );

            break;
          }
          default:
          //just ignore this
        }
      }
    });
  } catch (error) {
    if (error.respond) {
      throw error; // Already a custom error with a responder
    } else {
      throw new DatabaseError('importing disaster sets', error);
    }
  }
  respond(res, { message: 'Imported disaster details' });
}

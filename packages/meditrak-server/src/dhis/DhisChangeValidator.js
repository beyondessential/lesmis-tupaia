/**
 * Tupaia MediTrak
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd
 */

import { ChangeValidator } from '../externalApiSync';

export class DhisChangeValidator extends ChangeValidator {
  queryValidSurveyResponseIds = async (surveyResponseIds, excludeEventBased = false) => {
    const nonPublicDemoLandUsers = [
      (
        await this.models.database.executeSql(
          `
          SELECT DISTINCT user_id
          FROM user_country_permission
          JOIN country ON country.id = user_country_permission.country_id
          JOIN permission_group ON permission_group.id = user_country_permission.permission_group_id
          WHERE country.code = 'DL'
          AND permission_group.name <> 'Public';
        `,
        )
      ).map(r => r.user_id)[0],
    ];
    const results = await this.models.database.executeSql(
      `
        SELECT DISTINCT survey_response.id as id
        FROM survey_response
        JOIN survey ON survey_response.survey_id = survey.id
        JOIN entity ON survey_response.entity_id = entity.id
        WHERE survey.integration_metadata::text LIKE '%"dhis2":%'
        AND (
          entity.country_code <> 'DL'
          OR survey_response.user_id IN (${nonPublicDemoLandUsers.map(id => `'${id}'`).join(',')})
        )
        ${
          excludeEventBased
            ? `
              AND survey.can_repeat = FALSE
              AND entity.type IN ('facility','region','country','world','village')
              `
            : ''
        }
        AND survey_response.id IN (${surveyResponseIds.map(id => `'${id}'`).join(',')});
      `,
    );
    return results.map(r => r.id);
  };

  getValidDeletes = async changes => {
    return this.getPreviouslySyncedDeletes(changes, [
      this.models.dhisSyncQueue,
      this.models.dhisSyncLog,
    ]);
  };

  getValidAnswerUpdates = async answerIds => {
    if (answerIds.length === 0) return [];
    const answers = await this.models.answer.find({
      id: answerIds,
    });
    const surveyResponseIds = this.getUniqueEntries(answers.map(a => a.survey_response_id));

    // check which survey responses are valid
    const validSurveyResponseIds = new Set(
      await this.queryValidSurveyResponseIds(surveyResponseIds, true),
    );

    // return the answers that are part of a valid survey response
    return answers.filter(a => validSurveyResponseIds.has(a.survey_response_id)).map(a => a.id);
  };

  getValidSurveyResponseUpdates = async surveyResponseIds => {
    if (surveyResponseIds.length === 0) return [];
    return this.queryValidSurveyResponseIds(surveyResponseIds);
  };

  getValidUpdates = async changes => {
    const updateChanges = this.getUpdateChanges(changes);
    const validEntities = this.getIdsFromChangesForModel(updateChanges, this.models.entity); // all entity updates are valid
    const validAnswers = await this.getValidAnswerUpdates(
      this.getIdsFromChangesForModel(updateChanges, this.models.answer),
    );
    const validSurveyResponses = await this.getValidSurveyResponseUpdates(
      this.getIdsFromChangesForModel(updateChanges, this.models.surveyResponse),
    );
    return this.filterChangesWithMatchingIds(changes, [
      ...validEntities,
      ...validAnswers,
      ...validSurveyResponses,
    ]);
  };
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { yup, yupUtils } from '../../validation';

describe('DescribableLazy', () => {
  it('works with array and string schemas', () => {
    const humanValidator = yup.string().oneOf(['human', 'zombie']);
    const groupOfHumanValidator = yup.array().of(humanValidator);
    const paramsValidator = yupUtils.describableLazy(
      value => {
        if (typeof value === 'string') {
          return humanValidator;
        }
        return groupOfHumanValidator;
      },
      [humanValidator, groupOfHumanValidator], // this array contains all possible yup schemas in the lazy function.
    );
    expect(paramsValidator.describe()).toStrictEqual({
      oneOf: [
        { enum: ['human', 'zombie'] },
        {
          type: 'array',
          items: { enum: ['human', 'zombie'] },
        },
      ],
    });
  });
});

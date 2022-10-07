/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { NextFunction, Request, Response } from 'express';
import { createDataTableService } from '../dataTableService';

/**
 * Finds the requested dataTable and attaches it to the context
 * Checks for permissions
 */
export const attachDataTableToContext = async (
  req: Request<{ dataTableCode: string }, any, any, any>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accessPolicy, models, params, ctx } = req;
    const { dataTableCode } = params;
    const dataTable = await models.dataTable.findOne({ code: dataTableCode });
    if (!dataTable) {
      throw new Error(`No data-table found with code ${dataTableCode}`);
    }

    const permissionGroups = dataTable.permission_groups;

    if (
      !(
        permissionGroups.includes('*') ||
        permissionGroups.some(permissionGroup => accessPolicy.allowsAnywhere(permissionGroup))
      )
    ) {
      throw new Error(`User does not have permission to access data table ${dataTable.code}`);
    }

    req.ctx.dataTable = dataTable;
    req.ctx.dataTableService = createDataTableService(dataTable, models, ctx.services);

    next();
  } catch (error) {
    next(error);
  }
};

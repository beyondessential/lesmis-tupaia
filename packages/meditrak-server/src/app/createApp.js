/**
 * Tupaia MediTrak
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import errorHandler from 'api-error-handler';

import { Authenticator } from '@tupaia/auth';
import { sessionCookie } from '@tupaia/server-boilerplate';

import { addRoutesToApp } from './addRoutesToApp';

/**
 * Set up express server with middleware,
 */
export function createApp(database, models) {
  const app = express();

  /**
   * Add middleware
   */
  app.use(
    cors({
      origin: true,
      credentials: true, // credentials needs to be set for cookies to save
    }),
  );
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(errorHandler());
  app.use(sessionCookie());

  /**
   * Add singletons to be attached to req for every route
   */
  const authenticator = new Authenticator(models);
  app.use((req, res, next) => {
    req.database = database;
    req.models = models;
    req.authenticator = authenticator;
    next();
  });

  /**
   * Add all routes to the app
   */
  addRoutesToApp(app);

  return app;
}

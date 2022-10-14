/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { render as renderReactApp } from 'react-dom';
import 'react-table/react-table.css';
import { EnvBanner } from '@tupaia/ui-components';
import AdminPanel from './App';
import { VizBuilderProviders } from './utilities/VizBuilderProviders';
import { AdminPanelProviders } from './utilities/AdminPanelProviders';
import { StoreProvider } from './utilities/StoreProvider';
import { Footer, Navbar } from './widgets';
import { TupaiaApi } from './api';

const VizBuilder = lazy(() => import('./VizBuilderApp'));

const disableReactDevTools = () => {
  const globalDevtoolsReactHook = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
  // Check if the React Developer Tools global hook exists
  if (typeof window[globalDevtoolsReactHook] !== 'object') {
    return;
  }
  const reactHookKeys = Object.keys(window[globalDevtoolsReactHook]);
  reactHookKeys.forEach(prop => {
    if (prop !== 'renderers') {
      // Replace all of its properties, except 'renderers' with a no-op function or a null value
      // depending on their types

      window[globalDevtoolsReactHook][prop] =
        typeof window[globalDevtoolsReactHook][prop] === 'function' ? () => {} : null;
    }
  });
};

if (process.env.NODE_ENV === 'production') {
  disableReactDevTools();
}

const api = new TupaiaApi();

renderReactApp(
  <Router>
    <Suspense fallback={<div>loading...</div>}>
      {/* Store provider applied above routes so that it always persists auth state */}
      <StoreProvider api={api} persist>
        <EnvBanner />
        <Switch>
          <Route path="/viz-builder">
            <VizBuilderProviders>
              <VizBuilder Navbar={Navbar} Footer={Footer} />
            </VizBuilderProviders>
          </Route>
          <Route path="/">
            <AdminPanelProviders>
              <AdminPanel />
            </AdminPanelProviders>
          </Route>
          <Redirect to="/login" />
        </Switch>
      </StoreProvider>
    </Suspense>
  </Router>,
  document.getElementById('root'),
);

if (module.hot) {
  module.hot.accept();
}

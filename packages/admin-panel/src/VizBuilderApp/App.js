/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect } from 'react-router-dom';
import { FullPageLoader } from '@tupaia/ui-components';
import { Main } from './views/Main';
import { CreateNew } from './views/CreateNew';
import { useUser } from './api/queries';
import { VizBuilderConfigProvider as StateProvider } from './vizBuilderConfigStore';

const Container = styled.main`
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
  min-height: 100vh;
`;

export const App = ({ Navbar, Footer }) => {
  const { data, isLoading: isUserLoading, isBESAdmin } = useUser();

  if (isUserLoading) {
    return <FullPageLoader />;
  }

  if (!isBESAdmin) {
    return <Redirect to="/" />;
  }

  const user = { ...data, name: `${data.firstName} ${data.lastName}` };

  return (
    <StateProvider>
      <Container>
        {Navbar && <Navbar user={user} isBESAdmin={isBESAdmin} />}
        <Switch>
          <Route path="/viz-builder/new" exact component={CreateNew} />
          <Route path="/viz-builder/:visualisationId?" component={Main} />
        </Switch>
        {Footer && <Footer />}
      </Container>
    </StateProvider>
  );
};

App.propTypes = {
  Navbar: PropTypes.any,
  Footer: PropTypes.any,
};

App.defaultProps = {
  Navbar: null,
  Footer: null,
};

/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import React, { useState, useEffect } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MuiContainer from '@material-ui/core/Container';
import CircularProgress from '@material-ui/core/CircularProgress';
import { FlexColumn, SmallAlert } from '@tupaia/ui-components';

import { useVizBuilderConfig } from '../vizBuilderConfigStore';
import { useDashboardVisualisation } from '../api';
import { Toolbar, Panel, PreviewSection, PreviewOptions } from '../components';

const Container = styled(MuiContainer)`
  flex: 1;
  display: flex;
  align-items: stretch;
`;

const RightCol = styled(FlexColumn)`
  padding-left: 30px;
  flex: 1;
`;

const StyledAlert = styled(SmallAlert)`
  margin-top: 30px;
  margin: auto;
`;

const Progress = styled(CircularProgress)`
  margin-top: 30px;
  margin: auto;
`;

// Todo: add warning on page unload https://github.com/jacobbuck/react-beforeunload#readme
export const Main = ({ match }) => {
  const { visualisationId } = match.params;

  // do not fetch existing viz if no visualisationId is provided in the params
  const fetchExistingVizEnabled = visualisationId !== undefined;

  const [_, { setVisualisation }] = useVizBuilderConfig();
  const [enabled, setEnabled] = useState(false);
  const [visualisationLoaded, setVisualisationLoaded] = useState(false);
  const { data = {}, error } = useDashboardVisualisation(visualisationId, fetchExistingVizEnabled);
  const { visualisation } = data;

  useEffect(() => {
    if (visualisation) {
      setVisualisation(visualisation);
      setVisualisationLoaded(true);
    }
  }, [visualisation]);

  // Show error if failed to load an existing visualisation
  if (visualisationId && error) {
    return (
      <StyledAlert severity="error" variant="standard">
        {error.message}
      </StyledAlert>
    );
  }

  // Wait until visualisation is loaded to populated the field correctly if we are viewing an existing viz
  if (visualisationId && !visualisationLoaded) {
    return <Progress size={100} />;
  }

  return (
    <>
      <Toolbar />
      <Container maxWidth="xl">
        <Panel setEnabled={setEnabled} />
        <RightCol>
          <PreviewOptions />
          <PreviewSection enabled={enabled} setEnabled={setEnabled} />
        </RightCol>
      </Container>
      <Prompt message="Are you sure you want to exit the Viz Builder? Your options will not be saved so make sure you have exported your configuration." />
    </>
  );
};

Main.propTypes = {
  match: PropTypes.shape({ params: PropTypes.object }).isRequired,
};

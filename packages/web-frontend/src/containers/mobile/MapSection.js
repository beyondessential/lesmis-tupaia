/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Map } from '../Map';
import { MapOverlayBar } from './MapOverlayBar/MapOverlayBar';

const MapSectionContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const MapSection = ({ appHeaderHeight }) => {
  return (
    <MapSectionContainer>
      <Map showZoomControl={false} />
      <MapOverlayBar appHeaderHeight={appHeaderHeight} />
    </MapSectionContainer>
  );
};

MapSection.propTypes = {
  appHeaderHeight: PropTypes.number.isRequired,
};

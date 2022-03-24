/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import shallowEqual from 'shallowequal';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Button from '@material-ui/core/Button';

import { setMapOverlays, clearMeasure } from '../../../actions';
import { selectCurrentMapOverlayCodes } from '../../../selectors';
import { MAP_OVERLAY_SELECTOR, MOBILE_BACKGROUND_COLOR, LEAFLET_Z_INDEX } from '../../../styles';
import { MapOverlayHierarchy } from '../../../components/MapOverlayHierarchy';

const LibraryContainer = styled.div`
  position: absolute;
  top: ${p => p.$appHeaderHeight}px;
  left: 0;
  right: 0;
  min-height: calc(100vh - ${p => p.$appHeaderHeight}px);
  z-index: ${LEAFLET_Z_INDEX + 3};
  background: ${MOBILE_BACKGROUND_COLOR};
`;

const LibraryContent = styled.div`
  padding: 10px 24px;
`;

const LibraryHeader = styled(Button)`
  background: ${MAP_OVERLAY_SELECTOR.subBackground};
  border-radius: 0;
  width: 100%;
  text-transform: none;
  font-size: 18px;
  font-weight: 500;
  padding: 16px;
`;

const BackIcon = styled(ArrowBackIcon)`
  position: absolute;
  left: 22px;
`;

const MapOverlayLibraryComponent = ({
  appHeaderHeight,
  currentMapOverlayCodes,
  hierarchyData,
  onSetMapOverlay,
  onClearMapOverlay,
  onClose,
}) => {
  const handleSelectMapOverlay = ({ mapOverlayCode }, isSelected) => {
    if (isSelected) {
      onClearMapOverlay();
    } else {
      onSetMapOverlay(mapOverlayCode);
    }
    onClose();
  };

  return (
    <LibraryContainer $appHeaderHeight={appHeaderHeight}>
      <LibraryHeader onClick={onClose}>
        <BackIcon />
        Overlay Library
      </LibraryHeader>
      <LibraryContent>
        <MapOverlayHierarchy
          hierarchyData={hierarchyData}
          onSelectMapOverlay={handleSelectMapOverlay}
          currentMapOverlayCodes={currentMapOverlayCodes}
        />
      </LibraryContent>
    </LibraryContainer>
  );
};

MapOverlayLibraryComponent.propTypes = {
  appHeaderHeight: PropTypes.number.isRequired,
  currentMapOverlayCodes: PropTypes.arrayOf(PropTypes.string),
  hierarchyData: PropTypes.array.isRequired,
  onSetMapOverlay: PropTypes.func.isRequired,
  onClearMapOverlay: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

MapOverlayLibraryComponent.defaultProps = {
  currentMapOverlayCodes: [],
};

const mapStateToProps = state => {
  const { mapOverlayHierarchy } = state.mapOverlayBar;
  const currentMapOverlayCodes = selectCurrentMapOverlayCodes(state);

  return {
    currentMapOverlayCodes,
    hierarchyData: mapOverlayHierarchy,
  };
};

const mapDispatchToProps = dispatch => ({
  onSetMapOverlay: mapOverlayCode => dispatch(setMapOverlays(mapOverlayCode)),
  onClearMapOverlay: () => dispatch(clearMeasure()),
});

function shouldComponentUpdate(prevProps, nextProps) {
  const propsAreUnchanged = shallowEqual(prevProps, nextProps);
  if (propsAreUnchanged) return true;
  return false;
}

export const MapOverlayLibrary = connect(
  mapStateToProps,
  mapDispatchToProps,
)(React.memo(MapOverlayLibraryComponent, shouldComponentUpdate));

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';
import { FlexSpaceBetween } from '@tupaia/ui-components';
import RightArrow from '@material-ui/icons/ArrowForwardIos';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';

import { setMapOverlays, clearMeasure } from '../../../actions';
import {
  selectCurrentMapOverlays,
  selectMapOverlayEmptyMessage,
  selectHasMapOverlays,
} from '../../../selectors';
import { MAP_OVERLAY_SELECTOR } from '../../../styles';
import { MapOverlayLibrary } from './MapOverlayLibrary';

const CollapsedContainer = styled(FlexSpaceBetween)`
  width: 100%;
  color: white;
  background: ${MAP_OVERLAY_SELECTOR.subBackground};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 18px;
  margin-right: 18px;
  margin-top: 18px;
  height: 72px;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.p`
  font-size: 14px;
  font-weight: 700;
  margin: 0;
`;

const LoadingSpinner = styled(CircularProgress)`
  color: white;
  margin-left: 10px;
`;

const SelectedLabel = styled.div`
  display: flex;
  flex: 1;
  margin-left: 18px;
  font-weight: 500;
  align-items: center;
  font-size: 12px;
`;

const SelectedText = styled.span`
  margin-left: 11px;
`;

const EmptyText = styled.span``;

const RightArrowIconWrapper = styled.div`
  padding: 0 14px 0 5px;
`;

const MapOverlayBarComponent = ({
  emptyMessage,
  hasMapOverlays,
  currentMapOverlay,
  isLoading,
  appHeaderHeight,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const openLibrary = useCallback(() => setIsLibraryOpen(true), []);
  const closeLibrary = useCallback(() => setIsLibraryOpen(false), []);

  return (
    <>
      <CollapsedContainer onClick={hasMapOverlays && openLibrary}>
        <Content>
          <TitleContainer>
            <Title>Map Overlay</Title>
            {isLoading && <LoadingSpinner size={16} />}
          </TitleContainer>
          <SelectedLabel>
            {currentMapOverlay ? (
              <>
                <RadioButtonCheckedIcon fontSize="inherit" />
                <SelectedText>{currentMapOverlay.name}</SelectedText>
              </>
            ) : (
              <EmptyText>{emptyMessage}</EmptyText>
            )}
          </SelectedLabel>
        </Content>
        {hasMapOverlays && (
          <RightArrowIconWrapper>
            <RightArrow />
          </RightArrowIconWrapper>
        )}
      </CollapsedContainer>
      {isLibraryOpen && (
        <MapOverlayLibrary onClose={closeLibrary} appHeaderHeight={appHeaderHeight} />
      )}
    </>
  );
};

MapOverlayBarComponent.propTypes = {
  appHeaderHeight: PropTypes.number.isRequired,
  currentMapOverlay: PropTypes.shape({
    name: PropTypes.string,
  }),
  emptyMessage: PropTypes.string,
  hasMapOverlays: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

MapOverlayBarComponent.defaultProps = {
  currentMapOverlay: null,
  emptyMessage: null,
};

const mapStateToProps = state => {
  const { isMeasureLoading } = state.map;
  const { isLoadingOrganisationUnit } = state.global;

  // limited to one currently selected overlay on mobile
  const currentMapOverlays = selectCurrentMapOverlays(state);
  const currentMapOverlay = currentMapOverlays.length > 0 ? currentMapOverlays[0] : null;

  return {
    isLoading: isMeasureLoading || isLoadingOrganisationUnit,
    currentMapOverlay,
    emptyMessage: selectMapOverlayEmptyMessage(state),
    hasMapOverlays: selectHasMapOverlays(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onSetMapOverlay: mapOverlayCode => dispatch(setMapOverlays(mapOverlayCode)),
  onClearMeasure: () => dispatch(clearMeasure()),
});

export const MapOverlayBar = connect(
  mapStateToProps,
  mapDispatchToProps,
)(React.memo(MapOverlayBarComponent));

/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Leaflet from 'leaflet';
import {
  MapContainer,
  TileLayer,
  MarkerLayer,
  Polygon,
  Legend,
  TilePicker as TilePickerComponent,
} from '@tupaia/ui-components/lib/map';
import { MapOverlaysPanel } from '../components';
import { useMapOverlayReportData, useMapOverlaysData } from '../api';
import { TILE_SETS } from '../constants';
import { useUrlParams } from '../utils';

const Container = styled.div`
  position: relative;
  z-index: 1; // make sure the map is under the site menus & search
  display: flex;
  height: calc(100vh - 265px);
  min-height: 600px;
`;

const Main = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

const Map = styled(MapContainer)`
  flex: 1;
  height: 100%;
`;

const MapInner = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  z-index: 999;
  pointer-events: none;
`;

const LegendContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 0px 0.6rem 0.375rem;
`;

const TilePicker = styled(TilePickerComponent)`
  pointer-events: none;
`;

export const MapView = () => {
  const { entityCode } = useUrlParams();
  const [activeTileSetKey, setActiveTileSetKey] = useState(TILE_SETS[0].key);

  const { data: overlaysData, isLoading } = useMapOverlaysData({ entityCode });

  const {
    data: overlayReportData,
    entityData,
    hiddenValues,
    setValueHidden,
    selectedOverlay,
    setSelectedOverlay,
  } = useMapOverlayReportData(entityCode);

  const handleLocationChange = useCallback(
    (map, bounds) => {
      const mapBoxBounds = Leaflet.latLngBounds(bounds);
      const maxBounds = mapBoxBounds.pad(2);
      map.setMaxBounds(maxBounds);
    },
    [Leaflet],
  );

  const activeTileSet = TILE_SETS.find(tileSet => tileSet.key === activeTileSetKey);

  return (
    <Container>
      <MapOverlaysPanel
        isLoading={isLoading}
        overlays={overlaysData}
        selectedOverlay={selectedOverlay}
        setSelectedOverlay={setSelectedOverlay}
      />
      <Main>
        <Map
          bounds={entityData ? entityData.bounds : null}
          onLocationChange={handleLocationChange}
          dragging
        >
          <TileLayer tileSetUrl={activeTileSet.url} />
          <MarkerLayer
            measureData={overlayReportData ? overlayReportData.measureData : null}
            serieses={overlayReportData ? overlayReportData.serieses : null}
          />
          <Polygon entity={entityData} />
        </Map>
        <MapInner>
          <LegendContainer>
            {overlayReportData && overlayReportData.serieses && (
              <Legend
                serieses={overlayReportData.serieses}
                setValueHidden={setValueHidden}
                hiddenValues={hiddenValues}
              />
            )}
          </LegendContainer>
          <TilePicker
            tileSets={TILE_SETS}
            activeTileSet={activeTileSet}
            onChange={setActiveTileSetKey}
          />
        </MapInner>
      </Main>
    </Container>
  );
};

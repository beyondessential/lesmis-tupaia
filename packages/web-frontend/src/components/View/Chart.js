/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartComponent,
  CHART_TYPES,
  parseChartConfig,
  getIsTimeSeries,
  isDataKey,
} from '@tupaia/ui-components/lib/chart';
import { VIEW_CONTENT_SHAPE } from './propTypes';
import { ViewTitle } from './Typography';
import { ChartContainer, ChartViewContainer } from './Layout';

const removeNonNumericData = data =>
  data.map(dataSeries => {
    const filteredDataSeries = {};
    Object.entries(dataSeries).forEach(([key, value]) => {
      if (!isDataKey(key) || !Number.isNaN(Number(value))) {
        filteredDataSeries[key] = value;
      }
    });
    return filteredDataSeries;
  });

const getViewContent = ({ viewContent }) => {
  const { chartConfig, data } = viewContent;
  const massagedData = sortData(removeNonNumericData(data));
  return chartConfig
    ? {
        ...viewContent,
        data: massagedData,
        chartConfig: parseChartConfig(viewContent),
      }
    : { ...viewContent, data: massagedData };
};

const sortData = data =>
  getIsTimeSeries(data) ? data.sort((a, b) => a.timestamp - b.timestamp) : data;

export const Chart = ({ viewContent, isEnlarged, isExporting, onItemClick }) => {
  const viewContentConfig = getViewContent({ viewContent });
  const { chartType } = viewContent;

  if (!Object.values(CHART_TYPES).includes(chartType)) {
    return <ViewTitle variant="h2">New chart coming soon</ViewTitle>;
  }

  return (
    <ChartViewContainer>
      <ChartContainer>
        <ChartComponent
          isEnlarged={isEnlarged}
          isExporting={isExporting}
          viewContent={viewContentConfig}
          onItemClick={onItemClick}
        />
      </ChartContainer>
    </ChartViewContainer>
  );
};

Chart.propTypes = {
  viewContent: PropTypes.shape(VIEW_CONTENT_SHAPE),
  isEnlarged: PropTypes.bool,
  isExporting: PropTypes.bool,
  onItemClick: PropTypes.func,
};

Chart.defaultProps = {
  viewContent: null,
  isEnlarged: false,
  isExporting: false,
  onItemClick: () => {},
};
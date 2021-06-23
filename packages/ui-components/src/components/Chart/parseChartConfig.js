/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { CHART_TYPES, COLOR_PALETTES } from './constants';
import { isDataKey } from './utils';

const ADD_TO_ALL_KEY = '$all';

export const parseChartConfig = viewContent => {
  const { chartType, chartConfig, data, colorPalette: paletteName } = viewContent;
  const { [ADD_TO_ALL_KEY]: configForAllKeys, ...restOfConfig } = chartConfig;

  const baseConfig = configForAllKeys
    ? createDynamicConfig(restOfConfig, configForAllKeys, data)
    : restOfConfig;

  return addDefaultColorsToConfig(baseConfig, paletteName, chartType);
};

// Adds default colors for every element with no color defined
const addDefaultColorsToConfig = (chartConfig, paletteName, chartType) => {
  const newConfig = {};

  const palette = paletteName || getDefaultPaletteName(chartType, Object.keys(chartConfig).length);
  const colors = Object.values(COLOR_PALETTES[palette]);

  let colorId = 0;
  Object.entries(chartConfig).forEach(([key, configItem]) => {
    let { color } = configItem;
    if (!color) {
      color = colors[colorId];
      colorId = (colorId + 1) % colors.length;
    }

    newConfig[key] = { ...configItem, color };
  });

  return newConfig;
};

const getDefaultPaletteName = (chartType, numberRequired) => {
  if (chartType === CHART_TYPES.COMPOSED) {
    return 'COMPOSED_CHART_COLOR_PALETTE';
  }
  return numberRequired > Object.keys(COLOR_PALETTES.CHART_COLOR_PALETTE).length
    ? 'EXPANDED_CHART_COLOR_PALETTE'
    : 'CHART_COLOR_PALETTE';
};

const createDynamicConfig = (chartConfig, dynamicChartConfig, data) => {
  // Just find keys. Doesn't include keys which end in _metadata.
  const dataKeys = data.map(dataPoint => Object.keys(dataPoint).filter(isDataKey)).flat();
  const keys = new Set(dataKeys);

  // Add config to each key
  const newChartConfig = {};
  keys.forEach(key => {
    newChartConfig[key] = { ...dynamicChartConfig, ...chartConfig[key] };
  });
  return newChartConfig;
};
